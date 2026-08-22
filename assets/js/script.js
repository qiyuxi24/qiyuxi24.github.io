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

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// 科技树以全屏覆盖层展示，由 tree.js 暴露的 API 控制
function openTreeFullscreen() {
  if (window.TreeFullscreen) {
    window.TreeFullscreen.open();
  }
}

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    const targetPage = this.dataset.navPage;

    if (targetPage === "tree") {
      // 科技树：全屏展示，不清空当前文章页（被覆盖层遮住即可）
      for (let k = 0; k < navigationLinks.length; k++) {
        navigationLinks[k].classList.remove("active");
      }
      this.classList.add("active");
      openTreeFullscreen();
      return;
    }

    for (let j = 0; j < pages.length; j++) {
      if (pages[j].dataset.page === targetPage) {
        pages[j].classList.add("active");
      } else {
        pages[j].classList.remove("active");
      }
    }

    for (let k = 0; k < navigationLinks.length; k++) {
      navigationLinks[k].classList.remove("active");
    }
    this.classList.add("active");
    window.scrollTo(0, 0);

  });
}