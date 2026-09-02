# qiyuxi24.github.io

个人主页网站，基于 **vCard** 模板构建（纯 HTML/CSS/JS 炫酷暗色名片风，适配 GitHub Pages）。

## 快速开始

所有个人内容都在 **`index.html`** 中填写，详细填写指南见 **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)**。

### 本地预览

**推荐：双击 `start-local.bat`**（自动启动热重载服务器并打开浏览器）：

- 打开 `http://localhost:8899/`
- **热重载**：保存 HTML/CSS/JS/Markdown 后浏览器自动刷新，改文章/样式实时预览

命令行方式：

```bash
node scripts/serve-local.mjs   # 默认 8899 端口
# 浏览器打开 http://localhost:8899
```

> ⚠️ 不要直接双击 `index.html` / `reader.html`（`file://` 协议）——浏览器会拦截本地 fetch，文章列表和正文无法加载。必须通过本地服务器访问。

### 部署到 GitHub Pages

1. 修改并提交推送
2. 仓库 Settings → Pages → Source → `Deploy from a branch` → `main` / `/ (root)`
3. 站点发布到 `https://qiyuxi24.github.io/`

> 已添加 `.nojekyll` 文件，GitHub Pages 直接发布静态文件，不会触发 Jekyll 构建。

> ⚠️ 提交前务必包含 `assets/vendor/`（KaTeX 公式库 + Vditor 编辑器），否则线上公式渲染 / 发布工作台会 404。建议直接用 `git add -A`。

## 个人维护手册（改头像 / 个人信息）

> 下面这些是最常用的改动。改完 `git add . && git commit && git push` 即上线。

### 换头像（最常见）

1. 准备一张 **正方形** 照片，建议 ≥ 200×200
2. 用**同名覆盖**：保存为 `assets/images/my-avatar.png`（替换旧文件即可，不用改任何代码）
3. 提交推送，刷新页面生效

> ⚠️ 不要改成别的文件名（除非顺便改 `index.html` 里的 `src`）。头像必须是 `my-avatar.png`，别的名字会 404。

### 换浏览器标签图标（favicon）

替换这三个文件（同名覆盖即可）：
- `assets/images/logo.ico` —— 浏览器标签小图标
- `assets/images/logo-1-color.png` —— 移动端 / PWA 图标（32×32）

### 改名字 / 身份 / 简介（注意 i18n！）

页面大部分文字是**双语（中/英）**，由 `assets/data/i18n.js` 统一管理（`data-i18n="key"` 从字典取词）。

| 想改什么 | 改哪里 |
|----------|--------|
| 侧边栏身份（如 "AI 应用开发者"） | `index.html` 的 `<p class="title">` + `i18n.js` 的 `sidebar_title`（中英都改） |
| "关于我" 两段简介 | `i18n.js` 的 `about_p1` / `about_p2` |
| 服务卡片（4 个：AI 应用/桌面/Web/深度学习） | `i18n.js` 的 `service_*` 系列 |
| 简历（教育/项目/技能） | `i18n.js` 的 `resume_*` 系列 |
| 页面标题 / 搜索引擎描述 | `index.html` `<head>` 里的 `<title>`、`meta description`、`og:*`、`twitter:*`（这些是硬编码中文，不在 i18n） |
| 分享到微信/QQ 时的预览图 | `index.html` 里 `og:image` / `twitter:image`（当前指向 `assets/images/project-1.jpg`） |

> ⚠️ 规律：带 `data-i18n="xxx"` 的元素显示的是 `i18n.js` 里的字典值，直接改 HTML 里的中文**不会生效**。改文案请改 `i18n.js`，并且 **zh + en 都要改**。

### 改侧边栏社交链接

位置：`index.html` 侧边栏 `<aside class="sidebar">` 里的 10 个 `<a class="social-link">`（内联 SVG 图标）。

每个链接改三处：
- `href="..."` —— 换成你的主页地址（暂无就留 `href="#"`）
- 品牌色 `style="--brand:#xxx"` —— 鼠标悬停显示的平台色
- SVG `<path>` —— 各平台图标（Simple Icons 官方 path，想换平台就换 path）

> 待办：LinkedIn 目前 `href="#"`（链接还没填）。

### 改联系方式

