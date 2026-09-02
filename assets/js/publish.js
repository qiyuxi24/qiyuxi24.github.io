'use strict';
/* publish.js — 发布工作台（publish.html）前端逻辑
 *
 * 本文件原为 publish.html 内联 <script>，抽出以便与页面结构解耦、独立维护。
 * 依赖（需先于本文件加载）：
 *   - Delaunator（随机封面三角网）    ./assets/vendor/delaunator/delaunator.min.js
 *   - Vditor 实例（body 中 <div id="vditor">）./assets/vendor/vditor/dist/index.js
 *
 * 2026-09-02 重构：
 *   - 元数据表单支持折叠（.meta-wrap.collapsed），只留顶部「写作设置」条，沉浸写作
 *   - 左栏文章列表面板支持折叠（.layout.side-collapsed），收起为 36px 竖条
 *   - 两处折叠状态持久化 localStorage，刷新后保持
 *   - 分类由下拉改为「输入 + 建议」（datalist），可任意新增分类，不再与页面耦合
 */

const $ = (id) => document.getElementById(id);

/* ---------------- 常量（单一事实来源，注释里标注与后端对齐关系） ---------------- */
const DEFAULT_CATEGORY = '随笔';            // 站点级默认分类：主页 script.js / reader.js 缺失分类时同样兜底「随笔」
const BASE_CATEGORIES = ['技术', '随笔', '项目', '学习']; // 建议分类（可输入任意新分类）
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;   // 与 publish-server.mjs 的 MAX_UPLOAD 保持一致
const LS_META = 'publish.ui.metaCollapsed'; // localStorage 键：元数据表单折叠态
const LS_SIDE = 'publish.ui.sideCollapsed'; // localStorage 键：文章列表面板折叠态

let posts = [];
let currentSlug = null;
let slugEdited = false;
let saving = false;
let toastTimer = null;
let vd = null;            // Vditor 实例
let vdReady = false;      // 编辑器是否初始化完成
let pendingBody = '';     // 初始化完成前暂存的正文

/* ---------------------------------------------------------------- 工具 */

function toast(msg, ms = 2800) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('读取文件失败'));
    r.readAsDataURL(file);
  });
}

function loadLS(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v === '1';
  } catch { return def; }
}
function saveLS(key, v) {
  try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* 隐私模式等场景静默 */ }
}

/* ---------------------------------------------------------------- 折叠逻辑
 * 元数据表单：form 收进 36px 折叠条；左栏：列表面板收成 36px 竖条。
 * 折叠后通知 Vditor 重新计算布局（容器尺寸变化触发一次 window resize）。 */
function relayoutEditor() {
  requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); });
}

function setMetaCollapsed(on) {
  $('meta-wrap').classList.toggle('collapsed', on);
  const b = $('btn-meta-toggle');
  b.textContent = on ? '展开' : '收起';
  saveLS(LS_META, on);
  relayoutEditor();
}

function setSideCollapsed(on) {
  $('layout').classList.toggle('side-collapsed', on);
  saveLS(LS_SIDE, on);
  relayoutEditor();
}

/* 折叠条上实时显示当前文章标题 */
function updateMetaHint() {
  const t = $('f-title').value.trim();
  $('meta-title').textContent = t ? t : '未命名文章';
}

/* ---------------------------------------------------------------- 文章列表 */

async function loadPosts() {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error(`API 返回 ${res.status}`);
  posts = await res.json();
  renderList();
  updateCategorySuggest();
}

/* 分类输入建议 = 基础分类 ∪ 已有文章用过的分类（不再硬编码进 HTML） */
function updateCategorySuggest() {
  const set = new Set(BASE_CATEGORIES);
  for (const p of posts) if (p.category) set.add(p.category);
  const dl = $('category-list');
  dl.innerHTML = '';
  for (const c of set) {
    const o = document.createElement('option');
    o.value = c;
    dl.appendChild(o);
  }
}

