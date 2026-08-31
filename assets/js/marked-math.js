/**
 * marked-math.js — 为 marked 提供 KaTeX 公式渲染（行内 $...$ 与块级 $$...$$）
 *
 * 用法：在把 Markdown 交给 marked 之前调用 window.markedMath.render(text)：
 *   - 围栏代码块（``` / ~~~）整体跳过，代码里的 $ 不会被误伤
 *   - $$...$$（可跨多行）→ 块级公式（displayMode）
 *   - $...$ → 行内公式
 *   - 若 KaTeX 尚未加载完成，原样返回文本（公式以 $...$ 明文显示，不报错）
 *
 * 依赖：KaTeX（katex-loader.js 负责多源加载；只要有 window.katex.renderToString 即可）。
 * 与 reader.js / publish.html 共用，保证"编辑预览 = 线上渲染"。
 */
(function () {
  'use strict';

  var hasKatex = function () {
    return typeof window.katex !== 'undefined' && typeof window.katex.renderToString === 'function';
  };

  function katexHtml(code, display) {
    if (!hasKatex()) return display ? '$$\n' + code + '\n$$' : '$' + code + '$';
    try {
      var html = window.katex.renderToString(code, {
        displayMode: !!display,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
      });
      // 压成单行，避免 marked 把多行 raw HTML 拆成多个段落
      return html.replace(/\s+/g, ' ');
    } catch (e) {
      return display ? '$$\n' + code + '\n$$' : '$' + code + '$';
    }
  }

  /**
   * 行内公式正则。刻意加了边界约束，避免把"价格 $5 和 $6"误判成公式：
   *   - 起始 $ 前须是行首 / 空白 / 括号 / 中文（允许"设 $x$ 为…"这种紧贴写法）
   *   - 内容必须含至少一个 ASCII 字母或反斜杠（排除纯数字金额）
   *   - 结束 $ 后须是行尾 / 空白 / 标点 / 中文
   */
  var INLINE_RE = /(^|[\s(（[【>\u4e00-\u9fff])\$((?=[\s\S]*[A-Za-z\\])[^$\n]+?)\$(?=$|[\s，。、；：）)】,.;:!?<…\u4e00-\u9fff])/g;

  /** 同行处理：先 $$...$$（块级），再 $...$（行内） */
  function renderLine(line) {
    if (line.indexOf('$') === -1) return line;
    line = line.replace(/\$\$([^$\n]+?)\$\$/g, function (_, code) {
      return katexHtml(code.trim(), true);
    });
    line = line.replace(INLINE_RE, function (m, pre, code) {
      return pre + katexHtml(code.trim(), false);
    });
    return line;
  }

  /**
   * 渲染正文中的公式：
   *   1. 围栏代码块整体跳过
   *   2. 以 $$ 开头的行进入块级公式收集，直到遇到含 $$ 的行闭合（支持跨多行）
   *   3. 其余普通行交给 renderLine
   */
  function render(text) {
    if (text == null) return text;
    if (!hasKatex()) return text;
    var src = String(text).replace(/\r\n?/g, '\n');
    var lines = src.split('\n');
    var out = [];
    var inFence = false;
    var inMath = false;
    var mathBuf = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var t = line.trim();

      // 围栏代码块：整体原样保留
      if (/^(`{3,}|~{3,})/.test(t)) {
        inFence = !inFence;
        out.push(line);
        continue;
      }
      if (inFence) {
        out.push(line);
        continue;
      }

      // 块级公式收集阶段
      if (inMath) {
        mathBuf.push(line);
        if (/\$\$/.test(t)) {
          var code = mathBuf.join('\n').replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
          out.push(katexHtml(code, true));
          inMath = false;
          mathBuf = [];
        }
        continue;
      }

      // 行首 $$ 开始块级公式
      if (/^\$\$/.test(t)) {
        if (/^\$\$.+\$\$$/.test(t)) {
          // 单行闭合 $$...$$
          out.push(katexHtml(t.replace(/^\$\$/, '').replace(/\$\$$/, '').trim(), true));
        } else {
          inMath = true;
          mathBuf = [line];
        }
        continue;
      }

      out.push(renderLine(line));
    }

    // 未闭合的块级公式原样保留（不丢内容）
    if (inMath) out.push(mathBuf.join('\n'));

    return out.join('\n');
  }

  window.markedMath = {
    render: render,
    hasKatex: hasKatex,
  };
})();
