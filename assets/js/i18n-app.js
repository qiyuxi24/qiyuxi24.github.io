/*==============================================*\
  #i18n-app.js — 全站中英切换逻辑
  通过侧边栏滑块切换语言，查 I18N_DICT 字典替换全站文本。
  - [data-i18n]             → textContent 替换
  - [data-i18n-placeholder] → placeholder 替换
  - 语言持久化到 localStorage
\*==============================================*/
'use strict';

(function () {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  const dict = window.I18N_DICT || {};

  // 读取上次语言（默认中文）
  let lang = 'zh';
  try { lang = localStorage.getItem('site-lang') === 'en' ? 'en' : 'zh'; } catch (e) { /* ignore */ }

  // 应用语言：遍历所有 [data-i18n] 与 [data-i18n-placeholder]
  function applyLang(l) {
    document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const entry = dict[key];
      if (entry && entry[l] !== undefined) el.textContent = entry[l];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const entry = dict[key];
      if (entry && entry[l] !== undefined) el.placeholder = entry[l];
    });

    // 同步滑块视觉：金色滑块滑到对应侧 + 文字高亮
    toggle.dataset.lang = l;
    toggle.setAttribute('aria-checked', l === 'en' ? 'true' : 'false');
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
