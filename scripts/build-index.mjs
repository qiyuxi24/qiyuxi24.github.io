#!/usr/bin/env node
/**
 * build-index.mjs — 重建文章/项目清单 index.json
 *
 * 当你手动新增/修改了 content/posts/*.md 或 content/projects/*.md，
 * 运行本脚本即可让前端博客列表/项目页读到最新内容：
 *
 *   node scripts/build-index.mjs            # 重建两者
 *   node scripts/build-index.mjs posts      # 只重建文章
 *   node scripts/build-index.mjs projects   # 只重建项目
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'content');

const targets = process.argv.slice(2).filter((a) => a === 'posts' || a === 'projects');
const doPosts = targets.length === 0 || targets.includes('posts');
const doProjects = targets.length === 0 || targets.includes('projects');

if (doPosts) build('posts');
if (doProjects) build('projects');

function build(kind) {
  const dir = join(ROOT, kind);
  const indexFile = join(dir, 'index.json');
  if (!existsSync(dir)) {
    console.error(`❌ 目录不存在：${dir}`);
    return;
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const items = [];

  for (const f of files) {
    const raw = readFileSync(join(dir, f), 'utf8');
    const fm = parseFrontmatter(raw);
    if (!fm) {
      console.warn(`⚠️  跳过 ${f}：缺少 front-matter`);
      continue;
    }
    if (fm.published === false) {
      console.warn(`⏭  跳过 ${f}：published=false`);
      continue;
    }
    items.push({ ...fm, file: f });
  }

  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  writeFileSync(indexFile, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`✅ ${kind}/index.json 已重建（${items.length} 条）`);
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    if (val === 'null') val = null;
    out[key] = val;
  }
  return out;
}
