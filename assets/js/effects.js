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
  #2. 打字机标语效果（已禁用，保留死代码）
  恢复方法：取消本段注释，并在 index.html 里取消 #typewriter 元素注释。
\*------------------------------------*/
/*
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
*/


/*------------------------------------*\
  #3. 平滑滚动 + GSAP 滚动动效 (适配 vCard 页面切换)
  - Lenis: 全局惯性平滑滚动
  - ScrollTrigger: 元素随滚动淡入上浮、技能条滚动填充、标题渐显
\*------------------------------------*/
(function () {
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 若用户偏好减少动态，直接跳过所有动效
  if (prefersReducedMotion || !window.gsap) return;

  const gsap = window.gsap;
  gsap.registerPlugin(ScrollTrigger);

  /*------------------------------------*\
    A. Lenis 平滑滚动
  \*------------------------------------*/
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    // 让 ScrollTrigger 跟随 Lenis 的滚动
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    // 暴露实例，供返回位置恢复等逻辑做精确滚动（见 script.js tryRestore）
    window.__lenis = lenis;
  }

  /*------------------------------------*\
    B. 元素进场动效（淡入上浮）
  \*------------------------------------*/
  const revealSelector = [
    '.service-list li', '.timeline', '.skill', '.clients',
    '.project-item', '.blog-post-item', '.contact-form', '.mapbox',
    '.about-text'
  ].join(',');

  // 给指定容器内的元素创建进场动效
  function createRevealAnim(root) {
    const targets = root.querySelectorAll(revealSelector);
    targets.forEach(function (t) {
      gsap.fromTo(t, {
        opacity: 0,
        y: 28
      }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: t,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  /*------------------------------------*\
    C. 标题逐字/渐显
  \*------------------------------------*/
  function createTitleAnim(root) {
    root.querySelectorAll('.article-title').forEach(function (title) {
      const text = title.textContent.trim();
      // 已拆过分词则跳过（避免重复包裹）
      if (title.querySelector('.title-word')) return;

      title.setAttribute('aria-label', text);
      title.innerHTML = text.split('').map(function (ch) {
        // 空格保留为空格，不参与动画位移
        return '<span class="title-word" aria-hidden="true">' +
          (ch === ' ' ? '&nbsp;' : ch) + '</span>';
      }).join('');

      gsap.fromTo(title.querySelectorAll('.title-word'), {
        opacity: 0,
        y: 18,
        rotateX: 60
      }, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        stagger: 0.03,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  /*------------------------------------*\
    D. 技能条滚动填充
  \*------------------------------------*/
  function createSkillAnim(root) {
    root.querySelectorAll('.skill-progress-fill').forEach(function (fill) {
      const targetWidth = fill.getAttribute('style')
        ? parseFloat(fill.style.width || '0')
        : 0;
      if (targetWidth <= 0) return;

      // 先把宽度置 0，由 GSAP 动画到目标宽度
      gsap.set(fill, { width: '0%' });
      gsap.to(fill, {
        width: targetWidth + '%',
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: fill,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  /*------------------------------------*\
    E. 页面激活时的动效初始化
  \*------------------------------------*/
  const getActivePage = function () {
    return document.querySelector('article.active') ||
      document.querySelector('article[data-page="about"]') ||
      document.body;
  };

  function initPage(page) {
    createRevealAnim(page);
    createTitleAnim(page);
    createSkillAnim(page);
    // 刷新 ScrollTrigger 以重新计算位置
    requestAnimationFrame(function () { ScrollTrigger.refresh(); });
  }

  // 初始化当前可见页面
  initPage(getActivePage());

  // 监听 vCard 导航切换，为切入的页面重新初始化动效
  document.querySelectorAll('[data-nav-link]').forEach(function (link) {
    link.addEventListener('click', function () {
      const page = document.querySelector('article[data-page="' + link.dataset.navPage + '"]');
      if (page) {
        // 延迟到 article 变为 active(display:block) 后再初始化
        setTimeout(function () { initPage(page); }, 80);
        if (lenis) lenis.scrollTo(0, { immediate: true });
      }
    });
  });

  // 页面销毁时清理（保留 Lenis 实例复用）
  window.addEventListener('beforeunload', function () {
    if (lenis) lenis.destroy();
  });
})();
