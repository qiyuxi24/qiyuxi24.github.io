#!/usr/bin/env node
/**
 * build-feed.mjs — 从文章清单生成 RSS 订阅文件 feed.xml
 *
 * 用法：
 *   node scripts/build-feed.mjs
 *
 * 前置：先运行 node scripts/build-index.mjs 更新 posts/index.json
 * 产物：根目录 feed.xml（RSS 2.0）
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_INDEX = join(ROOT, 'content', 'posts', 'index.json');
const FEED_FILE = join(ROOT, 'feed.xml');

const SITE = 'https://qiyuxi24.github.io';
const AUTHOR = '佀佳超';
const SITE_TITLE = '佀佳超 | 同州禹斋';
const SITE_DESC = 'AI 应用开发者 · 西工大在读 · 把想法变成能跑的东西';
const LANG = 'zh-CN';

if (!existsSync(POSTS_INDEX)) {
  console.error(`❌ 找不到 ${POSTS_INDEX}，请先运行 node scripts/build-index.mjs\n`);
  process.exit(1);
}

const posts = JSON.parse(readFileSync(POSTS_INDEX, 'utf8'));

// 只输出已发布文章
const published = posts.filter((p) => p.published !== false);

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const rfc822 = (d) => {
  const dt = d ? new Date(d) : new Date();
  if (isNaN(dt)) return new Date().toUTCString();
  return dt.toUTCString();
};

const items = published
  .map((p) => {
    const link = `${SITE}/reader.html?slug=${esc(p.slug)}`;
    const date = rfc822(p.date);
    const category = p.category ? `    <category>${esc(p.category)}</category>\n` : '';
    return `  <item>
    <title>${esc(p.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="false">${esc(p.slug)}</guid>
    <pubDate>${date}</pubDate>
    <description>${esc(p.summary || '')}</description>
${category}  </item>`;
  })
  .join('\n');

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="./feed.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE}</link>
    <description>${esc(SITE_DESC)}</description>
    <language>${LANG}</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${rfc822(new Date())}</lastBuildDate>
    <generator>build-feed.mjs</generator>
${items}
  </channel>
</rss>
`;

writeFileSync(FEED_FILE, feed, 'utf8');
console.log(`✅ 已生成 ${FEED_FILE}（${published.length} 篇文章）`);
