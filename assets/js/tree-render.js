/*==============================================*\
  #tree-render.js
  科技树渲染器（2026-08-31 重写）

  定位：独立全屏覆盖层（不再做 z-index:0 背景星云层），
       深色底 + 力导向图，Obsidian Graph View 风格。

  相对旧版修复的问题：
  1. 架构病根：旧版 z-index:0 + body.tree-mode"淡出上层卡片"
     → 可见性依赖全局 class，状态散落易不同步。
     新版为独立覆盖层(z-index:90)，状态自洽。
  2. 力导向永动：旧版 pulseTimer 每 2.5s 无条件加热 + hover 加热
     + focus 力把节点拉向中心 → 图一直蠕动、CPU 持续消耗。
     新版静止化：默认零 CPU，只有拖拽/重置/首次打开才喂能量；
     打开期间仅维持极低 alpha 的向心重力（反平方），星云缓慢归位。
  3. 布局不持久：旧版每次刷新随机散布、拖过/缩过全丢。
     新版 localStorage 持久化节点位置 + 视角。
  4. 点击聚焦跳变：旧版点击时加热 simulation 又立即改 view。
     新版用 gsap 平滑缩放定位（节点静止，不跳变）。
  5. 进入/退出控制：旧版靠 MutationObserver 监听 body.tree-mode。
     新版提供显式 setActive(bool)，由 tree.js 调用。

  保留的交互：拖拽平移、滚轮缩放、节点拖拽、hover 高亮 + tooltip、
       点击聚焦 + 详情 modal、搜索、图例、重置、触摸支持。
\*==============================================*/
(function () {
  'use strict';

  const treeApi = window.TreeAPI || {};
  const treeData = window.TreeData || { branches: [] };
  /* 从数据文件(assets/data/tree-data.js)迁入的配色工具：hsl → hex */
  const hexFromHsl = function (h, s, l) {
    s = s / 100; l = l / 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  };

  /*---- 主题感知配色 ----
     深色主题：原色（亮金）；浅色主题：亮度取反（亮金→深金、暗金→浅金），
     保证金色系在深/浅背景下都有足够对比度。
  */
  function isLightTheme() {
    const d = document.documentElement;
    return !!(d && d.getAttribute('data-theme') === 'light');
  }
  function themeHue(h, s, l) {
    return hexFromHsl(h, s, isLightTheme() ? Math.max(24, 100 - l) : l);
  }

  /*---- 布局持久化（节点位置 + 视角） ----*/
  const STORE_KEY = 'qiyuxi24-tree-layout-v1';

  /*---- 弱重力（仅科技树模式生效） ----
     forceX/Y 持续把节点缓慢拉回屏幕中心（布局原点）：
     - GRAVITY_ALPHA_TARGET：维持模拟运转的极低 alpha（> alphaMin 0.01，永不停摆），
       所有力都以该比例弱化 → 缓慢、不可察觉的向心漂移；
     - GRAVITY_ALPHA_BOOST：打开科技树时先喂一点能量，前 ~2s 有可见的"归位"感，
       随后自然衰减到 target 转入持续的极弱重力。
  */
  const GRAVITY_ALPHA_TARGET = 0.03;
  const GRAVITY_ALPHA_BOOST = 0.2;

  function loadLayout() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; }
  }
  function clearLayout() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
  }

  function buildNodes() {
    const nodes = [];
    const links = [];
    let nodeId = 0;

    nodes.push({
      id: 'root', name: treeData.name, icon: '👨‍💻',
      hue: 45, level: 0, parentId: null,
      x: 0, y: 0, desc: treeData.desc, subtitle: treeData.subtitle,
      isRoot: true, branchIndex: -1, branchName: 'root', branchIcon: '🌟',
      md: '' +
        '## ' + treeData.name + ' · ' + treeData.subtitle + '\n\n' +
        treeData.desc + '\n\n' +
        '> 把「爱好 · 经历 · 技术栈」种成一片星云，每个节点都是一条探索路径。\n\n' +
        '### 我的四片星域\n\n' +
        '- **⚙ 技术栈**：开发中不断点亮的能力树\n' +
        '- **❤ 爱好**：驱动我不断折腾的东西\n' +
        '- **★ 经历**：一路走来的里程碑\n' +
        '- **🚀 项目**：让想法落地的作品\n\n' +
        '点击下方相关节点，漫游我的星云。'
    });

    treeData.branches.forEach(function (branch, bi) {
      const bNode = {
        id: 'b' + bi, name: branch.name, icon: branch.icon, hue: branch.hue,
        level: 1, parentId: 'root', x: 0, y: 0, desc: branch.desc, isBranch: true,
        branchIndex: bi, branchName: branch.name, branchIcon: branch.icon,
        md: branch.md || ('## ' + branch.name + '\n\n' + branch.desc)
      };
      nodes.push(bNode);
      links.push({ source: 'root', target: bNode.id });

      branch.children.forEach(function (child) {
        const cNode = {
          id: 'c' + (nodeId++), name: child.name, icon: null, hue: child.hue,
          level: 2, parentId: bNode.id, x: 0, y: 0,
          desc: child.desc, levelDot: child.level,
          branchIndex: bi, branchName: branch.name, branchIcon: branch.icon,
          md: child.md || ('## ' + child.name + '\n\n' + child.desc)
        };
        nodes.push(cNode);
        links.push({ source: bNode.id, target: cNode.id });
      });
    });

    return { nodes, links };
  }

  function nodeRadius(n) {
    if (n.isRoot) return 28;
    if (n.isBranch) return 19;
    return (n.levelDot ? 10 + n.levelDot : 10);
  }

  function createTreeRenderer(opts) {
    const wrap = opts.wrap;
    const canvas = document.getElementById(opts.canvasId);
    const tooltip = document.getElementById(opts.tooltipId);
    if (!wrap || !canvas || !tooltip) return null;

    const { nodes, links } = buildNodes();
    const nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    // 节点质量：与视觉半径平方成正比（root 最重、branch 次之、child 最轻），
    // 供弱重力系统 F = G·M·m/(d²+SOFTEN²) 计算牵引力。
    nodes.forEach(function (n) { n.mass = Math.max(1, nodeRadius(n) * nodeRadius(n) / 40); });

    // 恢复持久化布局：有存储位置则用之，否则随机散布
    const stored = loadLayout();
    const hasStoredLayout = !!(stored && stored.positions);
    nodes.forEach(function (n) {
      if (stored && stored.positions && stored.positions[n.id]) {
        n.x = stored.positions[n.id][0];
        n.y = stored.positions[n.id][1];
        return;
      }
      if (n.isRoot) { n.x = 0; n.y = 0; return; }
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 320;
      n.x = Math.cos(a) * r;
      n.y = Math.sin(a) * r;
    });

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'tree-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    canvas.appendChild(svg);

    let W = 0, H = 0, lastW = 0, lastH = 0;
    let view = { scale: 1, tx: 0, ty: 0 };
    if (stored && stored.view) view = Object.assign({}, stored.view);
    let isNodeDragging = false;       // 节点拖拽中（d3.drag）
    let suppressClickUntil = 0;       // 拖拽结束后短暂抑制 click，避免误开 modal
    let gravityActive = false;        // 弱重力开关：仅科技树模式（setActive(true)）开启

    const gMain = document.createElementNS(NS, 'g');
    svg.appendChild(gMain);
    const gLink = document.createElementNS(NS, 'g');
    gMain.appendChild(gLink);
    const gNode = document.createElementNS(NS, 'g');
    gMain.appendChild(gNode);

    const nodeGroups = {};
    nodes.forEach(function (n) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'tree-node' + (n.isRoot ? ' is-root' : '') + (n.isBranch ? ' is-branch' : ''));
      g.dataset.id = n.id;
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      const size = nodeRadius(n);

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('class', 'tree-node-circle');
      circle.setAttribute('r', size);
      // fill / stroke / stroke-width 由 CSS 变量（--tree-node-*）控制，随主题切换自动更新
      g.appendChild(circle);

      if (n.icon) {
        const icon = document.createElementNS(NS, 'text');
        icon.setAttribute('class', 'tree-node-icon');
        icon.setAttribute('font-size', n.isRoot ? 20 : 16);
        icon.textContent = n.icon;
        g.appendChild(icon);
      } else {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('class', 'tree-node-dot');
        dot.setAttribute('r', 3);   // fill 由 CSS 变量 --tree-dot 控制
        g.appendChild(dot);
      }

      function addLabel(text, baseY, fontSize) {
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('class', 'tree-node-label');
        label.setAttribute('y', baseY);
        if (fontSize) label.setAttribute('font-size', fontSize);
        label.setAttribute('text-anchor', 'middle');
        label.textContent = text;
        g.appendChild(label);
      }
      if (n.isRoot) addLabel(n.name, -(size + 16), '15');
      else if (n.isBranch) addLabel(n.name, -(size + 14), '13');
      else addLabel(n.name, -(size + 10), '11');

      gNode.appendChild(g);
      nodeGroups[n.id] = g;

      g.addEventListener('mouseenter', function () { if (!isNodeDragging) hoverNode(n.id); });
      g.addEventListener('mouseleave', function () { unhoverNode(); });
      g.addEventListener('mousemove', function (e) {
        if (tooltip.classList.contains('show')) moveTooltip(e);
      });
      g.addEventListener('click', function () {
        if (Date.now() < suppressClickUntil) return;
        clickNode(n.id);
      });
    });

    const linkEls = {};
    links.forEach(function (l, idx) {
      const path = document.createElementNS(NS, 'line');
      path.setAttribute('class', 'tree-link');
      gLink.appendChild(path);
      linkEls[l.id || ('l' + idx)] = path;
      l.el = path;
    });

    function ticked() {
      // 根节点不再强制锚定中心：由中心重力源自然约束（拖走后会平滑飘回）
      nodes.forEach(function (n) {
        const g = nodeGroups[n.id];
        if (g) g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      });
      links.forEach(function (l) {
        if (!l.el) return;
        const s = l.source, t = l.target;
        l.el.setAttribute('x1', s.x);
        l.el.setAttribute('y1', s.y);
        l.el.setAttribute('x2', t.x);
        l.el.setAttribute('y2', t.y);
      });
    }

    /*---- 布局持久化 ----*/
    let persistTimer = null;
    function collectPositions() {
      const pos = {};
      nodes.forEach(function (n) { pos[n.id] = [n.x, n.y]; });
      return pos;
    }
    function persist() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ positions: collectPositions(), view: view }));
      } catch (e) { /* 隐私模式等：静默失败 */ }
    }
    function schedulePersist() {
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(persist, 600);
    }

    let simulation = null;
    // ---- 中心重力源（牛顿万有引力 + 节点质量）----
    // 屏幕中心（世界坐标 0,0）是一个恒定质量的重力源 M，
    // 所有节点（含根节点）都受它的万有引力，被慢慢拉回中心：
    //   F = G · M · m / (d² + SOFTEN²)
    // - m 为节点质量（与半径平方成正比，见上方 mass 初始化）：
    //   质量大的节点受引力强 → 分支层沉稳、叶子层轻飘；
    // - SOFTEN 软化距离：近中心时力收敛到有限值，不会突变；
    // - G 调得较小：弱重力，拖走后是"慢慢飘回中心"而非猛拉；
    // - 仅科技树模式（gravityActive）生效；树关闭时 simulation 已 stop，零消耗。
    const GRAVITY_G = 30;          // 引力常数（弱，越大回拉越猛）
    const GRAVITY_M = 100;         // 中心重力源质量（固定）
    const GRAVITY_SOFTEN = 60;     // 软化距离：d<60 时力不再增大
    const gravityForce = function (alpha) {
      if (!gravityActive) return;
      const soft2 = GRAVITY_SOFTEN * GRAVITY_SOFTEN;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.fx !== undefined || n.fy !== undefined) continue;   // 拖拽锁定中不干扰
        const dx = -n.x, dy = -n.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) || 1;
        const f = GRAVITY_G * GRAVITY_M * (n.mass || 1) / (d2 + soft2);
        n.vx += (dx / d) * f * alpha;
        n.vy += (dy / d) * f * alpha;
      }
    };

    if (window.d3 && d3.forceSimulation) {
      // ---- 后端力学系统 ----
      //   link    —— 层级弹簧：保持父子结构（root→branch→child）
      //   charge  —— 负电荷互斥：星云散开、节点间留白
      //   collide —— 碰撞：防止节点重叠
      //   gravity —— 弱重力（万有引力+质量）：打开科技树后持续把节点牵回中心
      //   x / y   —— 基线向心：仅供初始布局收敛用（强度很低）
      // alphaDecay 0.02：初始布局约 2~3s 自然衰减停摆（树不可见时已完成），
      // 此后保持静止，仅拖拽 / 重置 / 首次打开时短暂加热。
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(150).strength(0.6))
        .force('charge', d3.forceManyBody().strength(-320))
        .force('collide', d3.forceCollide().radius(function (d) { return nodeRadius(d) + 8; }).iterations(2))
        .force('gravity', gravityForce)
        .force('x', d3.forceX(0).strength(0.03))
        .force('y', d3.forceY(0).strength(0.03))
        .alphaMin(0.01)
        .alphaDecay(0.02)
        .velocityDecay(0.5)
        .alpha(hasStoredLayout ? 0 : 1)   // 有持久化布局 → 直接静止；否则从随机布局自然收敛
        .on('tick', ticked);
    } else {
      // 无 d3（CDN 失败）：降级为手动布局
      nodes.forEach(function (n) {
        if (n.isRoot) { n.x = 0; n.y = 0; }
        else if (n.isBranch) {
          const bi = parseInt(n.id.slice(1), 10);
          const a = (bi / 4) * Math.PI * 2 - Math.PI / 2;
          n.x = Math.cos(a) * 180; n.y = Math.sin(a) * 180;
        } else {
          const bi = parseInt(n.parentId.slice(1), 10);
          const ci = parseInt(n.id.slice(1), 10) % 8;
          const a = (bi / 4) * Math.PI * 2 - Math.PI / 2 + (ci - 3.5) * 0.22;
          n.x = Math.cos(a) * 330; n.y = Math.sin(a) * 330;
        }
      });
      ticked();
    }

    /*---- 显式激活控制：tree.js 打开/关闭时调用 ----*/
    // true：开启弱重力 —— 喂一点能量后维持极低 alpha（GRAVITY_ALPHA_TARGET），
    //       forceX/Y 持续把节点缓慢拖回屏幕中心，图保持轻微呼吸、形态不散。
    // false：关闭弱重力，彻底停摆，零 CPU 占用。
    function setActive(active) {
      if (!simulation) return;
      gravityActive = !!active;
      if (active) {
        // 打开：喂能量 + 持续弱重力（alphaTarget 使 alpha 停在 GRAVITY_ALPHA_TARGET）
        simulation.alphaTarget(GRAVITY_ALPHA_TARGET);
        simulation.alpha(Math.max(GRAVITY_ALPHA_BOOST, simulation.alpha()));
        simulation.restart();
      } else {
        // 关闭：释放拖拽锁定（防止拖动中途退出导致节点永久钉死），彻底停摆零 CPU
        nodes.forEach(function (n) {
          if (n.fx !== undefined) delete n.fx;
          if (n.fy !== undefined) delete n.fy;
        });
        simulation.alphaTarget(0).alpha(0).stop();
      }
    }

    // 节点拖拽：d3.drag 挂到每个节点上。
    // 拖拽中节点 fx/fy 锁定跟随鼠标（世界坐标），simulation.alphaTarget 加热，
    // 邻居被 forceLink 弹簧拉着一起走；松手后释放锁定并保留抛掷惯性，
    // 节点带着余速滑出，再由中心重力源 + 弹簧慢慢拉回 —— 顺滑不生硬。
    if (window.d3 && d3.drag) {
      nodes.forEach(function (n) {
        const g = nodeGroups[n.id];
        if (!g) return;
        let dragMoved = false;
        let startX = 0, startY = 0, prevX = 0, prevY = 0, throwVX = 0, throwVY = 0;
        d3.drag()
          .on('start', function (event) {
            if (!simulation) return;
            const se = event.sourceEvent;
            if (se && se.stopPropagation) se.stopPropagation();
            isNodeDragging = true;
            dragMoved = false;
            startX = event.x; startY = event.y;
            prevX = event.x; prevY = event.y;
            throwVX = 0; throwVY = 0;
            n.fx = n.x; n.fy = n.y;                 // 锁定起始位置，防止跳动
            simulation.alphaTarget(0.3).restart();  // 加热模拟，让邻居被弹簧带动
            g.classList.add('is-dragging');
            svg.style.cursor = 'grabbing';
            unhoverNode();                          // 拖拽中不显示 tooltip / 高亮
          })
          .on('drag', function (event) {
            if (!simulation) return;
            if (!dragMoved && Math.hypot(event.x - startX, event.y - startY) > 4) dragMoved = true;
            n.fx = event.x;                          // d3.pointer 已计入 gMain 的 transform，即世界坐标
            n.fy = event.y;
            throwVX = (event.x - prevX) * 1.5;       // 跟踪拖拽速度，松手时作为抛掷惯性
            throwVY = (event.y - prevY) * 1.5;
            prevX = event.x; prevY = event.y;
            simulation.alphaTarget(0.3);
          })
          .on('end', function () {
            if (!simulation) return;
            // 松手：无论是否真拖，都释放 fx/fy 锁定 ——
            // 节点回到力学系统支配之下，而不是钉死原地。
            if (n.fx !== undefined) delete n.fx;
            if (n.fy !== undefined) delete n.fy;
            // 抛掷惯性：继承最后拖拽速度，节点带余速滑出一段，
            // 再由中心重力源 + 弹簧慢慢拉回 —— 松手动作平滑不生硬
            n.vx = throwVX;
            n.vy = throwVY;
            // 不做额外猛加热：alpha 自然从拖拽时的 0.3 衰减回弱重力 target，
            // 重力源持续工作，节点缓慢飘回中心
            simulation.alphaTarget(gravityActive ? GRAVITY_ALPHA_TARGET : 0);
            simulation.restart();
            isNodeDragging = false;
            g.classList.remove('is-dragging');
            svg.style.cursor = '';
            schedulePersist();                       // 保存新布局（邻居稳定后 600ms 再写）
            if (dragMoved) {
              suppressClickUntil = Date.now() + 350; // 抑制拖拽后误触发的 click
            }
          })(d3.select(g));  // d3 v7 的 drag 必须接收 selection，传原生 DOM 会抛 t.on is not a function
      });
    }

    function applyView() {
      gMain.setAttribute('transform', 'translate(' + view.tx + ',' + view.ty + ') scale(' + view.scale + ')');
    }

    // resize：首次居中（并恢复持久化视角）；窗口变化时保持内容中心
    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if (!lastW) {
        view.tx = W / 2;
        view.ty = H / 2;
        view.scale = Math.max(0.4, Math.min(1.15, Math.min(W, H) / 780));
        if (stored && stored.view) view = Object.assign({}, stored.view);
      } else {
        view.tx += (W - lastW) / 2;
        view.ty += (H - lastH) / 2;
      }
      lastW = W; lastH = H;
      applyView();
    }

    let isDragging = false;
    let startX = 0, startY = 0, startTx = 0, startTy = 0;

    canvas.addEventListener('mousedown', function (e) {
      if (e.target === svg || e.target === canvas) {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startTx = view.tx; startTy = view.ty;
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
      if (isDragging) { isDragging = false; svg.style.cursor = 'grab'; schedulePersist(); }
    });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.35, Math.min(2.4, view.scale * factor));
      view.tx = mx - (mx - view.tx) * (newScale / view.scale);
      view.ty = my - (my - view.ty) * (newScale / view.scale);
      view.scale = newScale;
      applyView();
      schedulePersist();
    }, { passive: false });

    let touchStart = null, pinchStart = null;
    function dist(ts) { return Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY); }
    canvas.addEventListener('touchstart', function (e) {
      if (e.target && e.target.closest && e.target.closest('.tree-node')) return; // 节点上的触摸交给 d3.drag
      if (e.touches.length === 1) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: view.tx, ty: view.ty };
      else if (e.touches.length === 2) pinchStart = dist(e.touches);
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (isNodeDragging) return; // 正在拖节点：视图平移让位给 d3.drag
      e.preventDefault();
      if (e.touches.length === 1 && touchStart) {
        view.tx = touchStart.tx + (e.touches[0].clientX - touchStart.x);
        view.ty = touchStart.ty + (e.touches[0].clientY - touchStart.y);
        applyView();
      } else if (e.touches.length === 2) {
        const d = dist(e.touches);
        if (pinchStart) {
          const newScale = Math.max(0.35, Math.min(2.4, view.scale * (d / pinchStart)));
          view.scale = newScale; applyView();
        }
        pinchStart = d;
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function () { touchStart = null; pinchStart = null; schedulePersist(); }, { passive: true });

    wrap.querySelector('[data-tree-zoom="in"]').addEventListener('click', function () { zoomAt(1, W / 2, H / 2); });
    wrap.querySelector('[data-tree-zoom="out"]').addEventListener('click', function () { zoomAt(2, W / 2, H / 2); });
    wrap.querySelector('[data-tree-reset]').addEventListener('click', resetView);
    function zoomAt(factor, cx, cy) {
      const newScale = Math.max(0.35, Math.min(2.4, view.scale * factor));
      view.tx = cx - (cx - view.tx) * (newScale / view.scale);
      view.ty = cy - (cy - view.ty) * (newScale / view.scale);
      view.scale = newScale; applyView();
      schedulePersist();
    }

    function resetView() {
      clearLayout();                                // 丢弃持久化布局，重新力导向布局
      nodes.forEach(function (n) {
        if (n.fx !== undefined) delete n.fx;
        if (n.fy !== undefined) delete n.fy;
      });
      if (simulation) simulation.alpha(0.8).restart();
      lastW = 0;                                    // 重新居中视角
      resize();
      schedulePersist();
    }

    function linkNode(l, side) {
      const v = l[side];
      return (v && typeof v === 'object' && v.id !== undefined) ? v.id : v;
    }
    function findLinksOf(id) {
      return links.filter(function (l) {
        return linkNode(l, 'source') === id || linkNode(l, 'target') === id;
      });
    }

    function colorNode(nodeEl, n, mode) {
      if (!nodeEl) return;
      const circle = nodeEl.querySelector('.tree-node-circle');
      if (!circle) return;
      if (mode === 'hover' || mode === 'active') {
        // hover 高亮：金色彩环 + 同色系填充（亮度随主题取反）
        circle.setAttribute('stroke', themeHue(n.hue, 70, 65));
        circle.setAttribute('fill', themeHue(n.hue, 35, 14));
        nodeEl.classList.add(mode === 'hover' ? 'is-hover' : 'is-active');
      } else {
        // 恢复默认：移除内联颜色，交给 CSS 变量控制
        circle.removeAttribute('stroke');
        circle.removeAttribute('fill');
        nodeEl.classList.remove('is-hover', 'is-active');
      }
    }

    // hover：只做视觉（高亮 + tooltip + 邻接提亮），不加热 simulation —— 图保持静止
    function hoverNode(id) {
      const n = nodeMap[id];
      const related = new Set([id]);
      findLinksOf(id).forEach(function (l) {
        related.add(linkNode(l, 'source'));
        related.add(linkNode(l, 'target'));
        if (l.el) {
          l.el.classList.add('is-lit');
          const sId = linkNode(l, 'source');
          const tId = linkNode(l, 'target');
          const s = nodeMap[sId], t = nodeMap[tId];
          const stroke = s && t
            ? themeHue((s.hue + t.hue) / 2, 55, 60)
            : (isLightTheme() ? 'hsl(0,0%,45%)' : 'hsl(0,0%,70%)');
          l.el.setAttribute('stroke', stroke);
        }
      });
      nodes.forEach(function (node) {
        if (!related.has(node.id)) nodeGroups[node.id].classList.add('dimmed');
      });
      colorNode(nodeGroups[id], n, 'hover');
      showTooltip(n);
    }
    function unhoverNode() {
      nodes.forEach(function (node) {
        nodeGroups[node.id].classList.remove('dimmed');
        colorNode(nodeGroups[node.id], node, 'default');
      });
      links.forEach(function (l) {
        if (!l.el) return;
        l.el.classList.remove('is-lit');
        l.el.setAttribute('stroke', '');
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
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      if (x + tw > wrapRect.width - 8) x = e.clientX - wrapRect.left - tw - 16;
      if (y + th > wrapRect.height - 8) y = e.clientY - wrapRect.top - th - 8;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
    function hideTooltip() { tooltip.classList.remove('show'); }

    // 点击聚焦：节点此时已静止（无加热），直接 gsap 平滑缩放定位，不跳变
    function clickNode(id) {
      const n = nodeMap[id];
      unhoverNode();
      hoverNode(id);
      const targetScale = Math.max(view.scale, 1.3);
      const tx = W / 2 - n.x * targetScale;
      const ty = H / 2 - n.y * targetScale;
      if (window.gsap) {
        window.gsap.to(view, {
          tx: tx, ty: ty, scale: targetScale,
          duration: 0.5, ease: 'power2.out',
          onUpdate: applyView,
          onComplete: schedulePersist
        });
      } else {
        view.tx = tx; view.ty = ty; view.scale = targetScale;
        applyView(); schedulePersist();
      }
      setTimeout(function () { hideTooltip(); }, 600);
      openModal(n.id);
    }

    const modal = document.getElementById('tree-modal');
    let currentModalId = null;   // 当前打开的节点 id（主题切换时刷新分支色）
    function openModal(id) {
      const n = nodeMap[id];
      if (!n || !modal) return;
      currentModalId = id;
      const body = document.getElementById('tree-modal-body');
      const title = document.getElementById('tree-modal-title');
      const icon = document.getElementById('tree-modal-icon');
      const branch = document.getElementById('tree-modal-branch');

      icon.textContent = n.icon || (n.isBranch ? '✦' : '•');
      title.textContent = n.name;
      if (n.subtitle) title.textContent = n.name;
      branch.textContent = n.isRoot ? '星云中心' : (n.branchName || '');
      branch.style.color = themeHue(n.hue, 90, 72);
      branch.style.borderColor = themeHue(n.hue, 90, 72);

      let mdHtml = '';
      if (window.marked && window.marked.parse) {
        mdHtml = marked.parse(n.md || ('## ' + n.name + '\n\n' + (n.desc || '')));
      } else {
        mdHtml = '<h2>' + n.name + '</h2><p>' + (n.desc || '') + '</p>';
      }

      const related = getRelatedNodes(id);
      let relatedHtml = '';
      if (related.length) {
        relatedHtml = '<div class="tree-modal-related">' +
          '<div class="tree-modal-related-label">相关节点</div>' +
          '<div class="tree-modal-related-list">' +
          related.map(function (r) {
            return '<span class="tree-modal-related-link" data-tree-rel="' + r.id + '">' +
              (r.icon || '•') + ' ' + r.name + '</span>';
          }).join('') +
          '</div></div>';
      }

      body.innerHTML = mdHtml + relatedHtml;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');

      body.querySelectorAll('[data-tree-rel]').forEach(function (el) {
        el.addEventListener('click', function () {
          openModal(el.getAttribute('data-tree-rel'));
        });
      });
    }

    function closeModal() {
      if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
      currentModalId = null;
    }

    function getRelatedNodes(id) {
      const seen = {};
      const list = [];
      findLinksOf(id).forEach(function (l) {
        ['source', 'target'].forEach(function (side) {
          const rid = linkNode(l, side);
          if (rid !== id && !seen[rid]) {
            seen[rid] = true;
            list.push(nodeMap[rid]);
          }
        });
      });
      return list;
    }

    if (modal) {
      const closeBtn = modal.querySelector('[data-tree-modal-close]');
      const backdrop = modal.querySelector('[data-tree-modal-backdrop]');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (backdrop) backdrop.addEventListener('click', closeModal);
    }

    const searchInput = document.getElementById('tree-search-input');
    const searchClear = document.querySelector('[data-tree-search-clear]');
    let lastQuery = '';

    function applySearch() {
      const q = lastQuery.trim().toLowerCase();
      if (searchClear) searchClear.classList.toggle('show', q.length > 0);
      if (!q) {
        nodes.forEach(function (n) {
          nodeGroups[n.id].classList.remove('search-hidden');
          nodeGroups[n.id].classList.remove('search-hit');
        });
        links.forEach(function (l) { if (l.el) l.el.classList.remove('search-dim'); });
        return;
      }
      nodes.forEach(function (n) {
        const hit = n.name.toLowerCase().indexOf(q) !== -1;
        nodeGroups[n.id].classList.toggle('search-hit', hit);
        nodeGroups[n.id].classList.toggle('search-hidden', !hit);
      });
      links.forEach(function (l) {
        const s = nodeMap[linkNode(l, 'source')];
        const t = nodeMap[linkNode(l, 'target')];
        const keep = (s && s.name.toLowerCase().indexOf(q) !== -1) || (t && t.name.toLowerCase().indexOf(q) !== -1);
        if (l.el) l.el.classList.toggle('search-dim', !keep);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        lastQuery = this.value;
        applySearch();
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) { searchInput.value = ''; lastQuery = ''; applySearch(); searchInput.focus(); }
      });
    }

    const legend = document.getElementById('tree-legend');
    function buildLegend() {
      if (!legend) return;
      const byBranch = {};
      nodes.forEach(function (n) {
        if (n.isRoot) return;
        const key = n.branchIndex;
        if (!byBranch[key]) {
          byBranch[key] = { name: n.branchName, icon: n.branchIcon, hue: n.hue, count: 0 };
        }
        byBranch[key].count++;
      });
      legend.innerHTML = Object.keys(byBranch).map(function (k) {
        const b = byBranch[k];
        return '<div class="tree-legend-item">' +
          '<span class="tree-legend-dot" style="background:' + themeHue(b.hue, 50, 60) + ';"></span>' +
          '<span class="tree-legend-name">' + (b.icon ? b.icon + ' ' : '') + b.name + '</span>' +
          '<span class="tree-legend-count">' + b.count + '</span>' +
          '</div>';
      }).join('');
    }
    buildLegend();

    // 主题切换：重建图例（内联背景色）+ 刷新弹窗分支色 + 重置 hover 状态
    let lastTheme = isLightTheme();
    const themeObserver = new MutationObserver(function () {
      if (isLightTheme() === lastTheme) return;
      lastTheme = isLightTheme();
      buildLegend();
      unhoverNode();
      if (currentModalId && modal && modal.classList.contains('show')) openModal(currentModalId);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    return {
      resize: resize,
      resetView: resetView,
      svg: svg,
      openModal: openModal,
      closeModal: closeModal,
      setActive: setActive
    };
  }

  window.TreeAPI = window.TreeAPI || {};
  window.TreeAPI.createTreeRenderer = createTreeRenderer;
})();
