/*==============================================*\
  #tree.js
  科技树入口（2026-08-31 重写）

  定位：独立全屏覆盖层（z-index:90，自带深色底），
       不再依赖 body.tree-mode 淡出上层卡片。

  - 打开：tree-fullscreen.show + tree.setActive(true) 锁滚动
  - 关闭：移除 show + tree.setActive(false)（力导向停摆，零 CPU）
  - 退出统一走 PageManager（导航高亮/覆盖层状态同步），
    无中间件时降级直接关闭
  - 渲染细节见 tree-render.js
\*==============================================*/
'use strict';

(function () {
  if (!window.TreeAPI || !window.TreeAPI.createTreeRenderer) {
    return;
  }

  const tree = window.TreeAPI.createTreeRenderer({
    wrap: document.querySelector('.tree-canvas-wrap--fullscreen'),
    canvasId: 'tree-canvas-fullscreen',
    tooltipId: 'tree-tooltip-fullscreen'
  });

  const fullscreen = document.getElementById('tree-fullscreen');

  function openTree() {
    if (!fullscreen) return;
    fullscreen.classList.add('show');
    fullscreen.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (tree) {
      tree.setActive(true);
      setTimeout(function () { tree.resize(); }, 80);
    }
  }

  function closeTree() {
    if (!fullscreen) return;
    fullscreen.classList.remove('show');
    fullscreen.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (tree) {
      tree.setActive(false);
      if (tree.closeModal) tree.closeModal();
    }
  }

  window.TreeFullscreen = { open: openTree, close: closeTree };

  // 退出统一走 PageManager（导航高亮/覆盖层状态同步），无中间件时降级直接关闭
  function exitTree() {
    if (window.PageManager) window.PageManager.back();
    else closeTree();
  }

  const exitBtn = document.querySelector('[data-tree-exit]');
  if (exitBtn) exitBtn.addEventListener('click', exitTree);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('tree-modal');
    if (modal && modal.classList.contains('show')) {
      if (tree && tree.closeModal) tree.closeModal();
      return;
    }
    if (fullscreen && fullscreen.classList.contains('show')) exitTree();
  });

  window.addEventListener('resize', function () {
    if (tree && fullscreen && fullscreen.classList.contains('show')) tree.resize();
  });

  requestAnimationFrame(function () {
    if (window.gsap && tree) {
      window.gsap.fromTo(tree.svg, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    }
  });
})();
