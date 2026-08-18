/*==============================================*\
  #tree.js
  科技树：背景星云力导向可视化（Obsidian Graph View 风格）
  - 常驻于粒子宇宙背景层，透明画布，粒子在节点间流动
  - 物理引擎：d3-force（Obsidian Graph View 同款）
      · forceManyBody  万有引力（负值 = 斥力，节点互相推开）
      · forceLink      弹簧（父子节点相互吸引，保持连接）
      · forceCollide   碰撞（节点互不重叠）
      · forceCenter + forceX/Y  中心引力（把整棵星云拉回中央）
  - 节点 = 发光星云体（核心圆 + 光晕），连线 = 星尘轨迹
  - 支持：拖拽平移、滚轮缩放、hover 高亮、tooltip、点击聚焦
  - 进入/退出：由 body.tree-mode 控制上层卡片淡出/浮现
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
    document.body.classList.add('tree-mode');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { if (tree) tree.resize(); }, 80);
  }

  function closeTree() {
    if (!fullscreen) return;
    fullscreen.classList.remove('show');
    fullscreen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tree-mode');
    document.body.style.overflow = '';
    if (tree && tree.closeModal) tree.closeModal();
  }

  window.TreeFullscreen = { open: openTree, close: closeTree };

  const exitBtn = document.querySelector('[data-tree-exit]');
  if (exitBtn) exitBtn.addEventListener('click', closeTree);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('tree-modal');
    if (modal && modal.classList.contains('show')) {
      if (tree && tree.closeModal) tree.closeModal();
      return;
    }
    if (fullscreen && fullscreen.classList.contains('show')) closeTree();
  });

  window.addEventListener('resize', function () {
    if (tree) tree.resize();
  });

  requestAnimationFrame(function () {
    if (window.gsap && tree) {
      window.gsap.fromTo(tree.svg, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    }
  });
})();
