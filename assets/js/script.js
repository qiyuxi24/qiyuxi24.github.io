'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    // 用稳定的 data-filter-key 匹配（显示文本可被翻译）
    let selectedKey = this.dataset.filterKey || this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedKey);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

// filterFunc 用 data-category-key 匹配（与显示文本解耦，翻译不影响筛选）
const filterFunc = function (selectedKey) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedKey === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedKey === (filterItems[i].dataset.categoryKey || filterItems[i].dataset.category)) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedKey = this.dataset.filterKey || this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedKey);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form：已改为 mailto + 社交列表按钮，无表单需校验。
// 此处保留原校验逻辑注释作历史参考：旧版监听 [data-form-input] 的 input 事件，
// 通过 form.checkValidity() 切换 [data-form-btn] 的 disabled 状态。

// blog posts：根据 content/posts/index.json 自动生成首页文章列表
// 兜底文案与日期格式跟随语言（词典来自 i18n.js / i18n-app.js）
const T = (key) => (window.__I18N ? window.__I18N(key) : '');

async function loadBlogPosts() {
  const blogList = document.querySelector(".blog-posts-list");
  if (!blogList) return;

  try {
    const response = await fetch("./content/posts/index.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const posts = await response.json();
    const published = (Array.isArray(posts) ? posts : []).filter((post) => post.published !== false);

    if (!published.length) {
      blogList.innerHTML = `<li class="blog-post-item"><p class="blog-text">${T('blog_empty') || '暂无文章。'}</p></li>`;
      return;
    }

    // 置顶文章（front-matter pinned: true）永远排最前，其余保持原顺序（Array.sort 稳定）
    const list = [...published].sort((a, b) => (b.pinned === true) - (a.pinned === true));

    blogList.innerHTML = list.map((post) => {
      const title = post.title || T('blog_untitled') || "未命名文章";
      const category = post.category || T('blog_cat_default') || "随笔";
      const summary = post.summary || "";
      const cover = post.cover || "./assets/images/blog-4.jpg";
      const slug = post.slug || (post.file || "").replace(/\.md$/i, "");
      const dateValue = post.date || "";
      const dateLocale = window.__siteLang === "en" ? "en-US" : "zh-CN";
      const dateText = dateValue ? new Date(`${dateValue}T00:00:00`).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "short",
        day: "numeric"
      }) : (T('blog_no_date') || "未设置日期");

      const pinBadge = post.pinned === true
        ? `<span class="pin-badge">${T('blog_pinned') || '置顶 · 长期更新'}</span>`
        : "";

      return `
        <li class="blog-post-item${post.pinned === true ? ' is-pinned' : ''}">
          <a href="./reader.html?slug=${encodeURIComponent(slug)}">
            ${pinBadge}
            <figure class="blog-banner-box">
              <img src="${cover}" alt="${title}" loading="lazy">
            </figure>
            <div class="blog-content">
              <div class="blog-meta">
                <p class="blog-category">${category}</p>
                <span class="dot"></span>
                <time datetime="${dateValue}">${dateText}</time>
              </div>
              <h3 class="h3 blog-item-title">${title}</h3>
              <p class="blog-text">${summary}</p>
            </div>
          </a>
        </li>
      `;
    }).join("");
  } catch (error) {
    console.error("Failed to render blog posts:", error);
    // file:// 直开（双击 HTML）时浏览器拦截 fetch，提示用户用服务器方式访问
    const fileHint =
      window.location.protocol === "file:"
        ? (T('blog_file_hint') || "本地直接打开 HTML 无法加载文章列表（浏览器安全限制）。请部署到 GitHub Pages，或双击 start-local.bat 启动本地服务器。")
        : (T('blog_load_fail') || "文章列表加载失败，请检查 content/posts/index.json。");
    blogList.innerHTML = `<li class="blog-post-item"><p class="blog-text">${fileHint}</p></li>`;
  }
}

loadBlogPosts();

// 语言切换后重渲染文章列表（兜底文案与日期格式跟随语言）
window.addEventListener("langchange", function () {
  loadBlogPosts();
});

// 页面切换已由 page-manager.js 中间件统一管理
// （导航高亮 + article.active + 覆盖层钩子单一状态源），
// 此处不再维护独立导航逻辑，避免状态分散导致不同步。

/*------------------------------------*\
  阅读页返回位置恢复（reader back）
  - 点击博客卡片跳 reader.html 前，把当前 tab 与滚动位置存进 sessionStorage
  - 从阅读页返回本页后，自动切回原 tab 并恢复滚动位置（文章读完回到原处）
\*------------------------------------*/
(function () {
  // 1) 记录：博客卡片点击
  const blogList = document.querySelector(".blog-posts-list");
  if (blogList) {
    blogList.addEventListener("click", function (e) {
      const a = e.target.closest('a[href*="reader.html"]');
      if (!a) return;
      try {
        // 以"实际可见 tab"为准（article.active），而非内部状态——
        // 避免其他脚本直接改 DOM 导致 PageManager.current 与显示脱节
        const activeArt = document.querySelector("article.active");
        const page =
          (activeArt && activeArt.dataset.page) ||
          (window.PageManager ? window.PageManager.current : "blog");
        sessionStorage.setItem("reader-back", JSON.stringify({
          page: page,
          y: Math.round(window.scrollY || window.pageYOffset || 0)
        }));
      } catch (err) { /* 隐私模式等场景下静默忽略 */ }
    });
  }

  // 2) 恢复：本页加载完成后检查是否有待恢复的返回状态
  function tryRestore() {
    let back = null;
    try { back = JSON.parse(sessionStorage.getItem("reader-back") || "null"); } catch (err) { back = null; }

    const validPages = ["about", "resume", "portfolio", "blog", "contact", "hobbies"];

    // 兜底：无 sessionStorage 记录时，支持 ?page=xxx URL 参数直达对应 tab。
    // reader 返回链接携带 ?page=blog，保证从阅读页返回（含站外直开场景）
    // 也能落在"文章列表"，而不是默认的主界面。
    if (!back || typeof back !== "object") {
      const p = new URLSearchParams(window.location.search).get("page");
      if (p && validPages.indexOf(p) > -1) {
        if (window.PageManager) window.PageManager.go(p, true);
        // 消费后清掉参数，避免刷新/分享时 URL 残留 page 标记
        if (history.replaceState) {
          history.replaceState(null, "", location.pathname + location.hash);
        }
      }
      return;
    }
    try { sessionStorage.removeItem("reader-back"); } catch (err) {}

    const page = validPages.indexOf(back.page) > -1 ? back.page : "blog";
    const y = Math.max(0, Number(back.y) || 0);

    // 切回原 tab（force：即便内部状态已与 DOM 脱节也强制同步）
    if (window.PageManager) window.PageManager.go(page, true);

    // 滚动定位：懒加载图片会撑高文档，轮询校正直到文档高度稳定
    let attempts = 0;
    let lastH = -1;
    (function settle() {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(y, maxY);
      if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true });
      else window.scrollTo(0, target);

      const h = document.documentElement.scrollHeight;
      attempts++;
      if (attempts < 12 && h !== lastH) {
        lastH = h;
        setTimeout(settle, 300); // 高度仍在变化（图片陆续加载），继续校正
      }
    })();
  }

  if (document.readyState === "complete") tryRestore();
  else window.addEventListener("load", tryRestore);
})();