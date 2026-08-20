'use strict';

/**
 * hobbies.js — 爱好页交互
 * - 平滑滚动到锚点板块
 * - 滚动时高亮当前所在板块（nav-item active）
 * - 淡入动画（板块进入视口时）
 * - 资源管理器风格树（阅读板块：书单/精神导师/精选书目）+ 搜索过滤
 */

(function () {
  const navItems = document.querySelectorAll('.hobbies-nav-item');
  const blocks = document.querySelectorAll('[data-hobbies-block]');

  // 标记 JS 已启用（触发淡入动画；无 JS 时内容保持可见）
  document.body.classList.add('js-hobbies');

  // ---------- 导航 ----------
  navItems.forEach((item) => {
    item.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return;
      e.preventDefault();
      const el = document.getElementById(targetId.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  function updateActiveNav() {
    const offset = 120;
    let currentId = null;
    blocks.forEach((block) => {
      if (block.getBoundingClientRect().top <= offset) currentId = '#' + block.id;
    });
    navItems.forEach((item) => {
      item.classList.toggle('is-active', item.getAttribute('href') === currentId);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  blocks.forEach((block) => observer.observe(block));

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ---------- 资源管理器风格树渲染 ----------
  const D = window.HOBBIES_DATA;

  // 工具：创建带类名的元素
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  if (D && D.reading) renderReadingTree(D.reading);

  function renderReadingTree(data) {
    const mount = document.getElementById('reading-tree');
    if (!mount) return;

    const tree = el('div', 'tree');
    tree.dataset.treeRoot = '';

    // 1) 搜索框
    const searchWrap = el('div', 'tree-search-wrap');
    const searchInput = el('input', 'tree-search-input');
    searchInput.type = 'search';
    searchInput.placeholder = '搜索书名…';
    searchInput.setAttribute('aria-label', '搜索书名');
    searchWrap.appendChild(searchInput);
    mount.appendChild(searchWrap);

    // 2) 书单文件夹（含多个子文件夹）
    const shelvesFolder = makeFolder('已读书单 · 按主题分类');
    data.shelves.forEach((s) => {
      const sub = makeFolder(s.group);
      s.books.forEach((b) => sub.content.appendChild(makeBookItem(b)));
      shelvesFolder.content.appendChild(sub.folder);
    });
    shelvesFolder.folder.dataset.shelfRoot = '';
    tree.appendChild(shelvesFolder.folder);

    // 3) 精神导师文件夹
    const mentorFolder = makeFolder('精神导师');
    data.mentors.forEach((m) => {
      const item = el('div', 'tree-mentor');
      item.appendChild(el('span', 'tree-mentor-title', m.name));
      item.appendChild(el('span', 'tree-mentor-meta', m.field));
      item.appendChild(el('span', 'tree-mentor-note', m.influence));
      mentorFolder.content.appendChild(item);
    });
    tree.appendChild(mentorFolder.folder);

    // 4) 精选书目文件夹（可展开感想）
    const featFolder = makeFolder('精选书目');
    data.featured.forEach((f) => {
      const item = el('div', 'tree-featured');
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      const head = el('div', 'tree-featured-head');
      head.appendChild(el('span', 'tree-arrow', ''));
      head.appendChild(el('span', 'tree-featured-title', f.title));
      if (f.author) head.appendChild(el('span', 'tree-featured-meta', f.author));
      item.appendChild(head);
      if (f.note) item.appendChild(el('div', 'tree-featured-note', f.note));
      const toggle = () => item.classList.toggle('open');
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      featFolder.content.appendChild(item);
    });
    tree.appendChild(featFolder.folder);

    mount.appendChild(tree);

    // ---------- 搜索过滤 ----------
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const allBooks = tree.querySelectorAll('.tree-item');
      const subFolders = shelvesFolder.content.querySelectorAll('.tree-folder');

      if (!q) {
        // 清空搜索：收起所有子文件夹，恢复默认
        tree.querySelectorAll('.tree-folder.open').forEach((f) => f.classList.remove('open'));
        allBooks.forEach((b) => (b.style.display = ''));
        subFolders.forEach((f) => (f.style.display = ''));
        return;
      }

      // 过滤书籍：命中的显示，未命中的隐藏
      allBooks.forEach((b) => {
        b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none';
      });

      // 子文件夹：有可见书就显示，否则隐藏；命中的子文件夹自动展开
      subFolders.forEach((f) => {
        const visibleBooks = f.querySelectorAll('.tree-item').length
          ? Array.from(f.querySelectorAll('.tree-item')).some((b) => b.style.display !== 'none')
          : false;
        f.style.display = visibleBooks ? '' : 'none';
        f.classList.toggle('open', visibleBooks);
      });

      // 根"已读书单"文件夹自动展开
      shelvesFolder.folder.classList.toggle('open', q !== '');
    });
  }

  // 创建一个可展开文件夹；返回 { folder, content }
  function makeFolder(name) {
    const folder = el('div', 'tree-folder');
    const head = el('div', 'tree-folder-head');
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    head.appendChild(el('span', 'tree-arrow', ''));
    head.appendChild(el('span', 'tree-folder-name', name));
    const content = el('div', 'tree-folder-content');
    folder.appendChild(head);
    folder.appendChild(content);

    const toggle = () => folder.classList.toggle('open');
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    return { folder, content };
  }

  // 叶子项（书名）
  function makeBookItem(label) {
    const item = el('div', 'tree-item');
    item.appendChild(el('span', 'tree-item-title', label));
    return item;
  }
})();
