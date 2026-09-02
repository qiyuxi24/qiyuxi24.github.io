'use strict';

/**
 * tree-data.js — 科技树数据（节点/连线），位于 assets/data/（纯数据区）。
 * 数据驱动，改这里即可增删节点，无需改 HTML。
 * 渲染逻辑与配色工具 hexFromHsl 见 assets/js/tree-render.js。
 */

window.TreeData = {
    name: '佀佳超',
    subtitle: 'AI 应用开发者',
    desc: '西北工业大学 · 人工智能专业在读，把每个想法变成能跑的东西。',
    branches: [
      {
        name: '技术栈', icon: '⚙', hue: 45,
        desc: '开发中不断点亮的能力树',
        md: '' +
          '## 我的技术栈\n\n' +
          '从底层到应用，一路点亮的能力树。核心路径是 **Python → 深度学习 → 端侧应用**。\n\n' +
          '> 信奉：*项目 + 文档 > 看书*，边做边学。\n\n' +
          '![技术栈示意图](./assets/images/icon-dev.svg)\n\n' +
          '### 语言谱系\n\n' +
          '- **Python**：主力，深度学习 / 后端\n' +
          '- **C / C++**：系统基础\n' +
          '- **Rust / Tauri**：桌面端\n' +
          '- **Vue 3 / FastAPI**：全栈 Web\n',
        children: [
          { name: 'Python', hue: 45, desc: '深度学习、后端脚本主力语言', level: 4,
            md: '## Python\n\n深度学习与后端的主力语言，几乎所有 AI 项目都从它开始。\n\n- NumPy 手写神经网络\n- FastAPI 后端\n- 数据处理与脚本\n\n```python\ndef hello():\n    return "AI 应用开发者"\n```' },
          { name: 'C / C++', hue: 45, desc: '系统级基础，Tauri/Rust 之前的功底', level: 3,
            md: '## C / C++\n\n系统级编程基础，理解内存与性能的起点。\n\n### 为什么重要\n\nTauri / Rust 桌面开发之前，靠它打下的底层功底。' },
          { name: 'Rust / Tauri', hue: 45, desc: '端侧 AI IDE 的桌面层，~5MB 安装包', level: 3,
            md: '## Rust / Tauri\n\n端侧 AI IDE（Votek）的桌面层，安装包只有 ~5MB，纯本地运行。\n\n| 技术 | 用途 |\n| --- | --- |\n| Tauri v2 | 桌面壳 |\n| Rust | 后端逻辑 |\n| React 19 | 前端 UI |' },
          { name: 'Vue 3', hue: 45, desc: 'AI 教育系统前端', level: 3,
            md: '## Vue 3\n\nAI 教育系统（AI-tutor）的前端，配合知识图谱做对话式学习。' },
          { name: 'FastAPI', hue: 45, desc: 'JWT + 限流 + SSE 流式后端全套', level: 3,
            md: '## FastAPI\n\nPython 异步后端，JWT 认证 + IP 限流 + SSE 流式对话全套。' },
          { name: '深度学习', hue: 45, desc: '纯 NumPy 手写 CNN，MNIST 实战', level: 3,
            md: '## 深度学习\n\n纯 NumPy 手写神经网络与 CNN，MNIST 实战。\n\n![CNN 项目](./assets/images/project-4.png)\n\n- 前向 / 反向传播\n- 卷积层从零实现\n- MNIST 手写识别' },
          { name: 'PyTorch', hue: 45, desc: '正在学习的下一站', level: 2,
            md: '## PyTorch\n\n深度学习框架的下一站，正在学习中。' },
        ]
      },
      {
        name: '爱好', icon: '❤', hue: 200,
        desc: '驱动我不断折腾的东西',
        md: '## 我的爱好\n\n驱动我不断折腾的原动力。\n\n- **写代码**：项目 + 文档 > 看书\n- **折腾 AI**：Agent、端侧模型、工具链\n- **分享**：B站 / 知乎记录踩坑\n- **阅读**：技术与非技术都看',
        children: [
          { name: '写代码', hue: 200, desc: '项目 + 文档 > 看书', level: 4,
            md: '## 写代码\n\n信奉「项目 + 文档 > 看书」，把每个想法变成能跑的东西。' },
          { name: '折腾 AI', hue: 200, desc: 'Agent、端侧模型、工具链', level: 4,
            md: '## 折腾 AI\n\nAgent、端侧模型、工具链，探索 AI 应用的下一个可能。' },
          { name: '分享', hue: 200, desc: 'B站 / 知乎记录踩坑与心得', level: 3,
            md: '## 分享\n\nB站 / 知乎记录踩坑与心得，把知识沉淀下来。' },
          { name: '阅读', hue: 200, desc: '技术与非技术的书都看', level: 3,
            md: '## 阅读\n\n技术与非技术的书都看，保持输入。' },
        ]
      },
      {
        name: '经历', icon: '★', hue: 300,
        desc: '一路走来的里程碑',
        md: '## 我的经历\n\n一路走来的里程碑节点。\n\n- 西工大 AI 专业在读\n- AIGC 大赛地区二等奖\n- NWPU-CS 创新项目\n- AI+教育大赛备赛中',
        children: [
          { name: '西工大 AI 专业', hue: 300, desc: '2025 — 2029，AI 应用方向', level: 4,
            md: '## 西工大 · 人工智能\n\n2025 — 2029，AI 应用方向，主攻大模型应用、Agent 与桌面软件开发。' },
          { name: 'AIGC 大赛二等奖', hue: 300, desc: 'vivo+南开 AIGC 大赛地区二等奖', level: 4,
            md: '## AIGC 大赛 · 地区二等奖\n\nvivo + 南开 AIGC 大赛，参赛作品 **KinVoice（家语 AI）**。' },
          { name: 'NWPU-CS 创新项目', hue: 300, desc: 'AI 教育导师，知识图谱驱动', level: 4,
            md: '## NWPU-CS 创新项目\n\nAI 教育导师（AI-tutor），知识图谱驱动。' },
          { name: 'AI+教育大赛', hue: 300, desc: '中国教育技术协会赛事，备赛中', level: 3,
            md: '## AI+教育大赛\n\n中国教育技术协会「AI+教育」创新应用技能大赛，大学生 OPC 创新创业 AI Agent 赛道，备赛中。' },
        ]
      },
      {
        name: '项目', icon: '🚀', hue: 160,
        desc: '让想法落地的作品',
        md: '## 我的项目\n\n让想法落地的作品合集。\n\n> 每一个项目都是一次「从想法到能跑」的完整闭环。',
        children: [
          { name: 'Votek', hue: 160, desc: '端侧桌面 AI IDE，纯本地运行', level: 4,
            md: '## Votek · 端侧桌面 AI IDE\n\nTauri v2 + React 19 打造的端侧 AI IDE，安装包只有 ~5MB，纯本地运行。\n\n![Votek 界面](./assets/images/project-1.jpg)\n\n### 核心能力\n\n- 流式对话\n- 多模型一键切换\n- MCP 服务器管理\n- Skills 技能市场\n- 内置浏览器\n\n```bash\n# 端侧运行，数据不出本地\nvotek\n```\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/Agent)' },
          { name: 'AI-tutor', hue: 160, desc: '两阶段流式对话的教育导师', level: 4,
            md: '## AI-tutor · AI 教育导师\n\nVue 3 + FastAPI + 知识图谱，两阶段流式对话的 AI 教育导师。\n\n![AI-tutor](./assets/images/project-2.png)\n\n### 技术亮点\n\n- Function Calling 后台执行\n- JWT + bcrypt + IP 限流安全体系\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/AI-tutor)' },
          { name: 'KinVoice', hue: 160, desc: '家语 AI，陪伴式对话 + 经验卡片', level: 4,
            md: '## KinVoice · 家语 AI\n\n陪伴式 AI 对话应用，NVC 四要素拆解 + 经验卡片沉淀。\n\n![KinVoice](./assets/images/project-3.jpg)\n\n- 陪伴式对话\n- 经验卡片 CRUD\n- NVC 非暴力沟通模型\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/KinVoice)' },
          { name: 'CNN-learning', hue: 160, desc: '从零手写神经网络的开源课程', level: 4,
            md: '## CNN-learning · 从零实现神经网络\n\n纯 NumPy 手写神经网络与 CNN 的开源课程。\n\n![CNN 课程](./assets/images/project-4.png)\n\n### 内容\n\n- 8 课 NumPy 从零实现（L01-L08）\n- MNIST 实战\n- MIT 协议开源\n\n[→ GitHub 仓库](https://github.com/qiyuxi24/CNN-learning)' },
        ]
      },
    ]
  };
