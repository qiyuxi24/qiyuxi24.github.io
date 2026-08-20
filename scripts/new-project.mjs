#!/usr/bin/env node
/**
 * new-project.mjs — 生成一个新项目的 Markdown 模板
 *
 * 用法：
 *   node scripts/new-project.mjs "项目名称"
 *
 * 可选参数：
 *   --category 桌面应用   分类（默认"AI 应用"）
 *   --repo https://...    GitHub 仓库地址（用于拉取 star）
 *   --demo https://...    线上 Demo 地址（可省略）
 *   --slug xxx           自定义 slug
 *
 * 效果：
 *   1. 在 content/projects/ 下生成带 front-matter 的 .md 模板
 *   2. 更新 content/projects/index.json（项目清单）
 */

import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJ_DIR = join(__dirname, '..', 'content', 'projects');
const INDEX_FILE = join(PROJ_DIR, 'index.json');
const TEMPLATE_FILE = join(PROJ_DIR, '_template.md');

const args = process.argv.slice(2);
const titleIdx = args.findIndex((a) => !a.startsWith('--'));
const title = titleIdx >= 0 ? args[titleIdx] : null;

if (!title) {
  console.error('❌ 请提供项目名称，例如：\n  node scripts/new-project.mjs "我的项目"\n');
  process.exit(1);
}

const flag = (name, def) => {
  const i = args.findIndex((a) => a === `--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const category = flag('category', 'AI 应用');
const repo = flag('repo', 'null');
const demo = flag('demo', 'null');
const customSlug = flag('slug', null);

const slugOf = (t) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
const slug = customSlug || slugOf(title);
if (!slug) {
  console.error('❌ 标题全是中文，无法自动生成 slug。请用 --slug 指定。\n');
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const targetFile = join(PROJ_DIR, `${slug}.md`);
if (existsSync(targetFile)) {
  console.error(`❌ 已存在：${slug}.md，请换个名称或 --slug。\n`);
  process.exit(1);
}

const template = readFileSync(TEMPLATE_FILE, 'utf8');
const frontmatter = [
  '---',
  `title: ${title}`,
  `slug: ${slug}`,
  `date: ${today}`,
  `category: ${category}`,
  'tags: [技术栈一, 技术栈二]',
  'summary: 一句话介绍这个项目',
  `repo: ${repo}`,
  `demo: ${demo}`,
  'cover: ./assets/images/project-5.png',
  'published: true',
  '---',
].join('\n');

const bodyStart = template.indexOf('---', template.indexOf('---') + 1);
const body = template.slice(bodyStart + 3).replace(/^[\r\n]+/, '');
const content = `${frontmatter}\n\n${body}\n`;

writeFileSync(targetFile, content, 'utf8');
console.log(`✅ 已创建项目：${targetFile}`);

updateIndex(targetFile, { title, slug, date: today, category, repo, demo });

// ----------------------------------------------------------------
function updateIndex(newFile, meta) {
  let items = [];
  if (existsSync(INDEX_FILE)) {
    try { items = JSON.parse(readFileSync(INDEX_FILE, 'utf8')); } catch { items = []; }
  }

  const files = readdirSync(PROJ_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const found = new Map();
  for (const f of files) {
    const raw = readFileSync(join(PROJ_DIR, f), 'utf8');
    const fm = parseFrontmatter(raw);
    if (fm) found.set(fm.slug || f.replace(/\.md$/, ''), { ...fm, file: f });
  }

  items = items.filter((p) => found.has(p.slug));
  for (const [slugKey, fm] of found) {
    const existing = items.find((p) => p.slug === slugKey);
    if (existing) Object.assign(existing, fm);
    else items.push(fm);
  }

  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  writeFileSync(INDEX_FILE, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`✅ 已更新清单：${INDEX_FILE}（共 ${items.length} 个项目）`);
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
