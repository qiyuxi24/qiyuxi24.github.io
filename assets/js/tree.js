/*==============================================*\
  #tree.js
  科技树：径向放射树可视化
  - 中心 = 我，第一圈 = 四大分支（技术栈/爱好/经历/项目）
  - 再向外 = 具体叶子节点
  - 支持：拖拽平移、滚轮缩放、hover 高亮、tooltip、节点点击聚焦
  - 纯原生 SVG + JS，零依赖，适配 vCard 金色暗色主题
  - 支持两种挂载：内嵌（单页 article） + 全屏（覆盖层）
\*==============================================*/
'use strict';

(function () {

  /*------------------------------------*\
    #1. 数据（两种模式共用同一份）
  \*------------------------------------*/
  const TREE_DATA = {
    name: '佀佳超',
    subtitle: 'AI 应用开发者',
    desc: '西北工业大学 · 人工智能专业在读，把每个想法变成能跑的东西。',
    // 每个节点的色相偏移（金/橙/青/紫，四个分支各不同）
    branches: [
      {
        name: '技术栈',
        icon: '⚙',
        hue: 45, // 金色
        desc: '开发中不断点亮的能力树',
        children: [
          { name: 'Python', hue: 45, desc: '深度学习、后端脚本主力语言', level: 4 },
          { name: 'C / C++', hue: 45, desc: '系统级基础，Tauri/Rust 之前的功底', level: 3 },
          { name: 'Rust / Tauri', hue: 45, desc: '端侧 AI IDE 的桌面层，~5MB 安装包', level: 3 },
          { name: 'Vue 3', hue: 45, desc: 'AI 教育系统前端', level: 3 },
          { name: 'FastAPI', hue: 45, desc: 'JWT + 限流 + SSE 流式后端全套', level: 3 },
          { name: '深度学习', hue: 45, desc: '纯 NumPy 手写 CNN，MNIST 实战', level: 3 },
          { name: 'PyTorch', hue: 45, desc: '正在学习的下一站', level: 2 },
        ]
      },
      {
        name: '爱好',
        icon: '❤',
        hue: 200, // 青色
        desc: '驱动我不断折腾的东西',
        children: [
          { name: '写代码', hue: 200, desc: '项目 + 文档 > 看书', level: 4 },
          { name: '折腾 AI', hue: 200, desc: 'Agent、端侧模型、工具链', level: 4 },
          { name: '分享', hue: 200, desc: 'B站 / 知乎记录踩坑与心得', level: 3 },
          { name: '阅读', hue: 200, desc: '技术与非技术的书都看', level: 3 },
        ]
      },
      {
        name: '经历',
        icon: '★',
        hue: 300, // 紫色
        desc: '一路走来的里程碑',
        children: [
          { name: '西工大 AI 专业', hue: 300, desc: '2024 — 2028，AI 应用方向', level: 4 },
          { name: 'AIGC 大赛二等奖', hue: 300, desc: 'vivo+南开 AIGC 大赛地区二等奖', level: 4 },
          { name: 'NWPU-CS 创新项目', hue: 300, desc: 'AI 教育导师，知识图谱驱动', level: 4 },
          { name: 'AI+教育大赛', hue: 300, desc: '中国教育技术协会赛事，备赛中', level: 3 },
        ]
      },
      {
        name: '项目',
        icon: '🚀',
        hue: 160, // 绿色
        desc: '让想法落地的作品',
        children: [
          { name: 'Votek', hue: 160, desc: '端侧桌面 AI IDE，纯本地运行', level: 4 },
          { name: 'AI-tutor', hue: 160, desc: '两阶段流式对话的教育导师', level: 4 },
          { name: 'KinVoice', hue: 160, desc: '家语 AI，陪伴式对话 + 经验卡片', level: 4 },
          { name: 'CNN-learning', hue: 160, desc: '从零手写神经网络的开源课程', level: 3 },
        ]
      },
    ]
  };

  function hexFromHsl(h, s, l) {
    s = s / 100; l = l / 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  /*------------------------------------*\
    #2. 构建节点列表（flatten）
  \*------------------------------------*/
  function buildNodes() {
    // node = { id, name, icon, hue, level, parentId, radius, angle, x, y, desc }
    const nodes = [];
    const links = [];
    let nodeId = 0;

    // 中心根节点
    nodes.push({
      id: 'root',
      name: TREE_DATA.name,
      icon: '👨‍💻',
      hue: 45,
      level: 0,
      parentId: null,
      radius: 0,
      angle: 0,
      x: 0, y: 0,
      desc: TREE_DATA.desc,
      subtitle: TREE_DATA.subtitle,
      isRoot: true
    });

    TREE_DATA.branches.forEach(function (branch, bi) {
      const bNode = {
        id: 'b' + bi,
        name: branch.name,
        icon: branch.icon,
        hue: branch.hue,
        level: 1,
        parentId: 'root',
        radius: 170,
        angle: (bi / TREE_DATA.branches.length) * Math.PI * 2 - Math.PI / 2,
        x: 0, y: 0,
        desc: branch.desc,
        isBranch: true
      };
      bNode.x = Math.cos(bNode.angle) * bNode.radius;
      bNode.y = Math.sin(bNode.angle) * bNode.radius;
      nodes.push(bNode);
      links.push({ id: 'l-root-' + bi, source: 'root', target: bNode.id });

      // 叶子节点沿各自分支方向扇形展开
      const count = branch.children.length;
      const spread = Math.PI * 0.85; // 每个分支占用的扇形角度
      branch.children.forEach(function (child, ci) {
        const t = (count === 1) ? 0.5 : (ci / (count - 1));
        const leafAngle = bNode.angle + (t - 0.5) * spread;
        const cNode = {
          id: 'c' + (nodeId++),
          name: child.name,
          icon: null,
          hue: child.hue,
          level: 2,
          parentId: bNode.id,
          radius: 330,
          angle: leafAngle,
          x: 0, y: 0,
          desc: child.desc,
          levelDot: child.level
        };
        cNode.x = Math.cos(leafAngle) * cNode.radius;
        cNode.y = Math.sin(leafAngle) * cNode.radius;
        nodes.push(cNode);
        links.push({ id: 'l-' + bi + '-' + ci, source: bNode.id, target: cNode.id });
      });
    });

    return { nodes, links };
  }

  /*------------------------------------*\
    #3. 渲染器工厂
    initTree({ wrap, canvasId, tooltipId })
    返回一个可调用 resize 的实例
  \*------------------------------------*/
  function initTree(opts) {
    const wrap = opts.wrap;
    const canvas = document.getElementById(opts.canvasId);
    const tooltip = document.getElementById(opts.tooltipId);
    if (!wrap || !canvas || !tooltip) return null;

    const { nodes, links } = buildNodes();
    const nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    /*------------------------------------*\
      #3.1 SVG 构建
    \*------------------------------------*/
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'tree-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    canvas.appendChild(svg);

    let W = 0, H = 0;
    let view = { scale: 1, tx: 0, ty: 0 };

    const gMain = document.createElementNS(NS, 'g'); // 承载连线
    const gNode = document.createElementNS(NS, 'g'); // 承载节点
    svg.appendChild(gMain);
    svg.appendChild(gNode);

    // 创建节点 group
    const nodeGroups = {};
    nodes.forEach(function (n) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'tree-node' + (n.isRoot ? ' is-root' : '') + (n.isBranch ? ' is-branch' : ''));
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      g.dataset.id = n.id;

      const size = n.isRoot ? 30 : (n.isBranch ? 24 : (n.levelDot ? 16 + n.levelDot : 15));

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('class', 'tree-node-circle');
      circle.setAttribute('r', size);
      circle.setAttribute('fill', hexFromHsl(n.hue, 60, 20));
      circle.setAttribute('stroke', hexFromHsl(n.hue, 90, 60));
      circle.setAttribute('stroke-width', n.isRoot ? 3 : 2);
      circle.setAttribute('fill-opacity', n.isRoot ? 0.9 : 0.55);
      g.appendChild(circle);

      if (n.icon) {
        const icon = document.createElementNS(NS, 'text');
        icon.setAttribute('class', 'tree-node-icon');
        icon.setAttribute('x', 0);
        icon.setAttribute('y', 0);
        icon.setAttribute('font-size', n.isRoot ? 22 : 18);
        icon.textContent = n.icon;
        g.appendChild(icon);
      } else {
        // 叶子节点：画一个小圆点
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('class', 'tree-node-dot');
        dot.setAttribute('r', 3.5);
        dot.setAttribute('fill', hexFromHsl(n.hue, 90, 65));
        g.appendChild(dot);
      }

      // 标签位置策略：沿径向远离中心方向
      function addLabel(text, baseY, fontSize, fontWeight) {
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('class', 'tree-node-label');
        label.setAttribute('y', baseY);
        if (fontSize) label.setAttribute('font-size', fontSize);
        if (fontWeight) label.setAttribute('font-weight', fontWeight);
        label.setAttribute('text-anchor', 'middle');
        label.textContent = text;
        g.appendChild(label);
      }

      if (n.isRoot) {
        // 根节点：放在节点上方（避开下方的「爱好」分支）
        addLabel(n.name, -(size + 18), '15', '600');
      } else if (n.isBranch) {
        // 分支节点：标签放在径向远离中心的方向
        const sinA = Math.sin(n.angle);
        const yOff = sinA > 0.3 ? size + 24 : -(size + 18);
        addLabel(n.name, yOff, '14', '600');
      } else {
        // 叶子节点：标签放在节点外侧（径向远离中心）
        const sinA = Math.sin(n.angle);
        const yOff = sinA > 0.3 ? size + 16 : -(size + 14);
        addLabel(n.name, yOff, '11');
      }

      gNode.appendChild(g);
      nodeGroups[n.id] = g;

      // 事件
      g.addEventListener('mouseenter', function () { hoverNode(n.id); });
      g.addEventListener('mouseleave', function () { unhoverNode(); });
      g.addEventListener('mousemove', function (e) {
        if (tooltip.classList.contains('show')) moveTooltip(e);
      });
      g.addEventListener('click', function () { clickNode(n.id); });
    });

    // 创建连线
    const linkEls = {};
    links.forEach(function (l) {
      const s = nodeMap[l.source];
      const t = nodeMap[l.target];
      const path = document.createElementNS(NS, 'line');
      path.setAttribute('class', 'tree-link');
      path.setAttribute('x1', s.x);
      path.setAttribute('y1', s.y);
      path.setAttribute('x2', t.x);
      path.setAttribute('y2', t.y);
      gMain.appendChild(path); // 连线在节点下层
      linkEls[l.id] = path;
    });

    /*------------------------------------*\
      #3.2 视口变换 & 布局
    \*------------------------------------*/
    function applyView() {
      gMain.setAttribute('transform',
        'translate(' + view.tx + ',' + view.ty + ') scale(' + view.scale + ')');
    }

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      view.tx = W / 2;
      view.ty = H / 2;
      // CONTENT_R=400 + 节点半径+标签空间，按更紧的公式算
      view.scale = Math.max(0.4, Math.min(1.0, Math.min(W, H) / 920));
      applyView();
    }

    /*------------------------------------*\
      #3.3 交互：拖拽 + 缩放
    \*------------------------------------*/
    let isDragging = false;
    let startX = 0, startY = 0;
    let startTx = 0, startTy = 0;

    canvas.addEventListener('mousedown', function (e) {
      if (e.target === svg || e.target === canvas) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startTx = view.tx;
        startTy = view.ty;
        svg.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      view.tx = startTx + (e.clientX - startX);
      view.ty = startTy + (e.clientY - startY);
      applyView();
    });

    window.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        svg.style.cursor = 'grab';
      }
    });

    // 滚轮缩放（以鼠标位置为中心）
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.35, Math.min(2.2, view.scale * factor));
      view.tx = mx - (mx - view.tx) * (newScale / view.scale);
      view.ty = my - (my - view.ty) * (newScale / view.scale);
      view.scale = newScale;
      applyView();
    }, { passive: false });

    // 触摸支持
    let touchStart = null;
    let pinchStart = null;
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: view.tx, ty: view.ty };
      } else if (e.touches.length === 2) {
        pinchStart = dist(e.touches);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (e.touches.length === 1 && touchStart) {
        view.tx = touchStart.tx + (e.touches[0].clientX - touchStart.x);
        view.ty = touchStart.ty + (e.touches[0].clientY - touchStart.y);
        applyView();
      } else if (e.touches.length === 2) {
        const d = dist(e.touches);
        if (pinchStart) {
          const factor = d / pinchStart;
          const newScale = Math.max(0.35, Math.min(2.2, view.scale * factor));
          view.scale = newScale;
          applyView();
        }
        pinchStart = d;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', function () {
      touchStart = null;
      pinchStart = null;
    }, { passive: true });

    function dist(touches) {
      return Math.hypot(touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY);
    }

    // 工具栏（作用于本容器）
    wrap.querySelector('[data-tree-zoom="in"]').addEventListener('click', function () {
      zoomAt(1, W / 2, H / 2);
    });
    wrap.querySelector('[data-tree-zoom="out"]').addEventListener('click', function () {
      zoomAt(2, W / 2, H / 2);
    });
    wrap.querySelector('[data-tree-reset]').addEventListener('click', resetView);

    function zoomAt(factor, cx, cy) {
      const newScale = Math.max(0.35, Math.min(2.2, view.scale * factor));
      view.tx = cx - (cx - view.tx) * (newScale / view.scale);
      view.ty = cy - (cy - view.ty) * (newScale / view.scale);
      view.scale = newScale;
      applyView();
    }

    function resetView() {
      resize();
    }

    /*------------------------------------*\
      #3.4 节点高亮 & tooltip
    \*------------------------------------*/
    function findLinksOf(id) {
      return links.filter(function (l) { return l.source === id || l.target === id; });
    }

    function hoverNode(id) {
      const n = nodeMap[id];
      const related = new Set([id]);
      findLinksOf(id).forEach(function (l) {
        related.add(l.source);
        related.add(l.target);
        linkEls[l.id].classList.add('is-lit');
      });

      nodes.forEach(function (node) {
        if (!related.has(node.id)) {
          nodeGroups[node.id].classList.add('dimmed');
        }
      });

      showTooltip(n);
    }

    function unhoverNode() {
      nodes.forEach(function (node) {
        nodeGroups[node.id].classList.remove('dimmed');
      });
      links.forEach(function (l) {
        linkEls[l.id].classList.remove('is-lit');
      });
      hideTooltip();
    }

    function showTooltip(n) {
      let html = '<div class="tt-title">' + (n.icon ? n.icon + ' ' : '') + n.name + '</div>';
      if (n.subtitle) html += '<div class="tt-sub">' + n.subtitle + '</div>';
      if (n.desc) html += '<div class="tt-desc">' + n.desc + '</div>';
      tooltip.innerHTML = html;
      tooltip.classList.add('show');
    }

    function moveTooltip(e) {
      const wrapRect = wrap.getBoundingClientRect();
      let x = e.clientX - wrapRect.left + 16;
      let y = e.clientY - wrapRect.top - 10;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      if (x + tw > wrapRect.width - 8) x = e.clientX - wrapRect.left - tw - 16;
      if (y + th > wrapRect.height - 8) y = e.clientY - wrapRect.top - th - 8;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    function hideTooltip() {
      tooltip.classList.remove('show');
    }

    /*------------------------------------*\
      #3.5 点击节点：聚焦缩放
    \*------------------------------------*/
    function clickNode(id) {
      const n = nodeMap[id];
      unhoverNode();
      hoverNode(id);

      const targetScale = Math.max(view.scale, 1.25);
      view.tx = W / 2 - n.x * targetScale;
      view.ty = H / 2 - n.y * targetScale;
      view.scale = targetScale;
      applyView();

      tooltip.style.left = (W / 2 + 16) + 'px';
      tooltip.style.top = (H / 2 - 10) + 'px';
      setTimeout(function () { hideTooltip(); }, 3000);
    }

    resize();

    return { resize: resize, resetView: resetView };
  }

  /*------------------------------------*\
    #4. 实例化两种模式
  \*------------------------------------*/

  // 内嵌版（单页 article 中的科技树）
  const embed = initTree({
    wrap: document.querySelector('.tree-canvas-wrap:not(.tree-canvas-wrap--fullscreen)'),
    canvasId: 'tree-canvas',
    tooltipId: 'tree-tooltip'
  });

  // 全屏版（覆盖层）
  const full = initTree({
    wrap: document.querySelector('.tree-canvas-wrap--fullscreen'),
    canvasId: 'tree-canvas-fullscreen',
    tooltipId: 'tree-tooltip-fullscreen'
  });

  const fullscreen = document.getElementById('tree-fullscreen');
  const exitBtn = document.querySelector('[data-tree-exit]');

  function openFullscreen() {
    if (!fullscreen) return;
    fullscreen.classList.add('show');
    fullscreen.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // 锁定页面滚动
    // 等动画/布局稳定后再量尺寸
    setTimeout(function () { if (full) full.resize(); }, 60);
  }

  function closeFullscreen() {
    if (!fullscreen) return;
    fullscreen.classList.remove('show');
    fullscreen.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // 导出给 script.js / effects.js 使用
  window.TreeFullscreen = {
    open: openFullscreen,
    close: closeFullscreen
  };

  if (exitBtn) {
    exitBtn.addEventListener('click', closeFullscreen);
  }

  // ESC 键退出全屏
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fullscreen && fullscreen.classList.contains('show')) {
      closeFullscreen();
    }
  });

  // 窗口 resize 时同步两个画布
  window.addEventListener('resize', function () {
    if (embed) embed.resize();
    if (full && fullscreen && fullscreen.classList.contains('show')) full.resize();
  });

  // 首次渲染浮现动画
  requestAnimationFrame(function () {
    if (window.gsap) {
      window.gsap.fromTo(document.querySelectorAll('#tree-canvas svg, #tree-canvas-fullscreen svg'),
        { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' });
    }
  });

})();
