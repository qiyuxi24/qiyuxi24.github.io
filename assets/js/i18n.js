/*==============================================*\
  #i18n.js — 全站中英字典
  每个 key 对应 index.html 中的 data-i18n="key" 元素。
  切换语言时查表替换，所有翻译集中在此，单一真相源。
\*==============================================*/
'use strict';

const I18N_DICT = {
  // —— 侧边栏 ——
  sidebar_title:  { zh: 'AI 应用开发者', en: 'AI Application Developer' },
  sidebar_contacts: { zh: 'Show Contacts', en: 'Show Contacts' },
  contact_email:  { zh: 'Email', en: 'Email' },
  contact_birthday: { zh: '生日', en: 'Birthday' },
  contact_location: { zh: '位置', en: 'Location' },
  contact_edu:      { zh: '学历', en: 'Education' },
  site_visits:    { zh: '本站累计', en: 'Total visits' },
  site_visits_times: { zh: '次访问', en: '' },

  // —— 导航 ——
  nav_about:      { zh: '关于', en: 'About' },
  nav_resume:     { zh: '简历', en: 'Resume' },
  nav_portfolio:  { zh: '项目', en: 'Portfolio' },
  nav_blog:       { zh: '文章', en: 'Blog' },
  nav_tree:       { zh: '科技树', en: 'Tech Tree' },
  nav_hobbies:    { zh: '爱好', en: 'Hobbies' },
  nav_contact:    { zh: '联系', en: 'Contact' },

  // —— 关于 ——
  about_title:        { zh: '关于我', en: 'About Me' },
  about_p1:           { zh: '西北工业大学人工智能专业在读，AI 应用方向开发者。做过桌面 AI IDE、AI 教育导师、快应用等项目，拿过 AIGC 大赛地区二等奖。', en: 'Studying AI at Northwestern Polytechnical University. Building desktop AI IDEs, AI tutors, and more; won a regional 2nd prize in an AIGC contest.' },
  about_p2:           { zh: '信奉「项目 + 文档 > 看书」，正把每个想法变成能跑的东西。', en: 'I believe "projects + docs beat just reading" — turning every idea into something that runs.' },
  about_service_title: { zh: '我在做什么', en: 'What I Do' },
  service_ai_title:   { zh: 'AI 应用开发', en: 'AI Application Dev' },
  service_ai_text:    { zh: 'LLM 调用、Agent、流式对话，从零搭过完整的 AI 教育系统。', en: 'LLM calls, Agents, streaming chat — built a full AI tutoring system from scratch.' },
  service_app_title:  { zh: '桌面应用', en: 'Desktop Apps' },
  service_app_text:   { zh: 'Tauri v2 + Rust + React，做出 ~5MB 的端侧 AI IDE。', en: 'Tauri v2 + Rust + React, shipping a ~5MB on-device AI IDE.' },
  service_web_title:  { zh: '全栈 Web', en: 'Full-Stack Web' },
  service_web_text:   { zh: 'Vue 3 / FastAPI 前后端分离，JWT 认证、限流、SSE 流式全套。', en: 'Vue 3 / FastAPI with JWT auth, rate limiting and SSE streaming.' },
  service_dl_title:   { zh: '深度学习', en: 'Deep Learning' },
  service_dl_text:    { zh: '纯 NumPy 手写神经网络与 CNN，MNIST 实战，正在上 PyTorch。', en: 'Hand-written NNs and CNNs in pure NumPy, MNIST practice, now learning PyTorch.' },
  github_title:       { zh: 'GitHub 足迹', en: 'GitHub Footprint' },
  github_loading:     { zh: '正在同步 GitHub 数据…', en: 'Syncing GitHub data…' },

  // —— 简历 ——
  resume_title:        { zh: '简历', en: 'Resume' },
  resume_edu:          { zh: '教育经历', en: 'Education' },
  resume_edu_uni:      { zh: '西北工业大学 · 人工智能专业', en: 'Northwestern Polytechnical University · AI' },
  resume_edu_uni_dates:{ zh: '2025 — 2029', en: '2025 — 2029' },
  resume_edu_desc:     { zh: '西工大人工智能学院在读，AI 应用方向，主攻大模型应用、Agent 与桌面软件开发。', en: 'AI student focused on LLM applications, Agents and desktop software development.' },
  resume_edu_high:     { zh: '西安国际港务区铁一中陆港高级中学', en: 'Xi\u0027an Lugang Senior High School (Tieyi, International Port District)' },
  resume_edu_high_dates: { zh: '2022 — 2025', en: '2022 — 2025' },
  resume_edu_high_desc:  { zh: '高中', en: 'High School' },
  resume_projects:     { zh: '项目经历', en: 'Projects' },
  resume_proj_votek:   { zh: '桌面 AI IDE', en: 'Desktop AI IDE' },
  resume_proj_votek_dates: { zh: '2026.07 — 至今', en: 'Jul 2026 — Present' },
  resume_proj_votek_desc: { zh: 'Tauri v2 + React 19，流式对话、多模型一键切换、MCP 服务器管理、Skills 技能市场、内置浏览器，安装包 ~5MB，纯端侧运行。', en: 'Tauri v2 + React 19. Streaming chat, one-click model switching, MCP server management, Skills marketplace, built-in browser. ~5MB, fully on-device.' },
  resume_proj_tutor:   { zh: 'AI 教育导师', en: 'AI Tutor' },
  resume_proj_tutor_tag: { zh: 'NWPU-CS 创新训练项目', en: 'NWPU-CS Innovation Project' },
  resume_proj_tutor_desc: { zh: 'Vue 3 + FastAPI + 知识图谱，两阶段流式对话（Function Calling 后台执行），JWT + bcrypt + IP 限流安全体系。', en: 'Vue 3 + FastAPI + knowledge graph. Two-phase streaming chat (Function Calling), JWT + bcrypt + IP rate-limiting security.' },
  resume_skills:       { zh: '技能', en: 'Skills' },

  // —— 项目 ——
  portfolio_title:   { zh: '项目', en: 'Portfolio' },
  filter_ai:         { zh: 'AI 应用', en: 'AI Apps' },
  filter_desktop:    { zh: '桌面应用', en: 'Desktop' },
  filter_learn:      { zh: '学习项目', en: 'Learning' },
  filter_select_placeholder: { zh: '选择分类', en: 'Select category' },
  proj_votek_cat:    { zh: '桌面应用 · 端侧桌面 AI IDE', en: 'Desktop · On-device AI IDE' },
  proj_tutor_cat:    { zh: 'AI 应用 · 知识图谱驱动的 AI 教育导师', en: 'AI App · Knowledge-graph AI tutor' },
  proj_kinvoice_cat: { zh: 'AI 应用 · vivo+南开 AIGC 大赛地区二等奖', en: 'AI App · AIGC contest regional 2nd prize' },
  proj_cnn_title:    { zh: '从零实现神经网络与 CNN', en: 'Neural Nets & CNN from Scratch' },
  proj_cnn_cat:      { zh: '学习项目 · 纯 NumPy 手写，MNIST 实战', en: 'Learning · Pure NumPy, MNIST practice' },

  // —— 文章 ——
  blog_title:          { zh: '文章', en: 'Blog' },
  blog_subscribe_text: { zh: '用 RSS 订阅最新文章，不错过每一次更新。', en: 'Subscribe via RSS to never miss an update.' },
  blog_subscribe_btn:  { zh: '订阅 RSS', en: 'Subscribe RSS' },
  blog_cat_essay:      { zh: '随笔', en: 'Essay' },
  blog1_title:         { zh: '技术不是中立的：短视频的阶级压迫性', en: 'Tech Is Not Neutral: The Class Oppression of Short Video' },
  blog1_text:          { zh: '技术有倾向，短视频的倾向是阶级压迫。', en: 'Technology has a bias — short video’s bias is class oppression.' },
  blog2_title:         { zh: '男女对立：一场所有人都输的战争', en: 'Gender Antagonism: A War Everyone Loses' },
  blog2_text:          { zh: '性别议题已经从「讨论问题」变成「表演愤怒」，没有人赢只有伤。', en: 'Gender issues went from "discussing problems" to "performing anger" — nobody wins, everyone hurts.' },
  blog3_title:         { zh: '不一样的普通人：从标签到锚点', en: 'An Ordinary Person, Differently: From Labels to Anchors' },
  blog3_text:          { zh: '我们既渴望与众不同，又不想承认自己是七十亿分之一。', en: 'We crave being different, yet refuse to admit we’re one of seven billion.' },

  // —— 联系 ——
  contact_title:     { zh: '联系', en: 'Contact' },
  contact_form_title:{ zh: '联系我', en: 'Get in Touch' },
  contact_text:      { zh: '欢迎交流 AI 应用、Agent、桌面开发或合作事宜。最快的方式是直接发邮件，我会在 1-2 个工作日内回复。', en: 'Happy to talk about AI apps, Agents, desktop dev or collaboration. Email is the fastest way — I usually reply within 1-2 business days.' },

  // —— 爱好 ——
  hobbies_title:       { zh: '爱好', en: 'Hobbies' },

  // —— 科技树 ——
  tree_back:           { zh: '返回', en: 'Back' },
  tree_search_placeholder: { zh: '搜索节点…', en: 'Search nodes…' },
  tree_hint:           { zh: '点击节点查看详情 · 滚轮缩放 · 拖拽平移', en: 'Click a node for details · Scroll to zoom · Drag to pan' },
};

// 暴露为全局，供 i18n-app.js 使用
window.I18N_DICT = I18N_DICT;
