#!/usr/bin/env node
/**
 * publish-server.mjs — 本地发布工作台（GUI 编辑 + 图片上传 + 公式预览 + 一键发布）
 *
 * 用法：
 *   双击根目录 start-publish.bat
 *   或手动：node scripts/publish-server.mjs [端口，默认 3456]
 *
 * 功能：
 *   - 静态文件服务（与 serve-local 相同，带 SSE 热重载，支持 reader.html 公式预览）
 *   - GET  /api/posts            文章列表（含 front-matter 与正文）
 *   - POST /api/save             保存文章：写 content/posts/<slug>.md
 *                                并自动重建 content/posts/index.json + feed.xml
 *   - POST /api/upload           上传图片到 assets/images/posts/，返回可插入的相对路径
 *   - POST /api/delete           删除文章（.md 文件）并重建索引 + RSS
 *
 * 安全：
 *   - slug 仅允许 [a-z0-9-]，杜绝路径穿越
 *   - 图片仅接受 image/* 且限 8MB，文件名用时间戳随机生成
 *   - 静态文件路径归一化后必须位于仓库根目录内
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 3456;
const POSTS_DIR = path.join(root, 'content', 'posts');
const IMG_DIR = path.join(root, 'assets', 'images', 'posts');
const MAX_UPLOAD = 8 * 1024 * 1024; // 8MB

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

const EXT_FROM_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};

// ---------------------------------------------------------------- front-matter

/** 解析 front-matter：返回 { meta, body }（与 reader.js / build-index 保持同一套规则） */
function parseFrontmatter(raw) {
  const text = String(raw || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { meta: null, body: text };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end < 0) return { meta: null, body: text };
  const meta = {};
  for (let i = 1; i < end; i++) {
    const kv = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val === 'null') val = null;
    meta[kv[1]] = val;
  }
  const body = lines.slice(end + 1).join('\n').replace(/^\s*\n/, '');
  return { meta, body };
}

