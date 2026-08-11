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
├── CONTENT_GUIDE.md    # 内容填写指南
├── assets/
│   ├── css/style.css   # 样式
│   ├── js/script.js    # 交互
│   └── images/         # 图片素材（头像、项目图、博客图）
├── _legacy_jekyll/     # 旧 Jekyll 模板备份（可删除）
└── .nojekyll           # 禁用 Jekyll 构建
```
