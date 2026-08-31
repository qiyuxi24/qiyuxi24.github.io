'use strict';

/**
 * reader.js — 文章阅读页逻辑
 *
 * 流程：
 *   1. 从 URL ?slug=xxx 读取文章 slug
 *   2. fetch content/posts/xxx.md
 *   3. 解析 front-matter（title/slug/date/category/tags/summary/cover）
 *   4. normalizeMarkdown：清洗排版 + 段落化（核心：兼容"一行一段"的写作习惯）
 *   5. 用 marked 渲染正文 Markdown（只开 GFM，不开 breaks）
 *   6. enhanceArticle：后处理（标题锚点 / 表格横向滚动 / 代码块增强）
 *   7. 拼装文章头部信息 + 正文，插入 DOM
 *
 * 依赖：marked（本地 assets/js/marked.min.js，已在 reader.html 引入）
 */

(function () {
  const loading = document.getElementById('reader-loading');
  const errorEl = document.getElementById('reader-error');
  const errorTextEl = errorEl.querySelector('p');
  const articleEl = document.getElementById('reader-article');

  // ----------------------------------------------------------------
  // 返回按钮：统一回到"文章列表"，不做"整页刷新回主界面"的中间跳转
  //  - 从本站页面跳转而来 → history.back()：浏览器 bfcache 直接恢复
  //    原 tab 与滚动位置，无整页刷新、无"先闪主页再切回文章列表"的体验
  //    （index.html 侧由 script.js 的 sessionStorage 恢复逻辑兜底切回 blog tab）
  //  - 直接打开 / 外部来源（无站内 referrer）→ 跳到 index.html 的"文章列表"tab：
  //    通过 sessionStorage + ?page=blog 双通道告知 index.html 切到 blog tab，
  //    避免返回后落在默认的"主界面"（index.html 默认激活 about tab）
  // ----------------------------------------------------------------
  function bindBackButtons(root) {
    (root || document).querySelectorAll('.reader-back, .reader-btn').forEach((btn) => {
      if (btn.__backBound) return;
      btn.__backBound = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const ref = document.referrer || '';
        if (ref && ref.indexOf(location.origin) === 0 && window.history.length > 1) {
          window.history.back();
        } else {
          try {
            sessionStorage.setItem('reader-back', JSON.stringify({ page: 'blog', y: 0 }));
          } catch (err) { /* 隐私模式等场景静默忽略 */ }
          window.location.href = './index.html?page=blog';
        }
      });
    });
  }
  bindBackButtons(document);

  // 公式（KaTeX）相关：记录最近一次渲染，
  // 若首次渲染时 KaTeX 尚未加载完成，等 katex-ready 事件触发后自动重渲染
  let lastRendered = null; // { raw, metaTitle }
  let renderedWithoutKatex = false;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  // file:// 直开（双击 HTML）时，浏览器会拦截 fetch 本地文件（CORS），
  // 导致文章无法加载。给出明确提示而不是默默空白。
  const isFileProtocol = window.location.protocol === 'file:';

  // marked 库缺失兜底（本地包被删/加载失败时给出明确提示）
  const hasMarked = typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function';

  if (hasMarked) {
    // 只开 GFM（表格/删除线/任务列表）。
    // 刻意不开 breaks：软换行交给 normalizeMarkdown 在渲染前统一"段落化"。
    // 若开 breaks: true，"一行一段"会被渲染成一个大 <p> 里塞满 <br>——
    // 没有段间距（<p> 的 margin），长文挤成一坨，且会污染列表/引用内的换行。
    window.marked.use({ gfm: true });
  }

  if (!slug) {
    showError();
    return;
  }

  fetchMarkdown(slug).then(render).catch(showError);

  // ----------------------------------------------------------------

  /**
   * 归一化 → 公式渲染（KaTeX）→ marked 渲染。
   * KaTeX 未就绪时公式以 $...$ 原文显示，katex-ready 后再重渲染。
   */
  function renderMarkdown(body, metaTitle) {
    const normalized = normalizeMarkdown(body, metaTitle);
    const withMath =
      window.markedMath && typeof window.markedMath.render === 'function'
        ? window.markedMath.render(normalized)
        : normalized;
    return window.marked.parse(withMath);
  }

  function fetchMarkdown(s) {
    if (isFileProtocol) {
      return Promise.reject(new Error('file-protocol'));
    }
    const url = `./content/posts/${s}.md`;
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error('not found');
      return r.text();
    });
  }

  function render(raw) {
    const { meta, body } = parseFrontmatter(raw);
    if (!meta || meta.published === false) {
      showError();
      return;
    }
    if (!hasMarked) {
      showError('渲染库（marked）未能加载，请检查 assets/js/marked.min.js 是否存在。');
      return;
    }

    document.title = `${meta.title} · 佀佳超 | 同州禹斋`;

    // 文章头部
    const head = document.createElement('div');
    head.className = 'reader-head';

    const metaLine = document.createElement('div');
    metaLine.className = 'reader-meta';

    const cat = document.createElement('span');
    cat.className = 'reader-category';
    cat.textContent = meta.category || '随笔';

    const dot = document.createElement('span');
    dot.className = 'reader-dot';
    dot.textContent = '·';

    const date = document.createElement('time');
    date.className = 'reader-date';
    date.textContent = formatDate(meta.date);
    date.setAttribute('datetime', meta.date || '');

    metaLine.append(cat, dot, date);

    const title = document.createElement('h1');
    title.className = 'reader-title';
    title.textContent = meta.title || '无标题';

    head.append(metaLine, title);

    if (meta.summary) {
      const summary = document.createElement('p');
      summary.className = 'reader-summary';
      summary.textContent = meta.summary;
      head.appendChild(summary);
    }

    if (Array.isArray(meta.tags) && meta.tags.length) {
      const tagBox = document.createElement('div');
      tagBox.className = 'reader-tags';
      meta.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'reader-tag';
        tag.textContent = t;
        tagBox.appendChild(tag);
      });
      head.appendChild(tagBox);
    }

    // 正文：归一化（清洗 + 段落化）→ 公式（KaTeX）→ marked → 后处理增强
    lastRendered = { raw: body, metaTitle: meta.title };
    renderedWithoutKatex = !(typeof window.katex !== 'undefined');
    const bodyEl = document.createElement('div');
    bodyEl.className = 'reader-body';
    bodyEl.innerHTML = renderMarkdown(body, meta.title);
    enhanceArticle(bodyEl);

    // 页脚
    const foot = document.createElement('div');
    foot.className = 'reader-foot';
    foot.innerHTML =
      '<p>—— 完 ——</p>' +
      '<a href="./index.html" class="reader-btn">返回主页</a>';

    articleEl.innerHTML = '';
    articleEl.append(head, bodyEl, foot);
    bindBackButtons(foot); // 页脚"返回主页"按钮同样优先回退到来源界面

    // 隐藏 loading，显示文章
    loading.hidden = true;
    articleEl.hidden = false;

    window.scrollTo(0, 0);
  }

  /**
   * 解析 front-matter（--- 之间的 YAML 键值）。
   * 按行解析而非正则，避免正文中的 `---` 分隔线干扰匹配；
   * 兼容 BOM 与 CRLF。
   */
  function parseFrontmatter(raw) {
    const text = String(raw || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n');
    const lines = text.split('\n');

    if (lines[0].trim() !== '---') return { meta: null, body: text };

    let end = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { end = i; break; }
    }
    if (end < 0) return { meta: null, body: text };

    const meta = {};
    for (let i = 1; i < end; i++) {
      const kv = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
      if (!kv) continue;
      let val = kv[2].trim();
      // 去 YAML 单/双引号
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // 数组：tags: [a, b]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      meta[kv[1]] = val;
    }

    const body = lines.slice(end + 1).join('\n').replace(/^\s*\n/, '');
    return { meta, body };
  }

  /**
   * 归一化正文 Markdown（在交给 marked 之前）：
   *
   * 1. 段落化 —— 兼容"一行一段"的写作习惯。
   *    CommonMark 规定"没有空行 = 同一个段落"，
   *    因此作者按回车分行写的连续文本会被 marked 合并成一段
   *    （或在使用 breaks 时变成 <p> 内一串 <br>，无段间距、挤成一坨）。
   *    这里把连续"游离文本行"（非标题/列表/引用/代码/表格/分隔线/HTML 的普通行）
   *    之间补上空行，让每行成为真正的 <p> 段落。
   *    —— 对本来就规范"空行分段"的文章是幂等的，不会破坏。
   * 2. 排版修复（旧 cleanBody 的逻辑）：
   *    - 与 front-matter title 相同的标题行删除（页面已渲染 h1）
   *    - 独立分隔线（---）前后补空行，防止被解析成 setext 标题下划线
   *    - 标题后紧跟正文时补空行（防御性）
   * 3. 全程跳过围栏代码块（```），不破坏代码内容。
   *
   * 注意：该处理默认假定"行首不缩进的普通文本行"是一段。
   * 若需要"段落内的软换行"（如诗歌、地址换行），请用行尾两个空格（Markdown 软换行）
   * 或直接写在同一行 —— 这是标准 Markdown 语义。
   */
  function normalizeMarkdown(raw, metaTitle) {
    const text = String(raw || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n');
    const lines = text.split('\n');
    const out = [];
    let inFence = false;
    let prevFree = false; // 上一个输出的行是否为"游离文本行"

    const isEmpty = (l) => l.trim() === '';

    // 块级结构开头：这些行不属于普通段落，不能被打断或并入段落
    const isBlock = (l) =>
      /^#{1,6}\s/.test(l) ||               // ATX 标题
      /^(`{3,}|~{3,})/.test(l) ||          // 围栏代码
      /^>/.test(l) ||                      // 引用
      /^\s*([-*+]|\d+[.)])\s+/.test(l) ||  // 列表项
      /^\s*\|.*\|\s*$/.test(l) ||          // 表格行
      /^(\s*[-*_]){3,}\s*$/.test(l) ||     // 分隔线
      /^\s{4,}\S/.test(l) ||               // 缩进代码块
      /^<\/?[a-zA-Z][^>]*>/.test(l);       // 裸 HTML

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();

      // 围栏代码块：整体原样保留（含围栏开关行）
      if (/^(`{3,}|~{3,})/.test(t)) {
        inFence = !inFence;
        out.push(line);
        prevFree = false;
        continue;
      }
      if (inFence) {
        out.push(line);
        prevFree = false;
        continue;
      }

      // ATX 标题：与 front-matter title 一致的删除，其余原样
      const hm = line.match(/^(#{1,6})\s+(.+)$/);
      if (hm) {
        if (metaTitle && hm[2].trim() === String(metaTitle).trim()) {
          prevFree = false;
          continue;
        }
        out.push(line);
        // 防御：标题后紧跟普通文本行时补空行（防个别解析器吞行）
        const next = lines[i + 1];
        if (next !== undefined && /^\S/.test(next) && !isBlock(next)) out.push('');
        prevFree = false;
        continue;
      }

      // 空行：原样保留
      if (isEmpty(line)) {
        out.push(line);
        prevFree = false;
        continue;
      }

      // 块级结构：原样保留；分隔线前后补空行防 setext 误判
      if (isBlock(line)) {
        if (/^(\s*[-*_]){3,}\s*$/.test(t) && out.length) {
          if (!isEmpty(out[out.length - 1])) out.push('');
          out.push(line);
          const next = lines[i + 1];
          if (next !== undefined && !isEmpty(next)) out.push('');
        } else {
          out.push(line);
        }
        prevFree = false;
        continue;
      }

      // 游离文本行（行首不缩进的普通文本）→ 段落化：与前一个游离行之间补空行
      if (/^\S/.test(line)) {
        if (prevFree) out.push('');
        out.push(line);
        prevFree = true;
        continue;
      }

      // 其余（列表续行、引用续行等缩进行）：原样保留，不补空行
      out.push(line);
      prevFree = false;
    }

    return out.join('\n');
  }

  /**
   * 正文后处理（marked 渲染出 DOM 之后）：
   *   - 标题锚点：给 h2-h6 生成稳定 id + 悬停 ¶ 链接，支持 #锚点 直达
   *   - 长表格：包一层 .table-wrap，横向滚动防溢出
   *   - 代码块：语言标签 + 复制按钮（见 processCodeBlocks）
   */
  function enhanceArticle(container) {
    // 1) 标题锚点
    const slugs = new Set();
    container.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
      const base = slugify(h.textContent);
      let id = base;
      let n = 2;
      while (slugs.has(id)) id = `${base}-${n++}`;
      slugs.add(id);
      h.id = id;

      const anchor = document.createElement('a');
      anchor.className = 'reader-anchor';
      anchor.href = `#${id}`;
      anchor.setAttribute('aria-label', '链接到本节');
      anchor.textContent = '¶';
      anchor.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(`${location.origin}${location.pathname}#${id}`)
            .catch(() => {});
        }
      });
      h.appendChild(anchor);
    });

    // 2) 表格横向滚动包裹
    container.querySelectorAll('table').forEach((table) => {
      if (table.closest('.table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // 3) 代码块增强
    processCodeBlocks(container);
  }

  /** 生成安全的标题锚点 slug（保留中文/字母/数字，标点与空格转 `-`） */
  function slugify(text) {
    return (
      String(text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'section'
    );
  }

  // 给代码块加语言标签 + 复制按钮
  function processCodeBlocks(container) {
    const blocks = container.querySelectorAll('pre code');
    blocks.forEach((block) => {
      const pre = block.closest('pre');
      const langMatch = block.className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : '';
      if (lang) {
        const label = document.createElement('span');
        label.className = 'reader-code-lang';
        label.textContent = lang;
        pre.classList.add('has-lang');
        pre.setAttribute('data-lang', lang);
        pre.appendChild(label);
      }
      // 复制按钮
      const copy = document.createElement('button');
      copy.className = 'reader-code-copy';
      copy.textContent = '复制';
      copy.setAttribute('aria-label', '复制代码');
      copy.addEventListener('click', () => {
        const text = block.innerText;
        navigator.clipboard.writeText(text).then(() => {
          copy.textContent = '已复制';
          setTimeout(() => (copy.textContent = '复制'), 1500);
        });
      });
      pre.appendChild(copy);
    });
  }

  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function showError(message) {
    loading.hidden = true;
    articleEl.hidden = true;
    errorEl.hidden = false;
    if (message) {
      errorTextEl.textContent = message;
    } else if (isFileProtocol) {
      errorTextEl.textContent =
        '本地直接打开 HTML 无法加载文章（浏览器安全限制）。请部署到 GitHub Pages，或双击 start-local.bat 启动本地服务器后访问。';
    }
  }

  // ----------------------------------------------------------------
  // KaTeX 延迟加载完成后的重渲染：
  // 首次渲染若公式还是 $...$ 原文（KaTeX 未就绪），katex-ready 时重新渲染正文。
  // ----------------------------------------------------------------
  function reRenderBody() {
    if (!lastRendered || !renderedWithoutKatex) return;
    renderedWithoutKatex = false;
    const bodyEl = articleEl.querySelector('.reader-body');
    if (!bodyEl) return;
    const fresh = document.createElement('div');
    fresh.className = 'reader-body';
    fresh.innerHTML = renderMarkdown(lastRendered.raw, lastRendered.metaTitle);
    enhanceArticle(fresh);
    bodyEl.replaceWith(fresh);
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('katex-ready', reRenderBody);
  }
})();
