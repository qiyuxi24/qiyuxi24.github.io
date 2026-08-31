/**
 * serve-local.mjs — 本地静态预览服务器（带热重载）
 *
 * 用法：node scripts/serve-local.mjs [端口，默认 8899]
 * 配合根目录 start-local.bat 双击使用。
 *
 * 为什么需要它：直接双击 index.html / reader.html（file:// 协议）时，
 * 浏览器会拦截 fetch 本地文件（CORS 安全策略），导致文章列表和文章正文
 * 无法加载。通过 http 访问即可正常渲染。
 *
 * 热重载（2026-08-31 新增）：
 *   监听整个站点目录的文件变化，修改 HTML/CSS/JS/Markdown 保存后，
 *   通过 SSE 通知浏览器自动刷新，无需手动按 F5。
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 8899;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/rss+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/* ---------- 热重载：SSE 广播 ---------- */
const clients = new Set();

function broadcast() {
  clients.forEach((res) => {
    try { res.write('data: reload\n\n'); } catch { /* 连接已断，交给 close 清理 */ }
  });
}

let reloadTimer = null;
function scheduleReload() {
  // 防抖：一次保存可能触发多次文件事件，80ms 内合并为一次刷新
  if (reloadTimer) return;
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    broadcast();
  }, 80);
}

// 忽略触发刷新的噪音路径：版本目录、临时调试文件（_ / 点开头）
const IGNORE_RE =
  /(^|[\\/])(\.git|node_modules|\.playwright-cli|\.codebuddy)([\\/]|$)|(^|[\\/])[_.][^\\/]*$/;

try {
  fs.watch(root, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (IGNORE_RE.test(String(filename))) return;
    scheduleReload();
  });
  console.log('[live] 正在监听文件变化，保存即自动刷新');
} catch (e) {
  console.warn('[live] 文件监听不可用（网络盘/受限环境？）: ' + e.message + ' — 仍可手动刷新');
}

// 注入到 HTML 的客户端脚本：连 SSE，收到 reload 就刷新页面
const LIVE_SCRIPT =
  '<script>(function(){var es=new EventSource("/__live");es.onmessage=function(){location.reload();};})();</script>';

http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');

    // SSE 端点（热重载）
    if (u.pathname === '/__live') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(':ok\n\n');
      clients.add(res);
      const ping = setInterval(() => { try { res.write(':ping\n\n'); } catch {} }, 20000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
      return;
    }

    // 静态文件
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    if (!urlPath.startsWith('/')) {
      res.writeHead(400);
      res.end('400 Bad Request');
      return;
    }

    const file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${urlPath}`);
        return;
      }
      let body = data;
      if (path.extname(file).toLowerCase() === '.html') {
        const s = body.toString('utf8');
        if (s.indexOf('/__live') === -1) body = s.replace('</body>', LIVE_SCRIPT + '</body>');
      }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    });
  })
  .listen(port, () => {
    console.log('');
    console.log(`  本地预览服务器已启动：http://localhost:${port}`);
    console.log('  热重载已开启：保存 HTML/CSS/JS/Markdown 后浏览器自动刷新');
    console.log('  按 Ctrl+C 停止。');
    console.log('');
  });
