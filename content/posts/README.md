# 文章维护规则

这个目录是站点的文章源。所有博客正文都放在这里，按 Markdown 编写，最终通过 `reader.html?slug=xxx` 渲染展示。

## 1. 目录职责

- `content/posts/`：所有文章正文
- `content/posts/index.json`：文章索引，自动生成，不要手工维护
- `_template.md`：新文章模板
- `*.md`：每篇文章对应一个文件

> 这个目录是“文章事实来源”，所有文章的标题、时间、摘要、slug 都从这里读取。

## 2. 一篇文章的基本结构

每篇文章都应遵循下面格式：

```md
---
title: 文章标题
slug: article-slug
date: 2026-08-22
category: 随笔
tags: [标签一, 标签二]
summary: 一句话摘要，会显示在博客卡片里
cover: ./assets/images/blog-4.jpg
published: true
---

## 正文标题

这里开始写正文。
```

### 必填字段

- `title`：文章标题
- `slug`：URL 标识，必须唯一，建议全小写、英文词间用 `-` 连接
- `date`：发布日期，格式 `YYYY-MM-DD`
- `category`：分类，如 `技术` / `随笔` / `学习` / `项目`
- `summary`：摘要，用于列表展示
- `published`：`true` 才会出现在列表和 RSS

### 可选字段

- `tags`：标签数组
- `cover`：封面图路径

## 3. 命名规则

- 文件名建议与 `slug` 一致，例如：
  - `gender-war.md` -> `slug: gender-war`
  - `tech-is-not-neutral.md` -> `slug: tech-is-not-neutral`
- 统一使用小写英文 + 连字符
- 避免重复 slug，否则打开文章时会出现冲突

## 4. 发布流程

### 新增文章

推荐使用脚本：

```bash
node scripts/new-post.mjs "我的文章标题" --category 随笔
```

如果标题是中文，最好指定 slug：

```bash
node scripts/new-post.mjs "我的新文章" --slug my-new-article --category 随笔
```

### 编辑文章

1. 打开生成的 `content/posts/xxx.md`
2. 修改 `front-matter`
3. 写正文内容（Markdown）
4. 保存

### 预览

本地预览方式：

```bash
python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000/reader.html?slug=your-slug
```

## 5. 文章在站点中的展示方式

站点并不是直接渲染一个模板，而是这样的链路：

1. 主页的博客卡片链接指向 `reader.html?slug=xxx`
2. `reader.js` 读取 `./content/posts/${slug}.md`
3. 解析 front matter
4. 用 `marked` 渲染正文 Markdown
5. 展示在阅读页

因此：

- 文章的真实内容保存在 `content/posts/*.md`
- 文章页只是“读取并渲染”这些文件
- 主页卡片只是入口，不是文章本体

## 6. 列表与 RSS 更新

每次修改/新增文章后，建议执行：

```bash
node scripts/build-index.mjs
node scripts/build-feed.mjs
```

这两个命令会：

- 更新 `content/posts/index.json`
- 生成 RSS `feed.xml`
- 让文章列表和订阅保持同步

## 7. 主页展示规则

如果你希望文章出现在首页的博客列表中，除了文章文件本身，还需要在 [index.html](../../index.html) 中添加对应的卡片链接。为了保持一致，建议遵循：

- 每篇文章对应一个博客卡片
- 卡片的链接格式：

```html
<a href="./reader.html?slug=your-slug">...</a>
```

- 标题、摘要、日期和封面都和文章的 `front-matter` 保持统一

## 8. 发布开关

- `published: true`：文章正常展示
- `published: false`：文章保留但不会出现在列表和 RSS

适合：

- 草稿
- 未定稿文章
- 临时测试内容

## 9. 建议维护习惯

- 一篇文章一个文件
- 一个文件只维护一篇文章内容
- 不要手改 `index.json`，交给脚本生成
- 文章 slug 一旦决定不要轻易改，避免旧链接失效
- 每篇文章都至少要有：标题、slug、date、summary、published

## 10. 最简操作模板

新文章流程：

```bash
node scripts/new-post.mjs "标题" --category 随笔 --slug article-slug
# 编辑 content/posts/article-slug.md
node scripts/build-index.mjs
node scripts/build-feed.mjs
```

如果只是本地写作，不急着首页展示，也可以先写 Markdown，后续再补卡片入口。

---

维护原则：

> 你的博客文章以 Markdown 为核心，front matter 为元数据，首页作为入口，渲染页负责展示；只要遵守这个规则，后续文章会非常容易维护和扩展。
