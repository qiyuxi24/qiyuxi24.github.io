#!/usr/bin/env node
/**
 * new-post.mjs — 生成一篇新博客文章的 Markdown 模板
 *
 * 用法：
 *   node scripts/new-post.mjs "文章标题"
 *
 * 可选参数：
 *   --category 技术    分类（技术/随笔/项目/学习，默认"技术"）
 *   --slug xxx        自定义 slug（默认由标题自动生成英文连字符）
 *
 * 效果：
 *   1. 在 content/posts/ 下生成一篇带 front-matter 的 .md 模板
 *   2. 更新 content/posts/index.json（文章清单，供前端博客列表读取）
 */

import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'content', 'posts');
const INDEX_FILE = join(POSTS_DIR, 'index.json');
const TEMPLATE_FILE = join(POSTS_DIR, '_template.md');

const args = process.argv.slice(2);
const titleIdx = args.findIndex((a) => !a.startsWith('--'));
const title = titleIdx >= 0 ? args[titleIdx] : null;

if (!title) {
  console.error('❌ 请提供文章标题，例如：\n  node scripts/new-post.mjs "我的新文章"\n');
  process.exit(1);
}

const flag = (name, def) => {
  const i = args.findIndex((a) => a === `--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const category = flag('category', '技术');
const customSlug = flag('slug', null);

// slug：中文标题用拼音不现实，这里转成小写英文+连字符；若标题是中文，提示手动设置 --slug
const slugOf = (t) => {
  const latin = t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  return latin || null;
};

const slug = customSlug || slugOf(title);
if (!slug) {
  console.error('❌ 标题全是中文，无法自动生成 URL slug。请用 --slug 指定，例如：\n  node scripts/new-post.mjs "从零实现CNN" --slug cnn-from-scratch\n');
  process.exit(1);
}

// 今天的日期
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const targetFile = join(POSTS_DIR, `${slug}.md`);
if (existsSync(targetFile)) {
  console.error(`❌ 已存在：${slug}.md，请换个标题或 --slug。\n`);
  process.exit(1);
}

// 生成文章文件
const template = readFileSync(TEMPLATE_FILE, 'utf8');
const frontmatter = [
  '---',
  `title: ${title}`,
  `slug: ${slug}`,
  `date: ${today}`,
  `category: ${category}`,
  'tags: [标签一, 标签二]',
  'summary: 一句话摘要，会显示在博客卡片和列表里',
  'cover: ./assets/images/blog-4.jpg',
  'published: true',
  '---',
].join('\n');

// 去掉模板自带的 front-matter（从第一个 "---" 之后开始）
const bodyStart = template.indexOf('---', template.indexOf('---') + 1);
const body = template.slice(bodyStart + 3).replace(/^[\r\n]+/, '');
const content = `${frontmatter}\n\n${body}\n`;

writeFileSync(targetFile, content, 'utf8');
console.log(`✅ 已创建文章：${targetFile}`);

// 更新清单 index.json
updateIndex(targetFile, { title, slug, date: today, category });

// ----------------------------------------------------------------
function updateIndex(newFile, meta) {
  let posts = [];
  if (existsSync(INDEX_FILE)) {
    try { posts = JSON.parse(readFileSync(INDEX_FILE, 'utf8')); } catch { posts = []; }
  }

  // 把已存在的文章也扫描进来（保证 index 与目录一致）
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const found = new Map();
  for (const f of files) {
    const raw = readFileSync(join(POSTS_DIR, f), 'utf8');
    const fm = parseFrontmatter(raw);
    if (fm) found.set(fm.slug || f.replace(/\.md$/, ''), { ...fm, file: f });
  }

  posts = posts.filter((p) => found.has(p.slug)); // 清掉已删除的
  for (const [slugKey, fm] of found) {
    const existing = posts.find((p) => p.slug === slugKey);
    if (existing) Object.assign(existing, fm);
    else posts.push(fm);
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n', 'utf8');
  console.log(`✅ 已更新清单：${INDEX_FILE}（共 ${posts.length} 篇文章）`);
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