function renderList() {
  const kw = $('search').value.trim().toLowerCase();
  const list = posts.filter(
    (p) => !kw || p.title.toLowerCase().includes(kw) || p.slug.toLowerCase().includes(kw)
  );
  const box = $('post-list');
  box.innerHTML = '';
  $('post-count').textContent = `${posts.length} 篇文章 · ${posts.filter((p) => p.published).length} 已发布`;
  if (!list.length) {
    box.innerHTML = '<div class="empty">暂无文章，点「+ 新建文章」开始写作</div>';
    return;
  }
  for (const p of list) {
    const item = document.createElement('div');
    item.className = 'post-item' + (p.slug === currentSlug ? ' active' : '');
    const dot = document.createElement('span');
    dot.className = 'dot' + (p.published ? '' : ' off');
    const title = document.createElement('span');
    title.className = 'pi-title';
    title.textContent = p.title;
    const top = document.createElement('div');
    top.className = 'pi-top';
    top.append(dot);
    if (p.pinned) {
      const flag = document.createElement('span');
      flag.className = 'pin-flag';
      flag.textContent = '置顶';
      top.append(flag);
    }
    top.append(title);
    const meta = document.createElement('div');
    meta.className = 'pi-meta';
    meta.textContent = `${p.slug} · ${p.date}${p.category ? ' · ' + p.category : ''}`;
    const del = document.createElement('button');
    del.className = 'pi-del';
    del.textContent = '✕';
    del.title = '删除文章';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      delPost(p);
    });
    item.append(top, meta, del);
    item.addEventListener('click', () => selectPost(p.slug));
    box.appendChild(item);
  }
}

function selectPost(slug) {
  const p = posts.find((x) => x.slug === slug);
  if (!p) return;
  currentSlug = p.slug;
  slugEdited = true;
  $('f-title').value = p.title || '';
  $('f-slug').value = p.slug;
  $('f-date').value = p.date || today();
  $('f-category').value = p.category || DEFAULT_CATEGORY;
  $('f-tags').value = Array.isArray(p.tags) ? p.tags.join(', ') : '';
  $('f-summary').value = p.summary || '';
  $('f-cover').value = p.cover || '';
  $('f-pinned').checked = p.pinned === true;
  $('f-published').checked = p.published !== false;
  pendingBody = p.body || '';
  if (vdReady) vd.setValue(pendingBody);
  $('foot-info').textContent = `正在编辑：${p.slug}.md · 保存后自动更新索引与 RSS`;
  updateMetaHint();
  renderList();
}

function newPost() {
  currentSlug = null;
  slugEdited = false;
  $('f-title').value = '';
  $('f-slug').value = '';
  $('f-date').value = today();
  $('f-category').value = DEFAULT_CATEGORY;
  $('f-tags').value = '';
  $('f-summary').value = '';
  $('f-cover').value = '';
  $('f-pinned').checked = false;
  $('f-published').checked = true;
  pendingBody = '';
  if (vdReady) vd.setValue('');
  $('foot-info').textContent = '新文章（尚未保存）';
  updateMetaHint();
  renderList();
  $('f-title').focus();
}

/* ---------------------------------------------------------------- 保存 / 删除 */

async function collectAndSave(openPreview) {
  const title = $('f-title').value.trim();
  const slug = ($('f-slug').value.trim() || slugify(title)).toLowerCase();
  if (!title) return toast('请先填写标题');
  if (!slug) return toast('slug 无法自动生成，请手动填写（英文小写连字符）');
  if (saving) return;
  saving = true;
  $('btn-save').disabled = true;
  try {
    const payload = {
      meta: {
        title,
        slug,
        date: $('f-date').value || today(),
        category: $('f-category').value.trim() || DEFAULT_CATEGORY,
        tags: $('f-tags').value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        summary: $('f-summary').value.trim(),
        cover: $('f-cover').value.trim(),
        published: $('f-published').checked,
        pinned: $('f-pinned').checked,
      },
      body: vd ? vd.getValue() : pendingBody,
    };
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) return toast('保存失败：' + (data.error || '未知错误'), 4200);
    currentSlug = data.slug;
    slugEdited = true;
    toast('已保存 ' + data.file + '（索引 + RSS 已更新）');
    await loadPosts();
    updateMetaHint();
    if (openPreview) {
      window.open('./reader.html?slug=' + encodeURIComponent(data.slug), '_blank');
    }
  } catch (e) {
    toast('保存失败：' + e.message, 4200);
  } finally {
    saving = false;
    $('btn-save').disabled = false;
  }
}

async function delPost(p) {
  if (!window.confirm(`确定删除「${p.title}」（${p.slug}.md）？此操作不可恢复。`)) return;
  const res = await fetch('/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: p.slug }),
  });
  const data = await res.json();
  if (!data.ok) return toast('删除失败：' + (data.error || ''), 4200);
  if (currentSlug === p.slug) newPost();
  toast('已删除 ' + data.file + '（索引 + RSS 已更新）');
  await loadPosts();
}

/* ---------------------------------------------------------------- 图片上传（封面 / 正文插图共用） */

