<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom" exclude-result-prefixes="atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RSS 订阅 - <xsl:value-of select="rss/channel/title" /></title>
        <link rel="icon" href="./assets/images/logo.ico" type="image/x-icon" />
        <link rel="alternate" type="application/rss+xml" title="RSS" href="./feed.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&amp;display=swap" rel="stylesheet" />
        <style>
          :root {
            --bg: hsl(222, 18%, 11%);
            --card: hsl(222, 15%, 15%);
            --panel: hsl(222, 16%, 13%);
            --border: hsl(222, 12%, 26%);
            --text: hsl(220, 14%, 95%);
            --text-2: hsl(220, 8%, 70%);
            --accent: hsl(35, 92%, 56%);
            --accent-2: hsl(199, 95%, 62%);
            --shadow: 0 16px 40px hsla(0, 0%, 0%, 0.25);
          }
          @media (prefers-color-scheme: light) {
            :root {
              --bg: hsl(220, 16%, 96%);
              --card: hsl(0, 0%, 100%);
              --panel: hsl(220, 14%, 94%);
              --border: hsl(220, 12%, 86%);
              --text: hsl(222, 18%, 18%);
              --text-2: hsl(220, 8%, 40%);
              --accent: hsl(35, 92%, 50%);
              --accent-2: hsl(199, 89%, 42%);
              --shadow: 0 16px 40px hsla(222, 20%, 40%, 0.12);
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }
          a { color: var(--accent); text-decoration: none; }
          a:hover { text-decoration: underline; }
          .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 28px;
            box-shadow: var(--shadow);
            margin-bottom: 24px;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            background: linear-gradient(135deg, hsla(35, 92%, 56%, 0.15), hsla(35, 92%, 56%, 0));
            color: var(--accent);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
          }
          .badge svg { width: 14px; height: 14px; fill: currentColor; }
          h1 {
            margin: 0 0 8px;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.3px;
          }
          .desc {
            margin: 0 0 20px;
            color: var(--text-2);
            font-size: 15px;
            font-weight: 300;
          }
          .feed-url {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 10px;
            background: var(--panel);
            border: 1px solid var(--border);
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 13px;
            word-break: break-all;
          }
          .feed-url code { flex: 1; color: var(--text); }
          .btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border: none;
            border-radius: 8px;
            background: var(--accent);
            color: hsl(222, 22%, 10%);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: filter 0.2s ease, transform 0.2s ease;
          }
          .btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
          .btn svg { width: 14px; height: 14px; }
          .hint {
            margin-top: 12px;
            font-size: 13px;
            color: var(--text-2);
            font-weight: 300;
          }
          .count {
            font-size: 13px;
            color: var(--text-2);
            margin-bottom: 14px;
            font-weight: 400;
          }
          .count strong { color: var(--accent); }
          .post-list { display: grid; gap: 16px; }
          .post {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 22px;
            box-shadow: var(--shadow);
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .post:hover { transform: translateY(-2px); border-color: var(--accent); }
          .post-title {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 600;
            line-height: 1.35;
          }
          .post-title a { color: var(--text); }
          .post-title a:hover { color: var(--accent); text-decoration: none; }
          .post-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: var(--text-2);
            margin-bottom: 10px;
            font-weight: 300;
          }
          .post-meta .dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--text-2);
            opacity: 0.6;
          }
          .category {
            padding: 2px 8px;
            border-radius: 6px;
            background: var(--panel);
            color: var(--accent-2);
            font-size: 12px;
            font-weight: 500;
          }
          .post-desc {
            margin: 0;
            color: var(--text-2);
            font-size: 14px;
            font-weight: 300;
            line-height: 1.6;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 13px;
            color: var(--text-2);
            font-weight: 300;
          }
          @media (max-width: 480px) {
            .container { padding: 24px 16px; }
            .header { padding: 20px; }
            h1 { font-size: 22px; }
            .feed-url { flex-direction: column; align-items: flex-start; }
            .btn { width: 100%; justify-content: center; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <span class="badge">
              <svg viewBox="0 0 24 24"><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v2.505c5.456 0 9.891 4.436 9.891 9.892h2.505c0-6.839-5.557-12.397-12.396-12.397zm0-7.18v2.505c9.498 0 17.215 7.726 17.215 17.216h2.505c0-10.867-8.855-19.721-19.72-19.721z"/></svg>
              RSS Feed
            </span>
            <h1><xsl:value-of select="rss/channel/title" /></h1>
            <p class="desc"><xsl:value-of select="rss/channel/description" /></p>
            <div class="feed-url">
              <code id="feed-url"><xsl:value-of select="rss/channel/atom:link/@href" /></code>
              <button class="btn" onclick="copyFeedUrl()">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                复制链接
              </button>
            </div>
            <p class="hint">把上方地址粘贴到 RSS 阅读器（如 Feedly、Inoreader、Reeder）即可订阅。这个页面本身仍是标准 RSS，不会影响阅读器解析。</p>
          </header>

          <p class="count">共 <strong><xsl:value-of select="count(rss/channel/item)" /></strong> 篇文章</p>

          <div class="post-list">
            <xsl:for-each select="rss/channel/item">
              <article class="post">
                <h2 class="post-title">
                  <a><xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute><xsl:value-of select="title" /></a>
                </h2>
                <div class="post-meta">
                  <time><xsl:value-of select="pubDate" /></time>
                  <xsl:if test="category">
                    <span class="dot"></span>
                    <span class="category"><xsl:value-of select="category" /></span>
                  </xsl:if>
                </div>
                <p class="post-desc"><xsl:value-of select="description" /></p>
              </article>
            </xsl:for-each>
          </div>

          <footer class="footer">
            <p>
              <a href="./">← 返回主页</a>
              <span style="margin: 0 8px;">·</span>
              由 <xsl:value-of select="rss/channel/generator" /> 生成
            </p>
          </footer>
        </div>

        <script>
          function copyFeedUrl() {
            const url = document.getElementById('feed-url').textContent;
            if (navigator.clipboard &amp;&amp; navigator.clipboard.writeText) {
              navigator.clipboard.writeText(url).then(showCopied).catch(fallbackCopy);
            } else {
              fallbackCopy();
            }
            function fallbackCopy() {
              const ta = document.createElement('textarea');
              ta.value = url;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              try { document.execCommand('copy'); showCopied(); } catch (e) {}
              document.body.removeChild(ta);
            }
            function showCopied() {
              const btn = document.querySelector('.btn');
              const old = btn.innerHTML;
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>已复制';
              setTimeout(() => btn.innerHTML = old, 1600);
            }
          }
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
