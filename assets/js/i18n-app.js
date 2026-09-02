/*==============================================*\
  #i18n-app.js — 全站中英切换逻辑
  通过侧边栏滑块切换语言，查 I18N_DICT 字典替换全站文本。
  支持的绑定：
    [data-i18n]              → textContent 替换
    [data-i18n-html]         → innerHTML 替换（可含 <strong> 等内联标签）
    [data-i18n-placeholder]  → placeholder 替换
    [data-i18n-aria-label]   → aria-label 替换
    [data-i18n-title]        → title 替换
  语言持久化到 localStorage。
  切换时派发 window 'langchange' 事件（detail.lang），
  供动态渲染组件（书单树 / 博客列表 / GitHub 总览）同步更新。
\*==============================================*/
'use strict';

(function () {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  const dict = window.I18N_DICT || {};

  // 读取上次语言（默认中文）
  let lang = 'zh';
  try { lang = localStorage.getItem('site-lang') === 'en' ? 'en' : 'zh'; } catch (e) { /* ignore */ }

  // 供动态组件查询当前语言与取值
  window.__siteLang = lang;
  window.__I18N = function (key, l) {
    const target = l || window.__siteLang || 'zh';
    const entry = dict[key];
    return entry && entry[target] !== undefined ? entry[target] : '';
  };

  // 应用语言：遍历所有 [data-i18n] 系列绑定
  function applyLang(l) {
    window.__siteLang = l;
    document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';

    const pick = (key) => {
      const entry = dict[key];
      return entry && entry[l] !== undefined ? entry[l] : undefined;
    };

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = pick(el.dataset.i18n);
      if (v !== undefined) el.textContent = v;
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = pick(el.dataset.i18nHtml);
      if (v !== undefined) el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const v = pick(el.dataset.i18nPlaceholder);
      if (v !== undefined) el.placeholder = v;
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const v = pick(el.dataset.i18nAriaLabel);
      if (v !== undefined) el.setAttribute('aria-label', v);
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const v = pick(el.dataset.i18nTitle);
      if (v !== undefined) el.setAttribute('title', v);
    });

    // 同步滑块视觉：金色滑块滑到对应侧 + 文字高亮
    toggle.dataset.lang = l;
    toggle.setAttribute('aria-checked', l === 'en' ? 'true' : 'false');

    // 通知动态渲染组件
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
  }

  // 切换语言
  function switchLang() {
    const next = toggle.dataset.lang === 'en' ? 'zh' : 'en';
    lang = next;
    applyLang(next);
    try { localStorage.setItem('site-lang', next); } catch (e) { /* ignore */ }
  }

  // 事件：鼠标 / 键盘(Enter、空格)
  toggle.addEventListener('click', switchLang);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchLang();
    }
  });

  // 初始应用
  applyLang(lang);
})();