async function apiUpload(dataUrl, name) {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dataUrl, name }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || '上传失败');
  return data; // { path, url, name }
}

async function uploadCover(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('请选择图片文件');
  if (file.size > MAX_UPLOAD_BYTES) return toast('图片超过 8MB，请压缩后再上传');
  try {
    toast('正在上传封面…');
    const data = await apiUpload(await readAsDataURL(file), file.name);
    $('f-cover').value = data.path;
    toast('封面已上传：' + data.name);
  } catch (e) {
    toast('上传失败：' + e.message, 4200);
  }
}

/* ---------------------------------------------------------------- 随机封面
 * Delaunator（ISC）三角网 + 站点色板：左上深、右下亮，输出 SVG 上传到 assets/images/posts/ */

const COVER_PALETTES = [
  ['#17161a', '#2a2a30', '#403f48', '#f5c06a', '#e0a95c'], // 暗金
  ['#141a20', '#232f3c', '#3c4d5e', '#9fb6c8', '#c6d8e6'], // 石墨蓝
  ['#161c1a', '#22322b', '#39564a', '#9cc3a6', '#cfe4d4'], // 墨绿
  ['#1b1618', '#302226', '#57383c', '#d9a0a8', '#f0d4d8'], // 酒红
  ['#14161f', '#23263a', '#3a3f5c', '#a8aed8', '#d0d4f0'], // 靛蓝
];
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = (c) => 'rgb(' + c.map(Math.round).join(',') + ')';

function randomCoverSvg(w = 1200, h = 630) {
  const pal = COVER_PALETTES[(Math.random() * COVER_PALETTES.length) | 0].map(hexRgb);
  const cell = 55 + Math.random() * 55; // 网格密度
  const jit = 0.35 + Math.random() * 0.5; // 顶点扰动
  const pts = [];
  for (let x = -cell; x <= w + cell; x += cell)
    for (let y = -cell; y <= h + cell; y += cell)
      pts.push([
        x + (Math.random() - 0.5) * 2 * cell * jit,
        y + (Math.random() - 0.5) * 2 * cell * jit,
      ]);
  const { triangles } = Delaunator.from(pts);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;
  for (let i = 0; i < triangles.length; i += 3) {
    const a = pts[triangles[i]];
    const b = pts[triangles[i + 1]];
    const c = pts[triangles[i + 2]];
    // 网格外扩 + 顶点扰动会让边缘三角形的质心越出画布：归一化 t 会 <0 或 >1。
    // 若直接 seg|0 取色板下标：t>1 → k 越界到 pal[k+1]=undefined → mixRgb 抛
    // TypeError（实测 ~74% 概率整张封面生成失败）。clamp + 封顶下标后，
    // 越界三角形统一取最近端点色，且始终落在色板内。
    const t = Math.min(
      Math.max(((a[0] + b[0] + c[0]) / 3 / w + (a[1] + b[1] + c[1]) / 3 / h) / 2, 0),
      1
    );
    const seg = t * (pal.length - 1);
    const k = Math.min(seg | 0, pal.length - 2);
    svg += `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}Z" fill="${rgb(mixRgb(pal[k], pal[k + 1], seg - k))}"/>`;
  }
  return svg + '</svg>';
}

async function randomCover() {
  try {
    toast('正在生成随机封面…');
    const svg = randomCoverSvg();
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const data = await apiUpload(dataUrl, 'cover.svg');
    $('f-cover').value = data.path;
    toast('已生成随机封面（不满意可再点一次换一张）');
  } catch (e) {
    toast('生成封面失败：' + e.message, 4200);
  }
}

$('btn-cover-random').addEventListener('click', randomCover);
$('btn-cover').addEventListener('click', () => {
  $('file-input').dataset.cover = '1';
  $('file-input').click();
});

$('file-input').addEventListener('change', () => {
  const file = $('file-input').files[0];
  $('file-input').value = '';
  if (file && $('file-input').dataset.cover === '1') {
    $('file-input').dataset.cover = '';
    uploadCover(file);
  }
});

/* ---------------------------------------------------------------- Vditor 初始化
 * 复用开源编辑器（Vditor，MIT）：即时渲染模式，自带工具栏 / 公式(KaTeX) / 代码高亮 /
 * 图片上传 / 粘贴 / 拖拽，全部资源本地化，不依赖外网 CDN。 */