位置：`index.html`
- 邮箱（侧边栏 + 联系页）：`mailto:wojtek@mail.nwpu.edu.cn`，搜 `wojtek` 全文替换
- QQ（联系页快捷卡片）：搜索 `3423982851`，改 `tencent://message/?uin=...` 和显示数字
- 生日 / 位置 / 学历：侧边栏 `<li class="contact-item">`，具体文字在 `i18n.js` 的 `contact_*` 里

### 加 / 改项目卡片

1. 截图放进 `assets/images/`（如 `project-5.jpg`，建议 16:9）
2. 复制 `index.html` 项目区（`<section class="portfolio">`）里一个 `<li class="project-item">`，改：截图 `src`、标题、分类、`data-category`、`data-github-repo="仓库名"`（自动显示 star/fork/语言）
3. 详细说明写 `content/projects/*.md`（可选，但建议），然后 `node scripts/build-index.mjs`

### 改爱好 tab（我的页面独有）

- 数据结构：`assets/data/hobbies-data.js`（阅读/游戏/音乐/创作/运动/知识记录六块内容都在这）
- 展示逻辑：`assets/js/hobbies.js`；样式：`assets/css/hobbies.css`

### 改科技树（独立全屏覆盖层）

- 数据：`assets/data/tree-data.js`（节点/连线）
- 渲染：`assets/js/tree-render.js`；入口：`assets/js/tree.js`
- 打开/关闭由 `assets/js/page-manager.js` 统一管理（注册为覆盖层页，退出后返回原页面）

### 写博客 / 发项目

见下方「写博客 / 发项目工作流」章节。

## 模板来源

- **vCard - Personal Portfolio**：https://github.com/codewithsadee/vcard-personal-portfolio
- 协议：MIT

## 目录结构

```
├── index.html          # 网站主页面（填写你的内容）
├── reader.html         # 博客文章阅读页（marked 渲染 Markdown + KaTeX 公式）
├── publish.html        # 发布工作台（GUI 编辑器，双击 start-publish.bat 使用）
├── feed.xml            # RSS 订阅源（脚本生成）
├── start-publish.bat   # 一键启动发布工作台（本地服务 http://localhost:3456）
├── start-local.bat     # 一键启动本地预览（热重载，http://localhost:8899）
├── CONTENT_GUIDE.md    # 内容填写指南
├── content/
│   ├── posts/          # 博客文章（Markdown，带 front-matter）
│   │   ├── index.json  # 文章清单（脚本生成）
│   │   └── _template.md
│   └── projects/       # 项目展示（Markdown）
│       ├── index.json  # 项目清单（脚本生成）
│       └── _template.md
├── scripts/
│   ├── publish-server.mjs # 发布工作台后端（文章 CRUD + 图片上传 + 一键重建索引/RSS）
│   ├── serve-local.mjs    # 本地预览服务器（静态文件 + SSE 热重载）
│   ├── new-post.mjs    # 生成新文章模板
│   ├── new-project.mjs # 生成新项目模板
│   ├── build-index.mjs # 重建文章/项目清单
│   └── build-feed.mjs  # 从清单生成 RSS feed.xml
├── assets/
│   ├── data/           # 纯数据 JS（与逻辑组件分离，页面 script 按需引入）
│   │   ├── i18n.js     # 中英双语字典（I18N_DICT）
│   │   ├── hobbies-data.js # 爱好数据（阅读/游戏/音乐/创作/运动/知识记录）
│   │   └── tree-data.js    # 科技树数据（节点/连线）
│   ├── css/style.css   # 主样式（vCard 默认 + 特效 + 科技树 + GitHub stats）
│   ├── css/reader.css  # 文章阅读页样式
│   ├── css/hobbies.css # 爱好 tab 样式
│   ├── js/script.js    # 导航 / 筛选交互
│   ├── js/reader.js    # 文章阅读页逻辑
│   ├── js/theme.js     # 深/浅色主题切换
│   ├── js/i18n-app.js  # 语言切换逻辑（侧边栏滑块，localStorage 持久化）
│   ├── js/page-manager.js # 页面切换中间件（导航高亮/覆盖层状态统一管理）
│   ├── js/marked.min.js   # marked 本地库（Markdown 渲染）
│   ├── js/marked-math.js  # Markdown 公式预处理（$...$ / $$...$$）
│   ├── js/katex-loader.js # KaTeX 加载器（本地优先 + CDN 兜底）
│   ├── js/github-stats.js # GitHub 动态数据（star/语言/总览）
│   ├── js/tree-render.js / tree.js # 科技树（渲染器 / 入口）
│   ├── js/hobbies.js   # 爱好 tab 渲染逻辑（数据见 data/hobbies-data.js）
│   ├── vendor/katex/   # KaTeX 本地库（公式渲染，含字体）
│   ├── vendor/vditor/  # Vditor 开源编辑器（MIT，本地化，含中文包/代码高亮/公式）
│   └── images/         # 图片素材（头像、项目图、博客图）
│       └── posts/      # 发布工作台上传的文章配图
├── _legacy_jekyll/     # 旧 Jekyll 模板备份（可删除）
└── .nojekyll           # 禁用 Jekyll 构建
```

