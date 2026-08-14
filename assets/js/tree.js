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

  /*------------------------------------*\
    #1. 数据
  \*------------------------------------*/
  const TREE_DATA = {
    name: '佀佳超',
    subtitle: 'AI 应用开发者',
    desc: '西北工业大学 · 人工智能专业在读，把每个想法变成能跑的东西。',
    branches: [
      {
        name: '技术栈', icon: '⚙', hue: 45,
        desc: '开发中不断点亮的能力树',
        md: '' +
          '## 我的技术栈\n\n' +
          '从底层到应用，一路点亮的能力树。核心路径是 **Python → 深度学习 → 端侧应用**。\n\n' +
          '> 信奉：*项目 + 文档 > 看书*，边做边学。\n\n' +
          '![技术栈示意图](./assets/images/icon-dev.svg)\n\n' +
          '### 语言谱系\n\n' +
          '- **Python**：主力，深度学习 / 后端\n' +
          '- **C / C++**：系统基础\n' +
          '- **Rust / Tauri**：桌面端\n' +
          '- **Vue 3 / FastAPI**：全栈 Web\n',
        children: [
          { name: 'Python', hue: 45, desc: '深度学习、后端脚本主力语言', level: 4,
            md: '## Python\n\n深度学习与后端的主力语言，几乎所有 AI 项目都从它开始。\n\n- NumPy 手写神经网络\n- FastAPI 后端\n- 数据处理与脚本\n\n```python\ndef hello():\n    return "AI 应用开发者"\n```' },
          { name: 'C / C++', hue: 45, desc: '系统级基础，Tauri/Rust 之前的功底', level: 3,
            md: '## C / C++\n\n系统级编程基础，理解内存与性能的起点。\n\n### 为什么重要\n\nTauri / Rust 桌面开发之前，靠它打下的底层功底。' },
          { name: 'Rust / Tauri', hue: 45, desc: '端侧 AI IDE 的桌面层，~5MB 安装包', level: 3,
            md: '## Rust / Tauri\n\n端侧 AI IDE（Votek）的桌面层，安装包只有 ~5MB，纯本地运行。\n\n| 技术 | 用途 |\n| --- | --- |\n| Tauri v2 | 桌面壳 |\n| Rust | 后端逻辑 |\n| React 19 | 前端 UI |' },
          { name: 'Vue 3', hue: 45, desc: 'AI 教育系统前端', level: 3,
            md: '## Vue 3\n\nAI 教育系统（AI-tutor）的前端，配合知识图谱做对话式学习。' },
          { name: 'FastAPI', hue: 45, desc: 'JWT + 限流 + SSE 流式后端全套', level: 3,
            md: '## FastAPI\n\nPython 异步后端，JWT 认证 + IP 限流 + SSE 流式对话全套。' },
          { name: '深度学习', hue: 45, desc: '纯 NumPy 手写 CNN，MNIST 实战', level: 3,
            md: '## 深度学习\n\n纯 NumPy 手写神经网络与 CNN，MNIST 实战。\n\n![CNN 项目](./assets/images/project-4.png)\n\n- 前向 / 反向传播\n- 卷积层从零实现\n- MNIST 手写识别' },
          { name: 'PyTorch', hue: 45, desc: '正在学习的下一站', level: 2,
            md: '## PyTorch\n\n深度学习框架的下一站，正在学习中。' },
        ]
      },
      {
        name: '爱好', icon: '❤', hue: 200,
        desc: '驱动我不断折腾的东西',
        md: '## 我的爱好\n\n驱动我不断折腾的原动力。\n\n- **写代码**：项目 + 文档 > 看书\n- **折腾 AI**：Agent、端侧模型、工具链\n- **分享**：B站 / 知乎记录踩坑\n- **阅读**：技术与非技术都看',
        children: [
          { name: '写代码', hue: 200, desc: '项目 + 文档 > 看书', level: 4,
            md: '## 写代码\n\n信奉「项目 + 文档 > 看书」，把每个想法变成能跑的东西。' },
          { name: '折腾 AI', hue: 200, desc: 'Agent、端侧模型、工具链', level: 4,
            md: '## 折腾 AI\n\nAgent、端侧模型、工具链，探索 AI 应用的下一个可能。' },
          { name: '分享', hue: 200, desc: 'B站 / 知乎记录踩坑与心得', level: 3,
            md: '## 分享\n\nB站 / 知乎记录踩坑与心得，把知识沉淀下来。' },
          { name: '阅读', hue: 200, desc: '技术与非技术的书都看', level: 3,
            md: '## 阅读\n\n技术与非技术的书都看，保持输入。' },
        ]
      },
      {
        name: '经历', icon: '★', hue: 300,
        desc: '一路走来的里程碑',
        md: '## 我的经历\n\n一路走来的里程碑节点。\n\n- 西工大 AI 专业在读\n- AIGC 大赛地区二等奖\n- NWPU-CS 创新项目\n- AI+教育大赛备赛中',
        children: [
          { name: '西工大 AI 专业', hue: 300, desc: '2024 — 2028，AI 应用方向', level: 4,
            md: '## 西工大 · 人工智能\n\n2024 — 2028，AI 应用方向，主攻大模型应用、Agent 与桌面软件开发。' },
          { name: 'AIGC 大赛二等奖', hue: 300, desc: 'vivo+南开 AIGC 大赛地区二等奖', level: 4,
            md: '## AIGC 大赛 · 地区二等奖\n\nvivo + 南开 AIGC 大赛，参赛作品 **KinVoice（家语 AI）**。' },
          { name: 'NWPU-CS 创新项目', hue: 300, desc: 'AI 教育导师，知识图谱驱动', level: 4,
            md: '## NWPU-CS 创新项目\n\nAI 教育导师（AI-tutor），知识图谱驱动。' },
          { name: 'AI+教育大赛', hue: 300, desc: '中国教育技术协会赛事，备赛中', level: 3,
            md: '## AI+教育大赛\n\n中国教育技术协会「AI+教育」创新应用技能大赛，大学生 OPC 创新创业 AI Agent 赛道，备赛中。' },
        ]
      },
      {
        name: '项目', icon: '🚀', hue: 160,
        desc: '让想法落地的作品',
        md: '## 我的项目\n\n让想法落地的作品合集。\n\n> 每一个项目都是一次「从想法到能跑」的完整闭环。',
        children: [
          { name: 'Votek', hue: 160, desc: '端侧桌面 AI IDE，纯本地运行', level: 4,
            md: '## Votek · 端侧桌面 AI IDE\n\nTauri v2 + React 19 打造的端侧 AI IDE，安装包只有 ~5MB，纯本地运行。\n\n![Votek 界面](./assets/images/project-1.jpg)\n\n### 核心能力\n\n- 流式对话\n- 多模型一键切换\n- MCP 服务器管理\n- Skills 技能市场\n- 内置浏览器\n\n```bash\n# 端侧运行，数据不出本地\nvotek\n```\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/Agent)' },
          { name: 'AI-tutor', hue: 160, desc: '两阶段流式对话的教育导师', level: 4,
            md: '## AI-tutor · AI 教育导师\n\nVue 3 + FastAPI + 知识图谱，两阶段流式对话的 AI 教育导师。\n\n![AI-tutor](./assets/images/project-2.png)\n\n### 技术亮点\n\n- Function Calling 后台执行\n- JWT + bcrypt + IP 限流安全体系\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/AI-tutor)' },
          { name: 'KinVoice', hue: 160, desc: '家语 AI，陪伴式对话 + 经验卡片', level: 4,
            md: '## KinVoice · 家语 AI\n\n陪伴式 AI 对话应用，NVC 四要素拆解 + 经验卡片沉淀。\n\n![KinVoice](./assets/images/project-3.jpg)\n\n- 陪伴式对话\n- 经验卡片 CRUD\n- NVC 非暴力沟通模型\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/KinVoice)' },
          { name: 'CNN-learning', hue: 160, desc: '从零手写神经网络的开源课程', level: 4,
            md: '## CNN-learning · 从零实现神经网络\n\n纯 NumPy 手写神经网络与 CNN 的开源课程。\n\n![CNN 课程](./assets/images/project-4.png)\n\n### 内容\n\n- 8 课 NumPy 从零实现（L01-L08）\n- MNIST 实战\n- MIT 协议开源\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/CNN-learning)' },
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
    #2. 构建节点/边
  \*------------------------------------*/
  function buildNodes() {
    const nodes = [];
    const links = [];
    let nodeId = 0;

    // 根节点（默认详情的 Markdown）
    nodes.push({
      id: 'root', name: TREE_DATA.name, icon: '👨‍💻',
      hue: 45, level: 0, parentId: null,
      x: 0, y: 0, desc: TREE_DATA.desc, subtitle: TREE_DATA.subtitle,
      isRoot: true, branchIndex: -1, branchName: 'root', branchIcon: '🌟',
      md: '' +
        '## ' + TREE_DATA.name + ' · ' + TREE_DATA.subtitle + '\n\n' +
        TREE_DATA.desc + '\n\n' +
        '> 把「爱好 · 经历 · 技术栈」种成一片星云，每个节点都是一条探索路径。\n\n' +
        '### 我的四片星域\n\n' +
        '- **⚙ 技术栈**：开发中不断点亮的能力树\n' +
        '- **❤ 爱好**：驱动我不断折腾的东西\n' +
        '- **★ 经历**：一路走来的里程碑\n' +
        '- **🚀 项目**：让想法落地的作品\n\n' +
        '点击下方相关节点，漫游我的星云。'
    });

    TREE_DATA.branches.forEach(function (branch, bi) {
      const bNode = {
        id: 'b' + bi, name: branch.name, icon: branch.icon, hue: branch.hue,
        level: 1, parentId: 'root', x: 0, y: 0, desc: branch.desc, isBranch: true,
        branchIndex: bi, branchName: branch.name, branchIcon: branch.icon,
        md: branch.md || ('## ' + branch.name + '\n\n' + branch.desc)
      };
      nodes.push(bNode);
      links.push({ source: 'root', target: bNode.id });

      branch.children.forEach(function (child, ci) {
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

  // 节点半径（用于碰撞与可视化）
  function nodeRadius(n) {
    if (n.isRoot) return 28;
    if (n.isBranch) return 19;
    return (n.levelDot ? 10 + n.levelDot : 10);
  }

  /*------------------------------------*\
    #3. 渲染器（背景星云版）
  \*------------------------------------*/
  function initTree(opts) {
    const wrap = opts.wrap;
    const canvas = document.getElementById(opts.canvasId);
    const tooltip = document.getElementById(opts.tooltipId);
    if (!wrap || !canvas || !tooltip) return null;

    const { nodes, links } = buildNodes();
    const nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    // 初始随机散布（让物理引擎从混沌演化为有序星云）
    nodes.forEach(function (n) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 320;
      n.x = Math.cos(a) * r;
      n.y = Math.sin(a) * r;
    });

    /* SVG 构建 */
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'tree-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    canvas.appendChild(svg);

    let W = 0, H = 0;
    let view = { scale: 1, tx: 0, ty: 0 };

    const gMain = document.createElementNS(NS, 'g');   // 承载 view 变换（连线 + 节点）
    svg.appendChild(gMain);
    const gLink = document.createElementNS(NS, 'g');   // 连线（在节点下层）
    gMain.appendChild(gLink);
    const gNode = document.createElementNS(NS, 'g');   // 节点（在连线上层）
    gMain.appendChild(gNode);

    // 节点群组
    const nodeGroups = {};
    nodes.forEach(function (n) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'tree-node' + (n.isRoot ? ' is-root' : '') + (n.isBranch ? ' is-branch' : ''));
      g.dataset.id = n.id;
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      const size = nodeRadius(n);

      // 外层光晕（星云感）
      const halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'tree-node-halo');
      halo.setAttribute('r', size * 2.4);
      halo.setAttribute('fill', hexFromHsl(n.hue, 95, 62));
      g.appendChild(halo);

      // 核心圆
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('class', 'tree-node-circle');
      circle.setAttribute('r', size);
      circle.setAttribute('fill', hexFromHsl(n.hue, 55, 16));
      circle.setAttribute('stroke', hexFromHsl(n.hue, 90, 62));
      circle.setAttribute('stroke-width', n.isRoot ? 2.5 : 1.8);
      g.appendChild(circle);

      if (n.icon) {
        const icon = document.createElementNS(NS, 'text');
        icon.setAttribute('class', 'tree-node-icon');
        icon.setAttribute('font-size', n.isRoot ? 24 : 18);
        icon.textContent = n.icon;
        g.appendChild(icon);
      } else {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('class', 'tree-node-dot');
        dot.setAttribute('r', 4);
        dot.setAttribute('fill', hexFromHsl(n.hue, 95, 70));
        g.appendChild(dot);
      }

      // 标签：放在节点上方
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

      // 事件
      g.addEventListener('mouseenter', function () { hoverNode(n.id); });
      g.addEventListener('mouseleave', function () { unhoverNode(); });
      g.addEventListener('mousemove', function (e) {
        if (tooltip.classList.contains('show')) moveTooltip(e);
      });
      g.addEventListener('click', function () { clickNode(n.id); });
    });

    // 连线（坐标由物理引擎 tick 实时更新）
    const linkEls = {};
    links.forEach(function (l, idx) {
      const path = document.createElementNS(NS, 'line');
      path.setAttribute('class', 'tree-link');
      gLink.appendChild(path);
      linkEls[l.id || ('l' + idx)] = path;
      l.el = path;
    });

    // 由 d3-force 更新节点/连线位置
    function ticked() {
      // 根节点锁定在中心，星云围绕它展开
      const root = nodeMap['root'];
      if (root) { root.x = 0; root.y = 0; }

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

    /* 物理引擎：d3-force（Obsidian Graph View 同款重力模型） */
    let simulation = null;
    if (window.d3 && d3.forceSimulation) {
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (d) { return d.id; })
          .distance(150).strength(0.65))
        .force('charge', d3.forceManyBody().strength(-300))   // 万有引力：斥力让节点散开
        .force('collide', d3.forceCollide()
          .radius(function (d) { return nodeRadius(d) + 8; }).iterations(2))
        .force('center', d3.forceCenter(0, 0))                 // 中心引力
        .force('x', d3.forceX(0).strength(0.06))               // 轻微拉回，防漂散
        .force('y', d3.forceY(0).strength(0.06))
        .alpha(1).alphaDecay(0.035).velocityDecay(0.5)
        .on('tick', ticked);
    } else {
      // 兜底：d3 CDN 未加载时，用简单径向布局
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

    /* 视口变换 */
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
      view.scale = Math.max(0.4, Math.min(1.15, Math.min(W, H) / 780));
      applyView();
    }

    /* 交互：拖拽 + 缩放 */
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
      if (isDragging) { isDragging = false; svg.style.cursor = 'grab'; }
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
    }, { passive: false });

    // 触摸
    let touchStart = null, pinchStart = null;
    function dist(ts) { return Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY); }
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: view.tx, ty: view.ty };
      else if (e.touches.length === 2) pinchStart = dist(e.touches);
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
          const newScale = Math.max(0.35, Math.min(2.4, view.scale * (d / pinchStart)));
          view.scale = newScale; applyView();
        }
        pinchStart = d;
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function () { touchStart = null; pinchStart = null; }, { passive: true });

    // 工具栏
    wrap.querySelector('[data-tree-zoom="in"]').addEventListener('click', function () { zoomAt(1, W / 2, H / 2); });
    wrap.querySelector('[data-tree-zoom="out"]').addEventListener('click', function () { zoomAt(2, W / 2, H / 2); });
    wrap.querySelector('[data-tree-reset]').addEventListener('click', resetView);
    function zoomAt(factor, cx, cy) {
      const newScale = Math.max(0.35, Math.min(2.4, view.scale * factor));
      view.tx = cx - (cx - view.tx) * (newScale / view.scale);
      view.ty = cy - (cy - view.ty) * (newScale / view.scale);
      view.scale = newScale; applyView();
    }
    function resetView() { resize(); }

    /* 高亮 & tooltip（d3-force 会把 link.source/target 转成节点对象，需兼容） */
    function linkNode(l, side) {
      const v = l[side];
      return (v && typeof v === 'object' && v.id !== undefined) ? v.id : v;
    }
    function findLinksOf(id) {
      return links.filter(function (l) {
        return linkNode(l, 'source') === id || linkNode(l, 'target') === id;
      });
    }
    function hoverNode(id) {
      const n = nodeMap[id];
      const related = new Set([id]);
      findLinksOf(id).forEach(function (l) {
        related.add(linkNode(l, 'source'));
        related.add(linkNode(l, 'target'));
        if (l.el) l.el.classList.add('is-lit');
      });
      nodes.forEach(function (node) {
        if (!related.has(node.id)) nodeGroups[node.id].classList.add('dimmed');
      });
      showTooltip(n);
    }
    function unhoverNode() {
      nodes.forEach(function (node) { nodeGroups[node.id].classList.remove('dimmed'); });
      links.forEach(function (l) { if (l.el) l.el.classList.remove('is-lit'); });
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

    /*------------------------------------*\
      #3.6 点击节点 → 打开详情卡片（Markdown 渲染）
    \*------------------------------------*/
    function clickNode(id) {
      const n = nodeMap[id];
      unhoverNode();
      hoverNode(id);
      // 平滑聚焦到该节点
      const targetScale = Math.max(view.scale, 1.3);
      view.tx = W / 2 - n.x * targetScale;
      view.ty = H / 2 - n.y * targetScale;
      view.scale = targetScale;
      applyView();
      setTimeout(function () { hideTooltip(); }, 600);
      openModal(n.id);
    }

    /* 详情卡片 */
    const modal = document.getElementById('tree-modal');
    function openModal(id) {
      const n = nodeMap[id];
      if (!n || !modal) return;
      const body = document.getElementById('tree-modal-body');
      const title = document.getElementById('tree-modal-title');
      const icon = document.getElementById('tree-modal-icon');
      const branch = document.getElementById('tree-modal-branch');

      // 标题 + 图标 + 分支标签
      icon.textContent = n.icon || (n.isBranch ? '✦' : '•');
      title.textContent = n.name;
      if (n.subtitle) title.textContent = n.name;
      branch.textContent = n.isRoot ? '星云中心' : (n.branchName || '');
      branch.style.color = hexFromHsl(n.hue, 90, 72);
      branch.style.borderColor = hexFromHsl(n.hue, 90, 72);

      // Markdown 正文（marked 渲染；若无 marked 则降级为 desc）
      let mdHtml = '';
      if (window.marked && window.marked.parse) {
        mdHtml = marked.parse(n.md || ('## ' + n.name + '\n\n' + (n.desc || '')));
      } else {
        mdHtml = '<h2>' + n.name + '</h2><p>' + (n.desc || '') + '</p>';
      }

      // 相关节点（父 + 子）
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

      // 相关节点点击跳转
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

    // modal 事件：关闭按钮 / 背景点击 / ESC
    if (modal) {
      const closeBtn = modal.querySelector('[data-tree-modal-close]');
      const backdrop = modal.querySelector('[data-tree-modal-backdrop]');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (backdrop) backdrop.addEventListener('click', closeModal);
    }

    /*------------------------------------*\
      #3.7 搜索过滤（高亮匹配节点，其余变暗）
    \*------------------------------------*/
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
        const keep = (s && s.name.toLowerCase().indexOf(q) !== -1) ||
          (t && t.name.toLowerCase().indexOf(q) !== -1);
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

    /*------------------------------------*\
      #3.8 图例（分支颜色 + 节点数）
    \*------------------------------------*/
    const legend = document.getElementById('tree-legend');
    if (legend) {
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
          '<span class="tree-legend-dot" style="color:' + hexFromHsl(b.hue, 95, 68) + ';"></span>' +
          '<span class="tree-legend-name">' + (b.icon ? b.icon + ' ' : '') + b.name + '</span>' +
          '<span class="tree-legend-count">' + b.count + '</span>' +
          '</div>';
      }).join('');
    }

    resize();
    return {
      resize: resize,
      resetView: resetView,
      svg: svg,
      openModal: openModal,
      closeModal: closeModal
    };
  }

  /*------------------------------------*\
    #4. 实例化：背景星云层常驻
  \*------------------------------------*/
  const tree = initTree({
    wrap: document.querySelector('.tree-canvas-wrap--fullscreen'),
    canvasId: 'tree-canvas-fullscreen',
    tooltipId: 'tree-tooltip-fullscreen'
  });

  const fullscreen = document.getElementById('tree-fullscreen');

  function openTree() {
    if (!fullscreen) return;
    fullscreen.classList.add('show');
    fullscreen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tree-mode');      // 淡出上层卡片
    document.body.style.overflow = 'hidden';       // 锁定页面滚动
    setTimeout(function () { if (tree) tree.resize(); }, 80);
  }

  function closeTree() {
    if (!fullscreen) return;
    fullscreen.classList.remove('show');
    fullscreen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tree-mode');   // 浮现上层卡片
    document.body.style.overflow = '';
    // 同时关闭详情卡片
    if (tree && tree.closeModal) tree.closeModal();
  }

  window.TreeFullscreen = { open: openTree, close: closeTree };

  const exitBtn = document.querySelector('[data-tree-exit]');
  if (exitBtn) exitBtn.addEventListener('click', closeTree);

  // ESC：优先关详情卡片，其次退出科技树
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('tree-modal');
    if (modal && modal.classList.contains('show')) {
      if (tree && tree.closeModal) tree.closeModal();
      return;
    }
    if (fullscreen && fullscreen.classList.contains('show')) closeTree();
  });

  // 窗口 resize 时同步画布
  window.addEventListener('resize', function () {
    if (tree) tree.resize();
  });

  // 首次渲染浮现动画
  requestAnimationFrame(function () {
    if (window.gsap && tree) {
      window.gsap.fromTo(tree.svg, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    }
  });

})();
