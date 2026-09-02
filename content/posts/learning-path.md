---
title: 计算机学习路线 · 我的资源地图（持续更新）
slug: learning-path
date: 2026-09-02
category: 学习
tags: ["学习路线", "资源清单", "CS", "AI"]
summary: 我在 CS / AI 方向学过与想学的资源地图：课程、书、仓库、视频链接。常青文章，按需追加。
cover: ./assets/images/blog-6.jpg
published: true
---

# 计算机学习路线 · 我的资源地图（持续更新）

> **这是一篇常青文章。** 我会随着学习推进不断在下方追加、修订、移除条目。
> 最近一次更新：**2026-09-02**（改用原生任务列表）

## 0. 阅读说明

- **状态标记**（行首）：`[x]` 学过 ｜ `[ ]` 待学/未学
- **资源格式**：尽量用官网/官方仓库/稳定链接；视频首选课程主页，B 站/YouTube 搬运由我自己确认再写
- **如何追加**：在对应板块用一条 markdown 任务列表追加，学过的写 `[x]`，未学的写 `[ ]`

> 资源条目模板：
>
> ```
> - [x] 资源名（作者/平台） 一句话理由 — 链接
> ```

---

## 1. 地基与心法

CS / AI 学到深处，地基比任何时髦框架都重要。

