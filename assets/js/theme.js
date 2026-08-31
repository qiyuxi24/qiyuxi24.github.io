/*==============================================*\
  #theme.js
  主题切换（深色 / 浅色）

  逻辑：
  - 页面加载前由 <head> 内联脚本读取 localStorage 'site-theme'，
    设置 <html data-theme>（默认 dark），避免闪烁（FOUC）。
  - 本文件绑定 #theme-toggle 按钮：点击切换 dark / light，
    写回 localStorage + 更新 meta theme-color。
  - 图标联动：#theme-toggle.dark 时高亮月亮，.light 时高亮太阳。
\*==============================================*/
'use strict';

(function () {
  const KEY = 'site-theme';
  const META_COLORS = { dark: '#1a1d23', light: '#f8f9fb' };

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && META_COLORS[theme]) meta.setAttribute('content', META_COLORS[theme]);
    // 按钮状态
    document.querySelectorAll('.site-theme-toggle').forEach(function (btn) {
      btn.classList.toggle('is-dark', theme === 'dark');
      btn.classList.toggle('is-light', theme === 'light');
    });
  }

  function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'light' ? 'light' : 'dark';
  }

  function init() {
    applyTheme(currentTheme(), false);

    document.querySelectorAll('.site-theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
