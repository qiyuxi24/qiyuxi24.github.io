/*==============================================*\
  #page-manager.js
  页面切换中间件：统一管理 vCard 多页导航状态。

  背景（2026-08-31 修复）：
  - 导航高亮、[data-page] 文章 active、全屏覆盖层(科技树)
    三处状态散落在 script.js / tree.js 中，无单一来源，
    导致切换不同步（如退出科技树后导航高亮错位）。

  职责：
  - 单一状态源 current：导航高亮 + 文章 active 由它统一推导
  - 钩子机制：register(page, { onEnter, onLeave })
    → 切页时自动执行离开清理 / 进入初始化
  - 覆盖层支持：tree 等全屏层以特殊页面注册，进入/离开自动开关，
    并通过 back() 返回进入前的页面

  用法：
    PageManager.go('resume')           // 切换页面（导航/文章/覆盖层自动同步）
    PageManager.back()                 // 从覆盖层返回进入前的页面
    PageManager.current                // 当前页面名
    PageManager.register(page, hooks)  // 注册页面的进入/离开钩子
\*==============================================*/
'use strict';

(function () {

  const articles = Array.from(document.querySelectorAll('[data-page]'));
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
  const hooks = {};
  let current = null;
  let overlayFrom = null;   // 进入覆盖层前的页面（供 back() 返回）

  // 首个普通页（默认落点）
  function firstPage() {
    return (articles[0] && articles[0].dataset.page) || 'about';
  }

  // 导航高亮 + 文章 active 统一由目标页推导，杜绝分散修改
  function applyActive(name) {
    articles.forEach(function (a) {
      a.classList.toggle('active', a.dataset.page === name);
    });
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l.dataset.navPage === name);
    });
  }

  function go(name, force) {
    // force=true 时跳过短路：用于内部状态与 DOM 脱节时的强制同步
    if (!force && name === current) return;

    const prev = current;

    // 1) 离开当前页：执行清理钩子（如关闭科技树覆盖层/模态框）
    if (prev && hooks[prev] && hooks[prev].onLeave) hooks[prev].onLeave();

    // 2) 更新状态 + DOM（覆盖层页不改变底层文章 active，仅切换高亮）
    if (name === 'tree') overlayFrom = prev;   // 记录覆盖层来路
    current = name;
    applyActive(name);

    // 3) 进入新页：执行初始化钩子（如打开科技树覆盖层）
    if (hooks[name] && hooks[name].onEnter) hooks[name].onEnter();

    if (name !== 'tree') window.scrollTo(0, 0);
  }

  // 覆盖层返回：回到进入覆盖层前的页面
  function back() {
    if (current === 'tree' && overlayFrom) {
      go(overlayFrom);
    } else {
      go(firstPage());
    }
  }

  function register(name, hook) {
    hooks[name] = Object.assign({}, hooks[name], hook || {});
  }

  /*---- 初始化：以 HTML 中标记 active 的 article 为初始页 ----*/
  const activeArticle = document.querySelector('article.active');
  current = (activeArticle && activeArticle.dataset.page) || firstPage();

  /*---- 导航点击统一入口 ----*/
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      go(this.dataset.navPage);
    });
  });

  /*---- 科技树覆盖层钩子（TreeFullscreen 由 tree.js 暴露） ----*/
  register('tree', {
    onEnter: function () { if (window.TreeFullscreen) window.TreeFullscreen.open(); },
    onLeave: function () { if (window.TreeFullscreen) window.TreeFullscreen.close(); }
  });

  window.PageManager = {
    go: go,
    back: back,
    register: register,
    get current() { return current; }
  };

})();
