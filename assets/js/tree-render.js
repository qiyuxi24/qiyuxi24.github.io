(function () {
  'use strict';

  const treeApi = window.TreeAPI || {};
  const treeData = window.TreeData || { branches: [] };
  const hexFromHsl = window.TreeUtils && window.TreeUtils.hexFromHsl ? window.TreeUtils.hexFromHsl : function (h, s, l) {
    s = s / 100; l = l / 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  };

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

    nodes.forEach(function (n) {
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

    let W = 0, H = 0;
    let view = { scale: 1, tx: 0, ty: 0 };

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
      circle.setAttribute('fill', n.isRoot ? 'hsl(0,0%,10%)' : 'hsl(0,0%,7%)');
      circle.setAttribute('stroke', 'hsl(0,0%,40%)');
      circle.setAttribute('stroke-width', n.isRoot ? 1.5 : 1);
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
        dot.setAttribute('r', 3);
        dot.setAttribute('fill', 'hsl(0,0%,55%)');
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

      g.addEventListener('mouseenter', function () { hoverNode(n.id); });
      g.addEventListener('mouseleave', function () { unhoverNode(); });
      g.addEventListener('mousemove', function (e) {
        if (tooltip.classList.contains('show')) moveTooltip(e);
      });
      g.addEventListener('click', function () { clickNode(n.id); });
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

    let simulation = null;
    let focusNodeId = null;
    let focusApi = { set: function () {}, get: function () { return null; } };
    if (window.d3 && d3.forceSimulation) {
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(150).strength(0.6))
        .force('charge', d3.forceManyBody().strength(-320))
        .force('collide', d3.forceCollide().radius(function (d) { return nodeRadius(d) + 8; }).iterations(2))
        .force('center', d3.forceCenter(0, 0))
        .force('focus', d3.forceX(function (d) { return (focusNodeId === d.id) ? 0 : null; }).strength(function (d) { return (focusNodeId === d.id) ? 0.16 : 0; }))
        .force('focusY', d3.forceY(function (d) { return (focusNodeId === d.id) ? 0 : null; }).strength(function (d) { return (focusNodeId === d.id) ? 0.16 : 0; }))
        .force('x', d3.forceX(0).strength(0.03))
        .force('y', d3.forceY(0).strength(0.03))
        .alphaMin(0.01)
        .alphaDecay(0.006)
        .velocityDecay(0.5)
        .alpha(1)
        .on('tick', ticked);

      const pulseTimer = setInterval(function () {
        if (document.body.classList.contains('tree-mode')) {
          simulation.alpha(Math.min(0.3, simulation.alpha() + 0.2)).restart();
        }
      }, 2500);
      window.__treePulseTimer = pulseTimer;

      // 能耗优化：进入 tree-mode 才"加热"模拟，离开时彻底停摆（alpha=0），
      // 避免 d3-force 在背景层持续 tick 浪费 CPU。鼠标 hover / 重新打开时再喂能量。
      const treeModeObserver = new MutationObserver(function () {
        if (document.body.classList.contains('tree-mode')) {
          simulation.alpha(0.3).restart();
        } else {
          simulation.alpha(0).stop();
        }
      });
      treeModeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
      // 初始状态：不在 tree-mode 时直接停摆
      if (!document.body.classList.contains('tree-mode')) {
        simulation.alpha(0).stop();
      }

      function setFocusNode(id) { focusNodeId = id; }
      function getFocusNode() { return focusNodeId; }
      focusApi = { set: setFocusNode, get: getFocusNode };
    } else {
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

    function applyView() {
      gMain.setAttribute('transform', 'translate(' + view.tx + ',' + view.ty + ') scale(' + view.scale + ')');
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
        circle.setAttribute('stroke', hexFromHsl(n.hue, 70, 65));
        circle.setAttribute('stroke-width', n.isRoot ? 2 : 1.6);
        circle.setAttribute('fill', hexFromHsl(n.hue, 35, 14));
        nodeEl.classList.add(mode === 'hover' ? 'is-hover' : 'is-active');
      } else {
        circle.setAttribute('stroke', 'hsl(0,0%,40%)');
        circle.setAttribute('stroke-width', n.isRoot ? 1.5 : 1);
        circle.setAttribute('fill', n.isRoot ? 'hsl(0,0%,10%)' : 'hsl(0,0%,7%)');
        nodeEl.classList.remove('is-hover', 'is-active');
      }
    }

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
          const stroke = s && t ? hexFromHsl((s.hue + t.hue) / 2, 55, 60) : 'hsl(0,0%,70%)';
          l.el.setAttribute('stroke', stroke);
        }
      });
      nodes.forEach(function (node) {
        if (!related.has(node.id)) nodeGroups[node.id].classList.add('dimmed');
      });
      colorNode(nodeGroups[id], n, 'hover');
      showTooltip(n);
      focusApi.set(id);
      if (simulation) simulation.alpha(Math.min(0.5, simulation.alpha() + 0.25)).restart();
    }
    function unhoverNode() {
      if (focusApi.get() !== null) {
        focusApi.set(null);
        if (simulation) simulation.alpha(Math.min(0.4, simulation.alpha() + 0.2)).restart();
      }
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

    function clickNode(id) {
      const n = nodeMap[id];
      unhoverNode();
      hoverNode(id);
      focusApi.set(id);
      if (simulation) {
        simulation.alpha(Math.min(0.7, simulation.alpha() + 0.45)).restart();
        simulation.force('x').strength(0.09);
        simulation.force('y').strength(0.09);
        setTimeout(function () {
          simulation.force('x').strength(0.03);
          simulation.force('y').strength(0.03);
        }, 500);
      }
      const targetScale = Math.max(view.scale, 1.3);
      view.tx = W / 2 - n.x * targetScale;
      view.ty = H / 2 - n.y * targetScale;
      view.scale = targetScale;
      applyView();
      setTimeout(function () { hideTooltip(); }, 600);
      openModal(n.id);
    }

    const modal = document.getElementById('tree-modal');
    function openModal(id) {
      const n = nodeMap[id];
      if (!n || !modal) return;
      const body = document.getElementById('tree-modal-body');
      const title = document.getElementById('tree-modal-title');
      const icon = document.getElementById('tree-modal-icon');
      const branch = document.getElementById('tree-modal-branch');

      icon.textContent = n.icon || (n.isBranch ? '✦' : '•');
      title.textContent = n.name;
      if (n.subtitle) title.textContent = n.name;
      branch.textContent = n.isRoot ? '星云中心' : (n.branchName || '');
      branch.style.color = hexFromHsl(n.hue, 90, 72);
      branch.style.borderColor = hexFromHsl(n.hue, 90, 72);

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
          '<span class="tree-legend-dot" style="background:' + hexFromHsl(b.hue, 50, 60) + ';"></span>' +
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

  window.TreeAPI = window.TreeAPI || {};
  window.TreeAPI.createTreeRenderer = createTreeRenderer;
})();
