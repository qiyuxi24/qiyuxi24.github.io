/*==============================================*\
  #i18n.js — 全站中英字典
  每个 key 对应 index.html 中的 data-i18n="key" 元素。
  切换语言时查表替换，所有翻译集中在此，单一真相源。
  支持四种绑定：
    data-i18n="key"              → textContent
    data-i18n-html="key"         → innerHTML（可含 <strong> 等内联标签）
    data-i18n-placeholder="key"  → placeholder
    data-i18n-aria-label="key"   → aria-label
    data-i18n-title="key"        → title
\*==============================================*/
'use strict';

const I18N_DICT = {
  // —— 侧边栏 ——
  sidebar_title:  { zh: 'AI 应用开发者', en: 'AI Application Developer' },
  sidebar_contacts: { zh: 'Show Contacts', en: 'Show Contacts' },
  sidebar_edu:    { zh: '西北工业大学 · 人工智能', en: 'NWPU · Artificial Intelligence' },
  contact_email:  { zh: 'Email', en: 'Email' },
  contact_birthday: { zh: '生日', en: 'Birthday' },
  contact_location: { zh: '位置', en: 'Location' },
  contact_edu:      { zh: '学历', en: 'Education' },
  site_visits:    { zh: '本站累计', en: 'Total visits' },
  site_visits_times: { zh: '次访问', en: '' },

  // —— 语言 / 主题切换 ——
  lang_switch_aria: { zh: '切换中英文', en: 'Switch between Chinese and English' },
  theme_switch_aria: { zh: '切换深浅色主题', en: 'Toggle light / dark theme' },

  // —— 侧边栏社交图标（title / aria-label） ——
  social_gh_aria:     { zh: 'GitHub 主页（新窗口打开）', en: 'GitHub profile (opens in new tab)' },
  social_mail_title:  { zh: '邮箱', en: 'Email' },
  social_mail_aria:   { zh: '发邮件给 wojtek@mail.nwpu.edu.cn', en: 'Email wojtek@mail.nwpu.edu.cn' },
  social_bili_title:  { zh: '哔哩哔哩', en: 'Bilibili' },
  social_bili_aria:   { zh: '哔哩哔哩主页（新窗口打开）', en: 'Bilibili profile (opens in new tab)' },
  social_zhihu_title: { zh: '知乎', en: 'Zhihu' },
  social_zhihu_aria:  { zh: '知乎主页（新窗口打开）', en: 'Zhihu profile (opens in new tab)' },
  social_music_title: { zh: '网易云音乐', en: 'NetEase Cloud Music' },
  social_music_aria:  { zh: '网易云音乐主页（新窗口打开）', en: 'NetEase Music profile (opens in new tab)' },
  social_douyin_title:{ zh: '抖音', en: 'Douyin' },
  social_douyin_aria: { zh: '抖音主页（新窗口打开）', en: 'Douyin profile (opens in new tab)' },
  social_juejin_title:{ zh: '掘金', en: 'Juejin' },
  social_juejin_aria: { zh: '掘金主页（新窗口打开）', en: 'Juejin profile (opens in new tab)' },
  social_steam_aria:  { zh: 'Steam 主页（新窗口打开）', en: 'Steam profile (opens in new tab)' },
  social_linkedin_aria: { zh: 'LinkedIn 主页（链接待补）', en: 'LinkedIn profile (link TBD)' },
  social_yt_aria:     { zh: 'YouTube 频道（新窗口打开）', en: 'YouTube channel (opens in new tab)' },

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
  proj_kinvoice_title:{ zh: '家语 AI / KinVoice', en: 'KinVoice · Companion AI' },
  proj_kinvoice_cat: { zh: 'AI 应用 · vivo+南开 AIGC 大赛地区二等奖', en: 'AI App · AIGC contest regional 2nd prize' },
  proj_cnn_title:    { zh: '从零实现神经网络与 CNN', en: 'Neural Nets & CNN from Scratch' },
  proj_cnn_cat:      { zh: '学习项目 · 纯 NumPy 手写，MNIST 实战', en: 'Learning · Pure NumPy, MNIST practice' },

  // —— 文章 ——
  blog_title:          { zh: '文章', en: 'Blog' },
  blog_subscribe_text: { zh: '用 RSS 订阅最新文章，不错过每一次更新。', en: 'Subscribe via RSS to never miss an update.' },
  blog_subscribe_btn:  { zh: '订阅 RSS', en: 'Subscribe RSS' },
  // 以下为动态渲染（content/posts/index.json）的兜底文案
  blog_pinned:         { zh: '置顶 · 长期更新', en: 'Pinned · Evergreen' },
  blog_empty:          { zh: '暂无文章。', en: 'No posts yet.' },
  blog_untitled:       { zh: '未命名文章', en: 'Untitled post' },
  blog_cat_default:    { zh: '随笔', en: 'Essay' },
  blog_no_date:        { zh: '未设置日期', en: 'No date' },
  blog_load_fail:      { zh: '文章列表加载失败，请检查 content/posts/index.json。', en: 'Failed to load posts. Check content/posts/index.json.' },
  blog_file_hint:      { zh: '本地直接打开 HTML 无法加载文章列表（浏览器安全限制）。请部署到 GitHub Pages，或双击 start-local.bat 启动本地服务器。', en: 'Opening the HTML directly cannot load posts (browser security). Deploy to GitHub Pages, or run start-local.bat to serve locally.' },

  // —— 联系 ——
  contact_title:     { zh: '联系', en: 'Contact' },
  contact_form_title:{ zh: '联系我', en: 'Get in Touch' },
  contact_text:      { zh: '欢迎交流 AI 应用、Agent、桌面开发或合作事宜。最快的方式是直接发邮件，我会在 1-2 个工作日内回复。', en: 'Happy to talk about AI apps, Agents, desktop dev or collaboration. Email is the fastest way — I usually reply within 1-2 business days.' },
  contact_note:      { zh: '本站由 AI 协助搭建。与多数个人博客和主页一样，让信息长期保持同步、持续更新并不容易——这类站点往往只有很短的活跃生命周期。若内容滞后或有疏漏，敬请见谅；还有不少细节需要手工打磨，只能期待未来的更新了。', en: 'This site was built with the help of AI. As with most personal blogs and homepages, keeping information in sync and continuously updated isn\u2019t easy — such sites tend to have only a short active lifespan. Please bear with any outdated details; much still needs hand-polishing, which can only be tackled in future updates.' },

  // —— 爱好 ——
  hobbies_title:       { zh: '爱好', en: 'Hobbies' },
  // 引言
  hobbies_intro_quote: { zh: '"读史使人明智，写作使人清醒。"', en: '"Reading history makes one wise; writing keeps one clear-headed."' },
  hobbies_intro_text:  { zh: '精神导师是 <strong>帅健翔</strong>、<strong>林语堂</strong>、<strong>毛泽东</strong>、<strong>塔勒布</strong> 这一挂——重思辨、重体系、重不确定性，这些也潜移默化地塑造了我的思维方式。', en: 'Mentors: <strong>Shuai Jianxiang</strong>, <strong>Lin Yutang</strong>, <strong>Mao Zedong</strong>, <strong>Taleb</strong> — they prize reasoning, systems and uncertainty, which quietly shaped my thinking.' },
  // 板块导航
  hobbies_nav_aria:    { zh: '板块目录', en: 'Section index' },
  hobbies_nav_reading: { zh: '阅读', en: 'Reading' },
  hobbies_nav_games:   { zh: '游戏', en: 'Games' },
  hobbies_nav_music:   { zh: '音乐', en: 'Music' },
  hobbies_nav_create:  { zh: '创作', en: 'Creating' },
  hobbies_nav_sport:   { zh: '运动', en: 'Sports' },
  hobbies_nav_record:  { zh: '知识记录', en: 'Note-taking' },
  // 阅读
  hobbies_reading_title: { zh: '阅读', en: 'Reading' },
  hobbies_reading_desc:  { zh: '历史、传记、哲学为主，量大且成体系。按主题分好了文件夹，点开一层层看。', en: 'History, biography and philosophy — heavy and systematic. Books are filed by topic; open the folders to browse.' },
  hobby_podcast_title: { zh: '播客', en: 'Podcast' },
  hobby_podcast_text:  { zh: '放松方式之一，也在考虑自己做一档。想聊的话题之一：二战。', en: 'One way to unwind — and I\u0027m considering hosting one myself. A topic I\u0027d love to cover: WWII.' },
  // 游戏
  hobbies_games_title: { zh: '游戏', en: 'Games' },
  hobbies_games_desc:  { zh: '策略类为主，图的是历史沉浸，不是竞技。', en: 'Strategy games for historical immersion, not competition.' },
  hobby_hoi4_title:    { zh: 'HOI4 · 钢铁雄心4', en: 'HOI4 · Hearts of Iron IV' },
  hobby_hoi4_text:     { zh: '二战战略游戏。玩 5 小时腻了于是删了 —— 我管这叫"多巴胺代谢"。运营能力一般，玩的是历史沉浸。', en: 'A WWII strategy game. Got bored after 5 hours and uninstalled — I call that "dopamine metabolism". My play is mid; what I enjoy is the historical immersion.' },
  hobby_kards_title:   { zh: 'KARDS · 二战卡牌', en: 'KARDS · WWII card game' },
  hobby_kards_text:    { zh: '二战主题卡牌游戏，和 HOI4 一脉相承的历史情怀。', en: 'A WWII-themed card game with the same historical feel as HOI4.' },
  hobby_csgo_title:    { zh: 'CSGO', en: 'CSGO' },
  hobby_csgo_text:     { zh: '150 小时，室友入坑才跟着玩的。竞技性作品，但我的重心始终在历史题材上。', en: '150 hours, picked up because my roommate was into it. Competitive, but my heart stays with history.' },
  hobby_steam_link:    { zh: 'Steam 主页 ↗', en: 'Steam profile ↗' },
  // 音乐
  hobbies_music_title: { zh: '音乐', en: 'Music' },
  hobbies_music_desc:  { zh: '网易云重度用户，德语歌收藏是一大特色。', en: 'Heavy NetEase Cloud Music user — my German-song collection is a signature.' },
  hobby_german_title:  { zh: '德语歌收藏', en: 'German song collection' },
  hobby_german_text:   { zh: '和二战历史一脉相承的音乐品味。德语歌收藏是我的一个辨识度标签。', en: 'Music taste in line with WWII history. A recognizable tag of mine.' },
  hobby_netease_link:  { zh: '网易云主页 ↗', en: 'NetEase profile ↗' },
  hobby_piano_title:   { zh: '钢琴', en: 'Piano' },
  hobby_piano_text:    { zh: '正在啃《城南花已开》的左右手合并 —— 从单音到和声的一小步。', en: 'Learning to combine both hands for "Chengnan Huayikai" — a small step from single notes to harmony.' },
  // 创作
  hobbies_create_title: { zh: '创作', en: 'Creating' },
  hobbies_create_desc:  { zh: '输出创造是我的主战场。', en: 'Producing and creating is my main arena.' },
  hobby_wechat_title:   { zh: '写公众号 · 同州禹斋', en: 'WeChat blog · Tongzhou Yuzhai' },
  hobby_wechat_text:    { zh: '祛魅、社会观察这类思考型文章。把想法落成文字，是我表达的主阵地。', en: 'Thought pieces on disenchantment and social observation. Turning ideas into text is my main outlet.' },
  hobby_cocktail_title: { zh: '调酒', en: 'Cocktail making' },
  hobby_cocktail_text:  { zh: '输出型爱好。目标清单上有一条：调一杯原创鸡尾酒并命名。', en: 'A creative hobby. On my list: invent an original cocktail and name it.' },
  hobby_perfume_title:  { zh: '调香', en: 'Perfumery' },
  hobby_perfume_text:   { zh: '自学的，不是玩票。下一步想摸专业调香师的原料库。', en: 'Self-taught, not just a hobby. Next step: get into a professional perfumer\u0027s raw-material library.' },
  hobby_poetry_title:   { zh: '写诗', en: 'Poetry' },
  hobby_poetry_text:    { zh: '写过《山》，考虑投稿。', en: 'Wrote "The Mountain"; considering submitting it.' },
  hobby_coding_title:   { zh: 'Coding', en: 'Coding' },
  hobby_coding_text:    { zh: '既是职业方向也是兴趣。GitHub 上有 11 个公开仓库，把每个想法变成能跑的东西。', en: 'Both career and interest. 11 public repos on GitHub — turning every idea into something that runs.' },
  hobby_github_link:    { zh: 'GitHub ↗', en: 'GitHub ↗' },
  // 运动
  hobbies_sport_title: { zh: '运动', en: 'Sports' },
  hobbies_sport_desc:  { zh: '动静之间，保持身体的在场。', en: 'Between stillness and motion, staying present in my body.' },
  hobby_badminton_title: { zh: '羽毛球', en: 'Badminton' },
  hobby_badminton_text:  { zh: '常打的球类运动，节奏快、反应快。', en: 'My regular racket sport — fast pace, fast reflexes.' },
  hobby_huashan_title: { zh: '夜爬华山', en: 'Night climb of Mount Hua' },
  hobby_huashan_text:  { zh: '高中暑假两次，和同学，登南峰看日出。凌晨的群山和日出，是记忆里最亮的一笔。', en: 'Twice in high-school summer with friends — summiting South Peak for sunrise. Dawn over the mountains is my brightest memory.' },
  // 知识记录
  hobbies_record_title: { zh: '知识记录', en: 'Note-taking' },
  hobbies_record_desc:  { zh: '写日记反思自己，还想把日记和对话电子化，搭一个"第二大脑"。', en: 'Journaling to reflect, and wanting to digitize diaries and conversations into a "second brain".' },
  hobby_diary_title:    { zh: '写日记 · 自我记录', en: 'Journaling · self-record' },
  hobby_diary_text:     { zh: '反思自己、记录轨迹。这不只是习惯，更是自我对话的方式。', en: 'Reflection and record — not just a habit but a way of talking to myself.' },
  hobby_second_brain_title: { zh: '第二大脑 · RAG 项目', en: 'Second Brain · RAG project' },
  hobby_second_brain_text:  { zh: '想把日记和对话电子化，用 RAG 搭"第二大脑"。这已经不只是爱好了 —— 是项目雏形。', en: 'Digitizing diaries and chats into a RAG-powered "second brain". Beyond a hobby now — it\u0027s a project prototype.' },

  // —— 爱好书单树（hobbies.js 动态渲染） ——
  tree_search_books:   { zh: '搜索书名…', en: 'Search books…' },
  tree_search_books_aria: { zh: '搜索书名', en: 'Search books' },
  tree_shelves:        { zh: '已读书单 · 按主题分类', en: 'Read · by topic' },
  tree_mentors:        { zh: '精神导师', en: 'Mentors' },
  tree_featured:       { zh: '精选书目', en: 'Featured' },

  // —— GitHub 总览（github-stats.js 动态渲染） ——
  gh_overview_fail:    { zh: 'GitHub 数据暂时无法同步（API 限流），稍后刷新页面即可重试。', en: 'GitHub data temporarily unavailable (API rate limit). Refresh later to retry.' },
  gh_stat_repos:       { zh: '公开仓库', en: 'Public repos' },
  gh_stat_followers:   { zh: '关注者', en: 'Followers' },
  gh_stat_stars:       { zh: '累计 Star', en: 'Total stars' },
  gh_langs_title:      { zh: '常用语言', en: 'Top languages' },

  // —— 科技树 ——
  tree_back:           { zh: '返回', en: 'Back' },
  tree_search_placeholder: { zh: '搜索节点…', en: 'Search nodes…' },
  tree_hint:           { zh: '点击节点查看详情 · 滚轮缩放 · 拖拽平移', en: 'Click a node for details · Scroll to zoom · Drag to pan' },
};

// 暴露为全局，供 i18n-app.js 使用
window.I18N_DICT = I18N_DICT;
