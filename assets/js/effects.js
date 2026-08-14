/*==============================================*\
  #effects.js
  炫酷特效集合：粒子连线背景 + 打字机标语 + 滚动进场动画
  纯原生 JS，零依赖，适配 vCard 暗色主题（金色系）
\*==============================================*/
'use strict';

/*------------------------------------*\
  #1. 粒子连线背景 (Canvas)
\*------------------------------------*/
(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let w = 0, h = 0;
  const mouse = { x: null, y: null, radius: 120 };

  // 金色主题配色
  const colors = [
    '45, 100%, 72%',   // orange-yellow-crayola
    '45, 54%, 58%',    // vegas-gold
    '45, 100%, 65%'    // 更亮的金色
  ];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    const count = Math.min(90, Math.floor(w * h / 16000));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // 画点
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // 移动
      p.x += p.vx;
      p.y += p.vy;

      // 边界回弹
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // 鼠标交互：靠近鼠标的粒子被轻微推开
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          p.x += dx / dist * 1.2;
          p.y += dy / dist * 1.2;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.color}, 0.7)`;
      ctx.fill();
    }

    // 画连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        const maxDist = 130 * 130;

        if (dist < maxDist) {
          const opacity = 1 - Math.sqrt(dist) / 130;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(45, 100%, 72%, ${opacity * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  // 鼠标追踪（监听 window，canvas 设置 pointer-events:none 不遮挡卡片）
  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', resize);
  resize();
  draw();
})();


/*------------------------------------*\
  #2. 打字机标语效果
\*------------------------------------*/
(function () {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = JSON.parse(el.getAttribute('data-phrases') || '[]');
  if (!phrases.length) return;

  const cursor = '<span class="type-cursor"></span>';
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const current = phrases[phraseIndex];
    const base = current.substring(0, charIndex);

    if (!deleting) {
      // 打字阶段
      charIndex++;
      el.innerHTML = base + cursor;
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(type, 1800); // 打完停顿
        return;
      }
      setTimeout(type, 90);
    } else {
      // 删除阶段
      charIndex--;
      el.innerHTML = base + cursor;
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(type, 400);
        return;
      }
      setTimeout(type, 45);
    }
  }

  type();
})();


/*------------------------------------*\
  #3. 滚动进场动画 (适配 vCard 页面切换)
\*------------------------------------*/
(function () {
  // 只对文章内部子元素做进场动画，避免与 article 的 display 切换冲突
  const selector = [
    '.service-list li', '.timeline', '.skill', '.clients',
    '.project-item', '.blog-post-item', '.contact-form', '.mapbox',
    '.about-text', '.article-title'
  ].join(',');

  const revealSel = function (root) {
    const targets = root.querySelectorAll(selector);
    // 清空旧状态，重新标记
    targets.forEach(function (t) {
      t.classList.remove('reveal', 'reveal-visible');
    });
    return targets;
  };

  const observeItems = function (items, observer) {
    items.forEach(function (t) {
      t.classList.add('reveal');
      observer.observe(t);
    });
  };

  const initForPage = function (article, observer) {
    const items = revealSel(article);
    observeItems(items, observer);
  };

  // 当前激活的 page
  const getActivePage = function () {
    const page = document.querySelector('article.active');
    return page || document.querySelector('article[data-page="about"]') || document.body;
  };

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('article').forEach(function (a) {
      a.querySelectorAll(selector).forEach(function (t) { t.classList.add('reveal-visible'); });
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  // 初始化当前可见页面
  initForPage(getActivePage(), observer);

  // 监听 vCard 导航切换，重新触发对应页面的进场动画
  const navLinks = document.querySelectorAll('[data-nav-link]');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const targetPage = link.dataset.navPage;
      const page = document.querySelector('article[data-page="' + targetPage + '"]');
      if (page) {
        // 延迟到 article 变为 active(display:block) 后再初始化动画
        setTimeout(function () { initForPage(page, observer); }, 60);
      }
    });
  });
})();