- [X]  **The Missing Semester of Your CS Education（MIT 6.S595）** 教你用工具的"工具课"，命令行、shell、vim、git、调试一次过完 — [官网](https://missing.csail.mit.edu/)
- [X]  **CS50（Harvard）** 经典入门课，David Malan 讲课一流 — [cs50.harvard.edu](https://cs50.harvard.edu/x/)
- [X]  **《Computer Systems: A Programmer's Perspective》（CSAPP）** 程序在机器里到底怎么跑 — [CMU 15-213 主页](https://www.cs.cmu.edu/~213/)、[B 站 CSAPP 重点导读](https://www.bilibili.com/video/BV1RK4y1R7Kf)
- [ ]  **许岑：如何成为有效的学习者** 讲"学完"比"学过"重要 — B 站 / 微信读书
- [X]  **How To Ask Questions The Smart Way（《提问的智慧》英文原版）** Eric S. Raymond 经典，学会在技术社区正确提问 — [英文仓库](https://github.com/selfteaching/How-To-Ask-Questions-The-Smart-Way)

## 2. 编程语言

不追新，精通两三门，远胜浅尝十门。

- [X]  **Python** 主力语言，做 AI / 后端 / 脚本都靠它 — [官方教程](https://docs.python.org/zh-cn/3/tutorial/)
- [X]  **Rust** Votek 桌面项目实战驱动；底层安全感的"重资产" — [The Rust Book](https://doc.rust-lang.org/book/)、[rustlings](https://github.com/rust-lang/rustlings)、[Cargo Book](https://doc.rust-lang.org/cargo/)
- [X]  **TypeScript** 前端 + Node 通用；JS 的工程化版 — [官方手册](https://www.typescriptlang.org/docs/)
- [X]  **C** 读 CSAPP、阅读 Python/Rust 源码前打底 — K&R《C 程序设计语言》
- [X]  **翁恺 C 语言（浙江大学）** 零基础入门 C 的经典中文课，MOOC 免费 — [程序设计入门——C语言](https://www.icourse163.org/course/ZJU-199001)

## 3. 数据结构与算法

- [X]  **《算法图解》（Grokking Algorithms）** 入门最丝滑
- [ ]  **MIT 6.006（OCW）** Erik Demaine 的算法课，体系完整 — [OCW](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/)
- [ ]  **《算法》（Sedgewick）** Java 描述，配合 Coursera 课程更佳
- [X]  **LeetCode（中文站）** 保持手感 + 面试储备 — [leetcode.cn](https://leetcode.cn/)
- [X]  **逊哥《数据结构（C 语言描述）》（B 站）** 通俗易懂、现场敲码实现的入门课 — [深入浅出《数据结构(C语言描述)》](https://www.bilibili.com/video/BV1FyH3zzEcW/)

## 4. 数学（AI 必备）

机器学习里"魔法"那部分基本就是这四件套。

- [X]  **线性代数** 工程派看 3Blue1Brown 入门；理论派啃 MIT 18.06 — [3B1B Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)、[MIT 18.06 OCW](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)
- [X]  **概率与统计** MIT 18.05 入门；《概率导论》（Bertsekas）当参考
- [X]  **微积分** 3Blue1Brown "Essence of Calculus" 足够
- [ ]  **凸优化** Boyd 的《Convex Optimization》——深度学习理论书出现频率极高 — [官方 PDF](https://web.stanford.edu/~boyd/cvxbook/)

## 5. 机器学习与深度学习

- [X]  **吴恩达 Machine Learning Specialization（Coursera）** AI 起点 — [链接](https://www.coursera.org/specializations/machine-learning-introduction)
- [X]  **《动手学深度学习》（D2L，李沐）** 中文社区最友好的实战教材 — [zh.d2l.ai](https://zh.d2l.ai/)、[GitHub](https://github.com/d2l-ai/d2l-zh)
- [X]  **PyTorch 官方教程** 与项目同步推进 — [pytorch.org/tutorials](https://pytorch.org/tutorials/)
- [X]  **《Neural Networks from Scratch in Python》（NNFS）** 纯 numpy 从零实现，自己的 [CNN-learning 仓库](https://github.com/qiyuxi24/CNN-learning) 已是其精神延续
- [ ]  **CS231n（Stanford 视觉）** [课程主页](http://cs231n.stanford.edu/)、YouTube
- [ ]  **fast.ai（Jeremy Howard）** 实战派，跟课程写代码最有效 — [course.fast.ai](https://course.fast.ai/)
- [X]  **Hugging Face NLP Course** 工业界最常打交道的库 — [huggingface.co/learn](https://huggingface.co/learn)

## 6. 计算机系统与底层

- [X]  **CSAPP（同上）** 贯穿操作系统、组成、网络的"集大成者"
- [X]  **《Operating Systems: Three Easy Pieces》（OSTEP）** 操作系统的最佳免费教材 — [ostep.org](https://pages.cs.wisc.edu/~remzi/OSTEP/)
- [ ]  **Nand2Tetris** 11 周从与非门写到俄罗斯方块，建立"机器也是人写的"直觉 — [nand2tetris.org](https://www.nand2tetris.org/)
- [ ]  **MIT 6.S081（Operating System Engineering）** xv6 源码级 OS 课 — [官网](https://pdos.csail.mit.edu/6.S081/)
- [X]  **《程序员的自我修养》（同名两本，勿混淆）** ①《链接、装载与库》（俞甲子/石凡/潘爱民，电子工业出版社）：编译/链接/装载底层经典 — [看云在线](https://www.kancloud.cn/homing/book1/1655068)；②《写给程序员的思考书》（陈逸鹤，清华大学出版社）：职业发展与软技能 — [清华大学出版社](http://www.tup.tsinghua.edu.cn/booksCenter/book_07251101.html)

## 7. 工程与工具

- [X]  **Git** [Pro Git（中文）](https://git-scm.com/book/zh/v2) + [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN)（交互练习）
- [X]  **Linux 命令行 / Shell** 鸟哥的 Linux 私房菜做字典 + 《Linux 命令行与 shell 脚本编程大全》系统 — [linux.vbird.org](https://linux.vbird.org/)
- [X]  **Docker** [官方 docs](https://docs.docker.com/)，跟着 3B1B 视频化入门也行
- [ ]  **Vim / Neovim** The Missing Semester 上手后，配合 `vimtutor` + 《Practical Vim》
- [ ]  **正则表达式** 《精通正则表达式》做字典，平时手练

## 8. Web 与全栈

- [ ]  **MDN Web Docs** Web 世界的"事实标准" — [developer.mozilla.org](https://developer.mozilla.org/)
- [X]  **React 官方文档** 新的 React Docs 比老教程清晰太多 — [react.dev](https://react.dev/)
- [X]  **Vue 3 官方文档** 直观、上手快 — [cn.vuejs.org](https://cn.vuejs.org/)
- [X]  **FastAPI 文档** 后端主力 — [fastapi.tiangolo.com](https://fastapi.tiangolo.com/zh/)
- [X]  **Tauri 官方文档** 桌面端轻量级方案，Votek 即基于此 — [tauri.app](https://tauri.app/)

## 9. 数据库

- [ ]  **《SQL 必知必会》** 入门最快的小册子
- [X]  **SQLBolt** 交互式 SQL 练习 — [sqlbolt.com](https://sqlbolt.com/)
- [ ]  **CMU 15-445（Database Systems）** 进阶必看 — [15445.courses.cs.cmu.edu](https://15445.courses.cs.cmu.edu/fall2024/)
- [ ]  **Redis 官方文档** 缓存与简单 KV 场景

## 10. LLM / Agent 应用与进阶

这个方向是 2026 年最值得持续投入的"工程新边疆"。

- [X]  **Anthropic Engineering Blog** 业界最实在的 LLM 工程文章，没有之一 — [anthropic.com/engineering](https://www.anthropic.com/engineering)
- [X]  **Andrej Karpathy 系列视频** YouTube: "Let's build GPT" / "Intro to LLMs"；神经网络的"白话物理"
- [ ]  **《Hands-On Large Language Models》** Jay Alammar & Maarten Grootendorst
- [X]  **《Designing Machine Learning Systems》（Huyen Chip）** ML System 而非单模型，工程化视角
- [X]  **LLM Visualization** 直观看到 token / attention — [bbycroft.net/llm](https://bbycroft.net/llm)
- [ ]  **DeepLearning.AI Short Courses** 短小精悍，每节 1~2 小时，能跑代码 — [deeplearning.ai/short-courses](https://www.deeplearning.ai/short-courses/)

## 11. 学以致用 · 项目沉淀

> "项目 + 文档 > 看书"。下面是学完一段之后落地的产物。

- [X]  **CNN-learning**（已公开） 8 课纯 NumPy 实现深度学习 — [github.com/qiyuxi24/CNN-learning](https://github.com/qiyuxi24/CNN-learning)
- [X]  **Votek**（桌面 AI IDE） Rust + Tauri + React 实战，集成 MCP / Skills / Code Server — 仓库待整理公开
- [X]  **TutorAgent** 上传知识库 + 混合检索（向量 + BM25）的 RAG 助教
- [X]  **KinVoice** NVC 沟通陪伴 AI（FastAPI + LLM）
- [X]  **个人主页（本站）** 静态站 + 发布工作台，工作流的玩具与实验场

## 12. 更新日志

- **2026-09-02**：建档首版。搭好骨架，覆盖 12 个板块；后续按需追加。
- **2026-09-02**：状态表示改为行首勾选符号（☑ 学过 / ◐ 在学 / ☐ 待学），去掉行末状态标签。
- **2026-09-02**：追加翁恺 C 语言、逊哥数据结构、提问的智慧英文仓库、《程序员的自我修养》两本同名书（均已标记学过）；CSAPP 条目加入 B 站重点导读视频。
- **2026-09-02**：改为两分法 —— 去掉「在学 ◐」，只保留 ☑ 学过 / 无标记待学，原「在学」条目并入「学过」。
- **2026-09-02**：改用原生任务列表 `[x]` / `[ ]`，去掉 ☑ 符号与条目分隔符「｜」。