## 写博客 / 发项目工作流

### 推荐：GUI 发布工作台（免记命令）

**双击 `start-publish.bat`** 即可打开可视化编辑器 `http://localhost:3456/`：

- **文章管理**：左侧文章列表，一键新建 / 编辑 / 删除（草稿和已发布一目了然）
- **元数据表单**：标题 / slug / 日期 / 分类 / 标签 / 摘要 / 封面，不用手写 front-matter
- **Markdown 编辑器**：内核复用开源 **Vditor**（MIT），所见即所得即时渲染，工具栏一键插入 标题/列表/引用/代码块/表格/链接
- **图片上传**：工具栏上传按钮、Ctrl+V 粘贴、或直接拖图进编辑器，自动存到 `assets/images/posts/` 并插入 `![](...)` 路径
- **公式**：工具栏 Σ / ΣΣ 插入 `$...$`（行内）/ `$$...$$`（块级），KaTeX 实时渲染（内置，与阅读页一致）
- **一键发布**：点「保存并发布」→ 自动写 `content/posts/<slug>.md` + 重建 `index.json` + 生成 `feed.xml`，再点「预览文章」浏览器查看效果
- 保存后直接 `git add . && git commit && git push` 即上线

### 命令行方式（可选）

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

### 图片与公式写法

**图片**（三选一，推荐用发布工作台自动插入）：

```markdown
![图片说明](./assets/images/posts/我的图.png)
```

- 发布工作台上传的图会自动存到 `assets/images/posts/`，路径自动填好
- 手动方式：把图片放进 `assets/images/posts/`，再写上面的相对路径（相对网站根目录）

**公式**（阅读页已支持 KaTeX，写作和发布工作台实时预览一致）：

```markdown
行内公式：$E = mc^2$，公式紧贴中文也没问题：设$x$为未知数

块级公式（独占一段）：

$$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

支持跨多行：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

> 提示：`$` 前后可贴中文/标点；代码块（```）里的 `$` 不会被解析；价格类 `$5 和 $6` 不会被误判成公式。

## 已内置的功能

- **中英双语**：侧边栏语言滑块一键切换中/英，全部文案（侧边栏/关于/服务/简历/联系等）实时替换，语言选择持久化到 localStorage
- **深色 / 浅色主题**：右上角太阳/月亮按钮切换，无闪烁（首屏前应用主题），选择持久化
- **科技树**：独立全屏覆盖层（Obsidian Graph View 风格力导向图），点击节点聚焦、可查看详情，关闭后停摆省电
- **爱好 tab**：阅读 / 游戏 / 音乐 / 创作 / 运动 / 知识记录六大板块，独立导航高亮
- **GitHub 动态数据**：项目卡片自动显示 star/fork/语言；"关于"页显示 GitHub 足迹总览
- **RSS 订阅**：`/feed.xml`，博客页有订阅入口
- **访问统计**：不蒜子，纯前端，侧边栏 + 文章页自动显示
- **Markdown 博客**：`reader.html` 用 marked 渲染文章（本地化 + CDN 兜底），支持代码复制、代码语言标签
- **公式渲染**：文章支持 LaTeX 公式（`$...$` 行内 / `$$...$$` 块级），KaTeX 本地加载 + CDN 兜底
- **发布工作台**：`publish.html`（`start-publish.bat` 启动）GUI 编辑文章、上传图片、一键更新索引和 RSS；编辑器内核复用开源 Vditor（MIT，本地化，不依赖外网 CDN）
- **热重载本地预览**：`start-local.bat` 启动本地服务器（8899），保存文件后浏览器自动刷新