/** 序列化单个 YAML 值（需要引号时加双引号） */
function yamlValue(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = String(v);
  if (
    s === '' ||
    /[:#\[\]{},&*!|>'"%@`]/.test(s) ||
    /^\s|\s$/.test(s)
  ) {
    return JSON.stringify(s);
  }
  return s;
}

/** 生成 front-matter 文本 */
function serializeFrontmatter(meta) {
  const order = ['title', 'slug', 'date', 'category', 'tags', 'summary', 'cover', 'published'];
  const lines = ['---'];
  for (const k of order) {
    const v = meta[k];
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(
        `${k}: [${v.map((x) => JSON.stringify(String(x))).join(', ')}]`
      );
      continue;
    }
    lines.push(`${k}: ${yamlValue(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------- 文章操作

function listPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(POSTS_DIR)) {
    if (!f.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = (meta && meta.slug) || f.replace(/\.md$/, '');
    out.push({
      slug,
      title: (meta && meta.title) || slug,
      date: (meta && meta.date) || '',
      category: (meta && meta.category) || '',
      tags: (meta && meta.tags) || [],
      summary: (meta && meta.summary) || '',
      cover: (meta && meta.cover) || '',
      published: meta && meta.published !== false,
      body,
    });
  }
  out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return out;
}

function rebuildIndex() {
  execFileSync(process.execPath, ['scripts/build-index.mjs', 'posts'], {
    cwd: root,
    stdio: 'pipe',
  });
  execFileSync(process.execPath, ['scripts/build-feed.mjs'], {
    cwd: root,
    stdio: 'pipe',
  });
}

function savePost(payload) {
  const meta = payload.meta || {};
  const body = String(payload.body || '');

  const title = String(meta.title || '').trim();
  let slug = String(meta.slug || '').trim().toLowerCase();
  if (!title) throw new Error('标题不能为空');
  if (!slug) throw new Error('slug 不能为空（保存前请填写英文小写 slug）');
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    throw new Error('slug 只能包含小写字母、数字和连字符（如 my-first-post）');
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(meta.date || ''))
    ? String(meta.date)
    : new Date().toISOString().slice(0, 10);

  const clean = {
    title,
    slug,
    date,
    category: String(meta.category || '').trim() || '技术',
    tags: Array.isArray(meta.tags) ? meta.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    summary: String(meta.summary || '').trim(),
    cover: String(meta.cover || '').trim(),
    published: meta.published !== false,
  };

  const front = serializeFrontmatter(clean);
  const file = path.join(POSTS_DIR, `${slug}.md`);
  fs.writeFileSync(file, `${front}\n\n${body.trim()}\n`, 'utf8');

  rebuildIndex();
  return { file: `content/posts/${slug}.md`, slug };
}

function deletePost(slug) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) throw new Error('非法 slug');
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) throw new Error(`文章不存在：${slug}`);
  fs.unlinkSync(file);
  rebuildIndex();
  return { file: `content/posts/${slug}.md` };
}

function saveImage(payload) {
  const data = String(payload.data || '');
  const m = data.match(/^data:([\w/.-]+);base64,(.+)$/);
  if (!m) throw new Error('图片数据格式错误（应为 base64 data URL）');
  const mime = m[1].toLowerCase();
  if (!mime.startsWith('image/')) throw new Error('只允许上传图片文件');
  const ext = EXT_FROM_MIME[mime] || 'png';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_UPLOAD) throw new Error('图片超过 8MB 上限');
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, name), buf);
  return {
    path: `./assets/images/posts/${name}`,
    url: `/assets/images/posts/${name}`,
    name,
  };
}

// ---------------------------------------------------------------- HTTP

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 16 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (e) {
        reject(new Error('JSON 解析失败'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = u.pathname;

  try {
    // SSE 热重载（供 reader.html 等页面自动刷新）
    if (p === '/__live') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write('retry: 1000\n\n');
      watcher.on('notify', (name) => {
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify({ file: name })}\n\n`);
      });
      req.on('close', () => res.end());
      return;
    }

    // API
    if (p === '/api/posts' && req.method === 'GET') {
      return sendJson(res, 200, listPosts());
    }
    if (p === '/api/save' && req.method === 'POST') {
      const payload = await readJson(req);
      const r = savePost(payload);
      return sendJson(res, 200, { ok: true, ...r });
    }
    if (p === '/api/upload' && req.method === 'POST') {
      const payload = await readJson(req);
      const r = saveImage(payload);
      return sendJson(res, 200, { ok: true, ...r });
    }
    if (p === '/api/delete' && req.method === 'POST') {
      const payload = await readJson(req);
      const r = deletePost(String(payload.slug || ''));
      return sendJson(res, 200, { ok: true, ...r });
    }

    // 静态文件
    let filePath = p === '/' ? '/publish.html' : decodeURIComponent(p);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '') filePath = path.join(filePath, 'index.html');
    const abs = path.normalize(path.join(root, filePath));
    if (!abs.startsWith(root + path.sep) && abs !== root) {
      return sendJson(res, 403, { ok: false, error: 'Forbidden' });
    }

    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    let content = fs.readFileSync(abs);
    let type = MIME[ext] || 'application/octet-stream';

    // 给普通 HTML 注入热重载脚本（发布工作台自身除外）
    if (ext === '.html' && p !== '/publish.html') {
      content = Buffer.concat([
        content,
        Buffer.from(
          '<script>(function(){if(!window.EventSource)return;var es=new EventSource("/__live");' +
            'es.onmessage=function(e){try{var d=JSON.parse(e.data);if(d&&d.file)location.reload();}catch(_){}};' +
            'es.onerror=function(){};})();</script>'
        ),
      ]);
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String((err && err.message) || err) });
  }
});

// 文件监听：文章/图片变化广播给 SSE 客户端（实时刷新预览页）。
// 旧版 Node 在 Windows 不支持 recursive 监听，降级为哑监听（不影响功能）。
import { EventEmitter } from 'node:events';
let watcher;
try {
  watcher = fs.watch(root, { recursive: true });
  watcher.on('change', (_e, name) => {
    if (!name) return;
    const n = String(name).replace(/\\/g, '/');
    if (n.startsWith('content/posts/') || n.startsWith('assets/images/posts/')) {
      watcher.emit('notify', n);
    }
  });
} catch (err) {
  watcher = new EventEmitter();
}

server.listen(port, () => {
  console.log('==============================================');
  console.log('  qiyuxi24.github.io 发布工作台');
  console.log(`  已启动：http://localhost:${port}/`);
  console.log('  停止：在窗口内按 Ctrl+C');
  console.log('==============================================');
});
