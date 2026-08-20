# qiyuxi24.github.io

个人主页网站，基于 **vCard** 模板构建（纯 HTML/CSS/JS 炫酷暗色名片风，适配 GitHub Pages）。

## 快速开始

所有个人内容都在 **`index.html`** 中填写，详细填写指南见 **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)**。

### 本地预览

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### 部署到 GitHub Pages

1. 修改并提交推送
2. 仓库 Settings → Pages → Source → `Deploy from a branch` → `main` / `/ (root)`
3. 站点发布到 `https://qiyuxi24.github.io/`

> 已添加 `.nojekyll` 文件，GitHub Pages 直接发布静态文件，不会触发 Jekyll 构建。

## 模板来源

- **vCard - Personal Portfolio**：https://github.com/codewithsadee/vcard-personal-portfolio
- 协议：MIT

## 目录结构

```
├── index.html          # 网站主页面（填写你的内容）
├── reader.html         # 博客文章阅读页（marked 渲染 Markdown）
├── feed.xml            # RSS 订阅源（脚本生成）
├── CONTENT_GUIDE.md    # 内容填写指南
├── content/
│   ├── posts/          # 博客文章（Markdown，带 front-matter）
│   │   ├── index.json  # 文章清单（脚本生成）
│   │   └── _template.md
│   └── projects/       # 项目展示（Markdown）
│       ├── index.json  # 项目清单（脚本生成）
│       └── _template.md
├── scripts/
│   ├── new-post.mjs    # 生成新文章模板
│   ├── new-project.mjs # 生成新项目模板
│   ├── build-index.mjs # 重建文章/项目清单
│   └── build-feed.mjs  # 从清单生成 RSS feed.xml
├── assets/
│   ├── css/style.css   # 样式
│   ├── css/reader.css  # 文章阅读页样式
│   ├── js/script.js    # 交互
│   ├── js/reader.js    # 文章阅读页逻辑
│   ├── js/github-stats.js # GitHub 动态数据（star/语言/总览）
│   └── images/         # 图片素材（头像、项目图、博客图）
├── _legacy_jekyll/     # 旧 Jekyll 模板备份（可删除）
└── .nojekyll           # 禁用 Jekyll 构建
```

## 写博客 / 发项目工作流

用 Markdown 写内容，脚本帮你建文件、更新清单、生成 RSS：

```bash
# 1. 新建一篇文章（自动生成模板 + 更新文章清单）
node scripts/new-post.mjs "文章标题" --category 技术

# 2. 新建一个项目
node scripts/new-project.mjs "项目名" --repo https://github.com/qiyuxi24/xx --demo https://...

# 3. 手写/改完 Markdown 后重建清单 + RSS
node scripts/build-index.mjs
node scripts/build-feed.mjs
```

- 文章：写 `content/posts/*.md`，正文用 Markdown，`reader.html?slug=文章slug` 在线渲染
- 项目：写 `content/projects/*.md`，配合主页 `data-github-repo` 自动显示 star
- 提交前记得跑一遍 `build-index.mjs` + `build-feed.mjs`

## 已内置的功能

- **GitHub 动态数据**：项目卡片自动显示 star/fork/语言；"关于"页显示 GitHub 足迹总览
- **RSS 订阅**：`/feed.xml`，博客页有订阅入口
- **访问统计**：不蒜子，纯前端，侧边栏 + 文章页自动显示
- **Markdown 博客**：`reader.html` 用 marked 渲染文章，支持代码复制、代码语言标签
