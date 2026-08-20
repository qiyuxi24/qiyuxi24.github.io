'use strict';

/**
 * reader.js — 文章阅读页逻辑
 *
 * 流程：
 *   1. 从 URL ?slug=xxx 读取文章 slug
 *   2. fetch content/posts/xxx.md
 *   3. 解析 front-matter（title/slug/date/category/tags/summary/cover）
 *   4. 用 marked 渲染正文 Markdown
 *   5. 拼装文章头部信息 + 正文，插入 DOM
 *
 * 依赖：marked（已在 reader.html 引入）
 */

(function () {
  const loading = document.getElementById('reader-loading');
  const errorEl = document.getElementById('reader-error');
  const articleEl = document.getElementById('reader-article');

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    showError();
    return;
  }

  fetchMarkdown(slug).then(render).catch(showError);

  // ----------------------------------------------------------------

  function fetchMarkdown(s) {
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

    // 正文
    const bodyEl = document.createElement('div');
    bodyEl.className = 'reader-body';
    const html = marked.parse(body, { gfm: true, breaks: true });
    bodyEl.innerHTML = html;
    processCodeBlocks(bodyEl);

    // 页脚
    const foot = document.createElement('div');
    foot.className = 'reader-foot';
    foot.innerHTML =
      '<p>—— 完 ——</p>' +
      '<a href="./index.html" class="reader-btn">返回主页</a>';

    articleEl.innerHTML = '';
    articleEl.append(head, bodyEl, foot);

    // 隐藏 loading，显示文章
    loading.hidden = true;
    articleEl.hidden = false;

    // 阅读量统计（不蒜子）
    loadBusuanzi();
    window.scrollTo(0, 0);
  }

  function parseFrontmatter(raw) {
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return { meta: null, body: raw };
    const meta = {};
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      let val = kv[2].trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
      }
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      if (val === 'null') val = null;
      meta[key] = val;
    }
    const body = raw.slice(m.index + m[0].length).replace(/^\s*\n/, '');
    return { meta, body };
  }

  // 给代码块加简单的语言标签 + 行内代码样式容器
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

  function showError() {
    loading.hidden = true;
    articleEl.hidden = true;
    errorEl.hidden = false;
  }

  // 不蒜子阅读量（A4 复用）
  function loadBusuanzi() {
    // 动态插入不蒜子脚本，若已存在则跳过
    if (window.busuanzi || document.getElementById('busuanzi-script')) return;
    const s = document.createElement('script');
    s.id = 'busuanzi-script';
    s.async = true;
    s.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    s.onload = () => {
      // 等待不蒜子更新 DOM
      setTimeout(() => {
        const badge = document.querySelector('.reader-visits');
        if (badge && window.busuanzi && window.busuanzi.site_pv) {
          badge.textContent = `本站累计 ${window.busuanzi.site_pv} 次访问`;
        }
      }, 800);
    };
    document.body.appendChild(s);
  }
})();