vd = new Vditor('vditor', {
  height: '100%',
  mode: 'ir',
  lang: 'zh_CN',
  theme: 'dark',
  icon: 'ant',
  cdn: './assets/vendor/vditor',
  placeholder:
    '在这里写正文… 支持 Markdown；行内公式 $E=mc^2$，块级公式 $$...$$；图片可拖拽、粘贴或点工具栏上传。',
  value: pendingBody,
  cache: { enable: false }, // 关闭本地缓存，避免切换文章时串内容
  counter: { enable: true, type: 'text' },
  outline: false,
  toolbarConfig: { pin: true },
  toolbar: [
    'undo',
    'redo',
    '|',
    'headings',
    'bold',
    'italic',
    'strike',
    '|',
    'list',
    'ordered-list',
    'quote',
    '|',
    'code',
    'inline-code',
    'table',
    'link',
    'upload',
    '|',
    {
      name: 'math-inline',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16"><text x="12" y="16" text-anchor="middle" font-size="14" font-family="serif" fill="currentColor">Σ</text></svg>',
      tip: '行内公式 $…$',
      click: () => {
        const sel = vd.getSelection();
        vd.insertValue('$' + (sel || 'x^2 + y^2 = z^2') + '$');
      },
    },
    {
      name: 'math-block',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16"><text x="12" y="16" text-anchor="middle" font-size="11" font-family="serif" fill="currentColor">ΣΣ</text></svg>',
      tip: '块级公式 $$…$$',
      click: () => {
        const sel = vd.getSelection();
        const body = sel || 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
        vd.insertValue('\n$$\n' + body + '\n$$\n');
      },
    },
    '|',
    'edit-mode',
    'both',
    'preview',
    'fullscreen',
  ],
  preview: {
    math: { engine: 'KaTeX', katexOptions: { throwOnError: false } },
    hljs: { enable: true, lineNumber: false, style: 'ant-design' },
    theme: { current: 'dark', path: './assets/vendor/vditor/dist/css/content-theme' },
  },
  upload: {
    max: MAX_UPLOAD_BYTES,
    accept: 'image/*',
    handler: async (files) => {
      const res = { errFiles: [], succMap: {} };
      for (const file of files) {
        try {
          const data = await apiUpload(await readAsDataURL(file), file.name);
          res.succMap[file.name] = data.path;
        } catch (e) {
          res.errFiles.push(file.name);
        }
      }
      if (res.errFiles.length) toast('有 ' + res.errFiles.length + ' 张图片上传失败', 4200);
      if (Object.keys(res.succMap).length) toast('图片已上传并插入');
      return res;
    },
  },
  after: () => {
    vdReady = true;
    vd.setValue(pendingBody);
  },
});

/* ---------------------------------------------------------------- 事件绑定 */

$('f-title').addEventListener('input', () => {
  updateMetaHint();
  if (!slugEdited && !$('f-slug').value.trim()) {
    $('f-slug').value = slugify($('f-title').value);
  }
});
$('f-slug').addEventListener('input', () => { slugEdited = true; });
$('search').addEventListener('input', renderList);
$('btn-new').addEventListener('click', newPost);
$('btn-save').addEventListener('click', () => collectAndSave(false));
$('btn-preview').addEventListener('click', () => collectAndSave(true));
$('btn-open-site').addEventListener('click', () => window.open('./index.html', '_blank'));
$('meta-form').addEventListener('submit', (e) => { e.preventDefault(); collectAndSave(false); });

/* 折叠：元数据表单（按钮 + 整条点击）、左栏（收起按钮 + 36px 竖条展开） */
$('btn-meta-toggle').addEventListener('click', (e) => { e.stopPropagation(); setMetaCollapsed(!$('meta-wrap').classList.contains('collapsed')); });
$('meta-bar').addEventListener('click', () => setMetaCollapsed(!$('meta-wrap').classList.contains('collapsed')));
$('btn-side-toggle').addEventListener('click', () => setSideCollapsed(true));
$('side-rail').addEventListener('click', () => setSideCollapsed(false));

/* 恢复上次折叠状态（无记录则默认展开） */
if (loadLS(LS_META, false)) setMetaCollapsed(true);
if (loadLS(LS_SIDE, false)) setSideCollapsed(true);

/* ---------------------------------------------------------------- 启动 */

(async function init() {
  try {
    await loadPosts();
  } catch (e) {
    toast('无法连接本地服务（' + e.message + '）。请通过 start-publish.bat 启动后访问本页。', 6000);
    $('post-list').innerHTML = '<div class="empty">无法加载文章列表</div>';
  }
  if (!posts.length) newPost();
  else selectPost(posts[0].slug);
})();
