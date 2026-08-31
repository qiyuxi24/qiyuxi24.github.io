/**
 * katex-loader.js — KaTeX 多源加载器（本地优先，CDN 依次兜底）
 *
 * 加载成功后：window.__katexReady = true，并派发 'katex-ready' 事件，
 * 供 reader.js / 发布工作台在公式从源码变为渲染结果后重新渲染。
 * 所有源都失败时派发 'katex-fail'（公式会以 $...$ 明文显示，不影响阅读）。
 */
(function () {
  'use strict';

  var VERSION = '0.16.11';

  var SOURCES = {
    css: [
      './assets/vendor/katex/katex.min.css', // 本地（可选，缺则自动换源）
      'https://cdn.jsdelivr.net/npm/katex@' + VERSION + '/dist/katex.min.css',
      'https://unpkg.com/katex@' + VERSION + '/dist/katex.min.css',
      'https://cdn.bootcdn.net/ajax/libs/KaTeX/' + VERSION + '/katex.min.css',
      'https://cdn.staticfile.net/KaTeX/' + VERSION + '/katex.min.css',
    ],
    js: [
      './assets/vendor/katex/katex.min.js',
      'https://cdn.jsdelivr.net/npm/katex@' + VERSION + '/dist/katex.min.js',
      'https://unpkg.com/katex@' + VERSION + '/dist/katex.min.js',
      'https://cdn.bootcdn.net/ajax/libs/KaTeX/' + VERSION + '/katex.min.js',
      'https://cdn.staticfile.net/KaTeX/' + VERSION + '/katex.min.js',
    ],
  };

  function tryCss(i) {
    if (i >= SOURCES.css.length) return tryJs(0); // css 全失败也继续加载 js
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SOURCES.css[i];
    link.onload = function () { tryJs(0); };
    link.onerror = function () { tryCss(i + 1); };
    document.head.appendChild(link);
  }

  function tryJs(i) {
    if (i >= SOURCES.js.length) return finish(false);
    var s = document.createElement('script');
    s.src = SOURCES.js[i];
    s.onload = function () {
      if (window.katex && typeof window.katex.renderToString === 'function') finish(true);
      else tryJs(i + 1); // 加载了但版本不符，换下一个源
    };
    s.onerror = function () { tryJs(i + 1); };
    document.head.appendChild(s);
  }

  function finish(ok) {
    if (ok) {
      window.__katexReady = true;
      window.dispatchEvent(new Event('katex-ready'));
    } else {
      window.dispatchEvent(new Event('katex-fail'));
    }
  }

  if (window.katex && typeof window.katex.renderToString === 'function') {
    finish(true);
  } else {
    tryCss(0);
  }
})();
