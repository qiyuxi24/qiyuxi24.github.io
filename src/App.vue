<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
    <el-header class="app-header">
      <div class="header-content">
        <MagicStick style="width: 1.5em; height: 1.5em; margin-right: 10px; color: #409EFF;" />
        <h1>我的AI学习导师</h1>
        <!-- UI位置变更说明：
             - 主题切换按钮：从header右侧移动到最上层（z-index: 1000），位置固定在右上角
             - 设置按钮：从header右侧移动到最上层（z-index: 1000），位置固定在右上角，位于主题切换按钮左侧
             - 按钮颜色：改为蓝色（#409EFF）
        -->
        <div class="header-actions">
          <!-- 按钮已移至最上层，见下方.floating-actions -->
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <!-- 左侧边栏：已清空，预留空间 -->
      <!-- UI位置变更说明：
           - 原"学习引导"卡片：已删除
           - 原"本课要点"卡片：已删除
           - 侧边栏现在为空，仅保留布局空间
      -->
      <!-- 左侧边栏：对话历史列表 -->
      <el-aside :width="sidebarCollapsed ? '60px' : '280px'" class="guide-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
        <!-- 折叠/展开按钮 -->
        <div class="sidebar-toggle" @click="toggleSidebar" :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'">
          <el-button :icon="sidebarCollapsed ? Expand : Fold" circle size="small" />
        </div>

        <!-- 对话历史列表 -->
        <div class="chat-history-panel" v-show="!sidebarCollapsed">
          <!-- 新建对话按钮 -->
          <div class="new-chat-button">
            <el-button type="primary" :icon="Plus" @click="createNewChat" style="width: 100%;">
              新建对话
            </el-button>
          </div>

          <!-- 对话列表 -->
          <div class="chat-list">
            <div
              v-for="chat in chatHistory"
              :key="chat.id"
              :class="['chat-item', { 'active': chat.id === currentChatId }]"
              @click="switchChat(chat.id)"
            >
              <el-icon class="chat-icon"><ChatDotRound /></el-icon>
              <div class="chat-info">
                <div class="chat-title">{{ chat.title }}</div>
                <div class="chat-time">{{ formatChatTime(chat.updatedAt) }}</div>
              </div>
              <el-button
                :icon="Delete"
                circle
                size="small"
                text
                class="delete-chat-btn"
                @click="deleteChat(chat.id, $event)"
                title="删除对话"
              />
            </div>
          </div>
        </div>
      </el-aside>

      <!-- 主区域：对话区 -->
      <!-- UI位置变更说明：
           - 对话区域：宽度根据侧边栏状态自适应
           - 侧边栏为空后，主区域占据更多空间
      -->
      <el-main class="chat-main" :style="{ width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 300px)' }">
        <el-card class="chat-card">
          <!-- 消息展示区域 -->
          <div class="message-list" ref="messagesContainer">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message-item', message.role]"
            >
              <div class="message-avatar">
                <el-avatar v-if="message.role === 'ai'">
                  <MagicStick style="width: 1.5em; height: 1.5em;" />
                </el-avatar>
                <el-avatar v-else style="background-color: #67c23a;">
                  <User style="width: 1.3em; height: 1.3em;" />
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-meta">
                  <strong>{{ message.role === 'ai' ? 'AI导师' : '我' }}</strong>
                  <span class="message-time">{{ message.time }}</span>
                </div>
                <div 
                  class="message-text markdown-body" 
                  v-html="renderMarkdown(message.displayText || message.text)"
                ></div>
                <div v-if="message.isTyping" class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <!-- 关键节点暂停提示 -->
                <div v-if="message.isPaused && message.role === 'ai'" class="pause-prompt">
                  <el-divider content-position="left">
                    <el-icon><Pointer /></el-icon>
                    <span style="margin-left: 8px;">思考时间</span>
                  </el-divider>
                  <div class="pause-content">
                    <p>请先理解上面的内容，思考一下：</p>
                    <ul>
                      <li>这个步骤的关键点是什么？</li>
                      <li>你理解了吗？有什么疑问？</li>
                    </ul>
                    <el-button 
                      type="primary" 
                      :icon="ArrowRight" 
                      @click="continueTyping(index)"
                      class="continue-button"
                    >
                      继续学习
                    </el-button>
                  </div>
                </div>
                <!-- AI消息特有的"追问"区域 -->
                <div v-if="message.role === 'ai' && message.followUp" class="follow-up">
                  <el-divider content-position="left">为了帮助你，请告诉我：</el-divider>
                  <div class="follow-up-questions">
                    <el-tag
                      v-for="(question, qIndex) in message.followUp"
                      :key="qIndex"
                      class="follow-up-question"
                      type="info"
                      @click="sendFollowUp(question)"
                    >
                      {{ question }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </el-card>
      </el-main>
    </el-main>

    <!-- 固定在底部的输入区域 -->
    <!-- UI位置变更说明：
         - 输入区域：固定在页面底部，根据侧边栏状态调整位置和宽度
         - 对话模式选项：显示在输入框上方，成行排列
    -->
    <div class="fixed-input-area" :style="{ left: sidebarCollapsed ? '80px' : '300px', width: sidebarCollapsed ? 'calc(100% - 100px)' : 'calc(100% - 320px)' }">
      <!-- 对话模式选项 -->
      <div class="chat-mode-selector">
        <div class="chat-mode-label">对话模式：</div>
        <el-radio-group v-model="chatMode" class="chat-mode-options">
          <el-radio label="引导问答" class="chat-mode-radio">引导问答</el-radio>
          <el-radio label="检测考验" class="chat-mode-radio">检测考验</el-radio>
          <el-radio label="即时回答" class="chat-mode-radio">即时回答</el-radio>
        </el-radio-group>
      </div>
      
      <div class="input-container">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="2"
          placeholder="请回答AI导师的问题，或提出你的疑问..."
          @keyup.enter.exact="sendMessage"
          class="message-input"
        />
        <el-button
          type="primary"
          :icon="ArrowRight"
          circle
          class="send-button"
          @click="sendMessage"
          :loading="isAiThinking"
          :disabled="!userInput.trim()"
        />
      </div>
    </div>

    <!-- 设置下拉菜单 -->
    <el-drawer
      v-model="showSettings"
      title="设置"
      direction="rtl"
      size="400px"
    >
      <div class="settings-drawer">
        <el-form label-width="100px">
          <el-form-item label="用户名">
            <el-input v-model="userName" placeholder="请输入你的名字" />
          </el-form-item>
          <el-form-item label="AI名称">
            <el-input v-model="aiName" placeholder="请输入AI导师名称" />
          </el-form-item>
          <el-divider />
          <!-- 对话模式选项已移至主界面输入框上方 -->
          <el-divider />
          <el-form-item label="API配置">
            <div style="margin-bottom: 10px; color: #909399; font-size: 0.85em;">
              ⚠️ 注意：将 API 密钥存储在前端存在安全风险，建议生产环境使用后端代理
            </div>
          </el-form-item>
          <el-form-item label="AccessKey ID">
            <el-input v-model="accessKeyId" placeholder="请输入 AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessKey Secret">
            <el-input v-model="accessKeySecret" type="password" placeholder="请输入 AccessKey Secret（将作为 API Key 使用）" show-password />
          </el-form-item>
          <el-form-item label="说明">
            <div style="color: #909399; font-size: 0.85em; line-height: 1.6;">
              • AccessKey Secret 将作为 API Key 用于认证<br/>
              • 如果只有 API Key，可以只填写 AccessKey Secret 字段<br/>
              • 配置后点击"保存设置"即可使用
            </div>
          </el-form-item>
          <el-divider />
          <el-form-item label="清空对话">
            <el-button type="danger" :icon="Delete" @click="clearMessages">清空当前对话记录</el-button>
          </el-form-item>
          <el-form-item label="导出对话">
            <el-button :icon="Download" @click="exportMessages">导出为JSON文件</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSettings" style="width: 100%;">保存设置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

    <!-- 浮动操作按钮：主题切换和设置 -->
    <!-- UI位置变更说明：
         - 位置：固定在页面右上角，位于所有内容之上
         - z-index: 1000，确保始终在最上层
         - 颜色：蓝色（#409EFF）
    -->
    <div class="floating-actions">
      <el-button
        :icon="Setting"
        circle
        class="floating-button settings-button"
        @click="showSettings = !showSettings"
        title="设置"
      />
      <el-button
        :icon="isInverted ? Sunny : Moon"
        circle
        class="floating-button theme-button"
        @click="toggleInvertTheme()"
        title="切换主题"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import markedKatex from 'marked-katex-extension'
import { useInvertTheme } from './composables/useInvertTheme'
import { useTypingEffect } from './composables/useTypingEffect'
import { callDashScopeAPI, convertMessagesToDashScopeFormat } from './composables/useDashScopeAPI'
import { readChatCache, writeChatCache, snapshotMessages } from './composables/useChatLocalCache'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  Promotion,
  User,
  Setting,
  Delete,
  Download,
  DocumentChecked,
  Collection,
  InfoFilled,
  Pointer,
  Monitor,
  RefreshRight,
  Sunny,
  Moon,
  Fold,
  Expand,
  ArrowRight,
  Plus,
  ChatDotRound
} from '@element-plus/icons-vue'

// ---------- Markdown 和代码高亮配置 ----------
marked.use(markedKatex({
  throwOnError: false,
  errorColor: '#cc0000',
  katexOptions: {
    throwOnError: false
  }
}))

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  breaks: true,
  gfm: true
})

// ---------- 主题取反（扫描所有文字/图片颜色并取反） ----------
// 取反范围用 html，确保 body/#app 背景也会一起反转，不会“露白”
const { isInverted, toggle: toggleInvertTheme } = useInvertTheme({ rootSelector: 'html' })

// ---------- 状态定义 ----------
const userInput = ref('')
const isAiThinking = ref(false)
const showSettings = ref(false)
const sidebarCollapsed = ref(false)
const userName = ref('学员')
const aiName = ref('AI导师')
const messagesContainer = ref(null)
const chatMode = ref('引导问答') // 对话模式：引导问答、检测考验、即时回答（单选）

// 对话历史管理
const chatHistory = ref([])
const currentChatId = ref(null)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 创建新对话
const createNewChat = () => {
  const newChatId = Date.now().toString()
  const newChat = {
    id: newChatId,
    title: '新对话',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  chatHistory.value.unshift(newChat)
  currentChatId.value = newChatId
  messages.length = 0
  messages.push({ ...initialMessage })
  saveChatHistory()
}

// 切换到指定对话
const switchChat = (chatId) => {
  const chat = chatHistory.value.find(c => c.id === chatId)
  if (chat) {
    currentChatId.value = chatId
    messages.length = 0
    if (chat.messages && chat.messages.length > 0) {
      const restoredMessages = chat.messages.map(msg => ({
        ...msg,
        displayText: msg.text,
        isTyping: false
      }))
      messages.push(...restoredMessages)
    } else {
      messages.push({ ...initialMessage })
    }
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 删除对话
const deleteChat = (chatId, event) => {
  event.stopPropagation()
  const index = chatHistory.value.findIndex(c => c.id === chatId)
  if (index !== -1) {
    chatHistory.value.splice(index, 1)
    saveChatHistory()
    // 如果删除的是当前对话，创建新对话
    if (currentChatId.value === chatId) {
      if (chatHistory.value.length > 0) {
        switchChat(chatHistory.value[0].id)
      } else {
        createNewChat()
      }
    }
  }
}

// 更新对话标题（根据第一条用户消息）
const updateChatTitle = (userMessage) => {
  if (currentChatId.value) {
    const chat = chatHistory.value.find(c => c.id === currentChatId.value)
    if (chat && chat.title === '新对话' && userMessage.trim()) {
      chat.title = userMessage.length > 20 ? userMessage.substring(0, 20) + '...' : userMessage
      chat.updatedAt = new Date().toISOString()
      saveChatHistory()
    }
  }
}

// 保存对话历史
const saveChatHistory = () => {
  try {
    // 更新当前对话的消息
    if (currentChatId.value) {
      const chat = chatHistory.value.find(c => c.id === currentChatId.value)
      if (chat) {
        chat.messages = snapshotMessages(messages)
        chat.updatedAt = new Date().toISOString()
      }
    }
    const result = writeChatCache({
      chatHistory: chatHistory.value,
      currentChatId: currentChatId.value
    })
    if (!result.success) {
      throw result.error
    }
  } catch (error) {
    console.error('保存对话历史失败:', error)
  }
}

// 加载对话历史
const loadChatHistory = () => {
  try {
    const cache = readChatCache()
    if (cache && Array.isArray(cache.chatHistory)) {
      chatHistory.value = cache.chatHistory
    }
    const savedChatId = cache?.currentChatId
    if (savedChatId && chatHistory.value.find(c => c.id === savedChatId)) {
      switchChat(savedChatId)
    } else if (chatHistory.value.length > 0) {
      switchChat(chatHistory.value[0].id)
    } else {
      createNewChat()
    }
  } catch (error) {
    console.error('加载对话历史失败:', error)
    createNewChat()
  }
}

// API 配置
// ⚠️ 安全提醒：请勿在此处硬编码 API 密钥，应在设置界面中配置
const accessKeyId = ref('')
const accessKeySecret = ref('')

// 引导步骤定义
const guideSteps = reactive([
  {
    title: '第一步：明确目标',
    description: '确定你要学习的核心概念',
    currentTarget: '请清晰描述你想学习什么'
  },
  {
    title: '第二步：评估起点',
    description: '了解你当前的知识水平',
    currentTarget: '请回答关于此概念的基础问题'
  },
  {
    title: '第三步：核心讲解',
    description: 'AI讲解关键知识点',
    currentTarget: '请仔细阅读AI提供的讲解'
  },
  {
    title: '第四步：练习验证',
    description: '通过练习巩固理解',
    currentTarget: '请尝试完成AI给出的练习'
  },
  {
    title: '第五步：总结反思',
    description: '回顾所学，查漏补缺',
    currentTarget: '请总结你学到的内容'
  }
])

const currentStepIndex = ref(0)

// 知识要点
const knowledgePoints = ref([
  '引导式问答',
  '分步拆解',
  '即时反馈',
  '适应性教学',
  '概念可视化'
])

// 对话消息
const initialMessage = {
  role: 'ai',
  text: '你好！我是你的AI学习导师。我将通过一系列引导性问题，帮助你循序渐进地掌握知识。我们现在从第一步开始：请告诉我，你今天想学习或深入了解什么概念？',
  displayText: '',
  isTyping: false,
  time: '10:00',
  followUp: [
    '我想学习机器学习的基本概念',
    '我想了解如何搭建一个网站',
    '我想深入理解什么是区块链'
  ]
}
initialMessage.displayText = initialMessage.text // 第一条消息直接显示

const messages = reactive([initialMessage])

// Markdown 渲染函数
const renderMarkdown = (text) => {
  return marked.parse(text || '')
}

// ---------- 方法定义 ----------
// 格式化对话时间
const formatChatTime = (timeString) => {
  const time = new Date(timeString)
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return time.toLocaleDateString()
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isAiThinking.value) return

  // 如果没有当前对话，创建新对话
  if (!currentChatId.value) {
    createNewChat()
  }

  // 1. 添加用户消息
  const userMsg = {
    role: 'user',
    text: userInput.value,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  messages.push(userMsg)
  
  // 更新对话标题
  updateChatTitle(userInput.value)
  
  // 保存消息到 localStorage
  saveMessagesToLocalStorage()
  saveChatHistory()
  
  const userQuestion = userInput.value
  userInput.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 2. AI 思考中
  isAiThinking.value = true
  
  try {
    // 3. 调用真实 API 生成 AI 回复
    let aiResponseText = ''
    let useFallback = false
    
    // 检查是否有配置 API Key（允许只填 Secret / 只填 ID 任意一种）
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:sendMessage',message:'before api key check',data:{messagesLength:messages.length,chatMode:chatMode.value,hasAccessKeyId:!!accessKeyId.value,hasAccessKeySecret:!!accessKeySecret.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (accessKeyId.value || accessKeySecret.value) {
      try {
        // 转换消息格式为 DashScope 格式，并根据模式添加系统提示词
        const dashScopeMessages = convertMessagesToDashScopeFormat(messages, chatMode.value)
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:sendMessage',message:'prepared dashscope messages',data:{dashScopeMessagesLength:dashScopeMessages.length,roles:dashScopeMessages.map(m=>m.role).slice(0,6)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:356',message:'before API call',data:{messagesLength:messages.length,dashScopeMessagesLength:dashScopeMessages.length,hasAccessKeyId:!!accessKeyId.value,hasAccessKeySecret:!!accessKeySecret.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // 调用 API
        const apiResponse = await callDashScopeAPI(
          dashScopeMessages,
          accessKeyId.value || null,
          accessKeySecret.value || null
        )
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:sendMessage',message:'dashscope api returned',data:{success:!!apiResponse?.success,hasText:!!apiResponse?.text,textLength:apiResponse?.text?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:363',message:'after API call',data:{success:apiResponse?.success,hasText:!!apiResponse?.text,textLength:apiResponse?.text?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        if (apiResponse.success && apiResponse.text) {
          aiResponseText = apiResponse.text
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:369',message:'API response format error',data:{success:apiResponse?.success,hasText:!!apiResponse?.text},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          throw new Error('API 返回的数据格式异常')
        }
      } catch (apiError) {
        console.error('API 调用失败:', apiError)
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:sendMessage',message:'dashscope api failed, fallback enabled',data:{errorName:apiError?.name,errorMessage:apiError?.message,chatMode:chatMode.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // API 调用失败，使用模拟回复作为后备方案
        useFallback = true
        ElMessage.warning(`API 调用失败: ${apiError.message}，已切换到模拟回复模式`)
      }
    } else {
      // 未配置 API Key，使用模拟回复
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:sendMessage',message:'no accessKeyId, using fallback',data:{hasAccessKeyId:!!accessKeyId.value,hasAccessKeySecret:!!accessKeySecret.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      useFallback = true
    }
    
    // 如果 API 调用失败或未配置，使用模拟回复
    if (useFallback) {
      const fallbackResponse = generateAIResponse(userQuestion)
      aiResponseText = fallbackResponse.text
    }
    
    // 构建 AI 响应对象
    const aiResponse = {
      role: 'ai',
      text: aiResponseText,
      displayText: '',
      isTyping: true,
      isPaused: false,
      typingEffect: null, // 存储打字机效果实例
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // 如果是模拟回复，保留追问选项；API 回复则根据内容生成简单追问
      followUp: useFallback ? generateAIResponse(userQuestion).followUp : [
        '能详细解释一下吗？',
        '能举个例子吗？',
        '还有其他的吗？'
      ]
    }
    
    const messageIndex = messages.push(aiResponse) - 1
    
    await nextTick()
    scrollToBottom()
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:404',message:'before creating typing effect',data:{messageIndex,messagesLength:messages.length,aiResponseTextLength:aiResponse.text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // 启动打字机效果
    const typingEffect = useTypingEffect()
    // 保存打字机效果实例到消息对象
    messages[messageIndex].typingEffect = typingEffect
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:407',message:'typingEffect instance created',data:{messageIndex,messagesLength:messages.length,chatMode:chatMode.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // 设置暂停回调（仅在引导问答模式下启用）
    const enablePause = chatMode.value === '引导问答'
    const onPause = enablePause ? () => {
      if (messages[messageIndex]) {
        messages[messageIndex].isPaused = true
        scrollToBottom()
      }
    } : null
    // 在引导问答模式下启用暂停，其他模式禁用
    typingEffect.start(aiResponse.text, 20, onPause, enablePause) // 20ms 每字符，引导问答模式带暂停回调
    
    // 更新消息的显示文本
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:411',message:'before setInterval',data:{messageIndex,messagesLength:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const updateInterval = setInterval(() => {
      if (messages[messageIndex]) {
        const displayTextBefore = messages[messageIndex].displayText
        messages[messageIndex].displayText = typingEffect.displayText.value
        messages[messageIndex].isTyping = typingEffect.isTyping.value
        messages[messageIndex].isPaused = typingEffect.isPaused.value
        // #region agent log
        if (messages[messageIndex].displayText !== displayTextBefore || !typingEffect.isTyping.value) {
          fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:416',message:'updateInterval tick',data:{messageIndex,messagesLength:messages.length,displayTextLength:messages[messageIndex].displayText.length,typingDisplayLength:typingEffect.displayText.value.length,isTyping:typingEffect.isTyping.value,isPaused:typingEffect.isPaused.value,msgIsTyping:messages[messageIndex].isTyping,msgIsPaused:messages[messageIndex].isPaused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        }
        // #endregion
        if (!typingEffect.isTyping.value && !typingEffect.isPaused.value) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:420',message:'clearing updateInterval',data:{messageIndex,messagesLength:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          clearInterval(updateInterval)
          // 打字完成，保存消息
          saveMessagesToLocalStorage()
        }
        scrollToBottom()
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:428',message:'messageIndex invalid in updateInterval',data:{messageIndex,messagesLength:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        clearInterval(updateInterval)
      }
    }, 20)
    
    // 4. 根据条件推进步骤（如果使用模拟回复）
    if (useFallback) {
      simulateStepProgress(userQuestion)
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error(`发送消息失败: ${error.message}`)
  } finally {
    isAiThinking.value = false
  }
}

// 发送预设的追问问题
const sendFollowUp = (question) => {
  userInput.value = question
  sendMessage()
}

// 继续显示暂停的消息
const continueTyping = (messageIndex) => {
  if (messages[messageIndex] && messages[messageIndex].typingEffect) {
    messages[messageIndex].typingEffect.resume()
    messages[messageIndex].isPaused = false
    // 继续更新显示
    const updateInterval = setInterval(() => {
      if (messages[messageIndex]) {
        messages[messageIndex].displayText = messages[messageIndex].typingEffect.displayText.value
        messages[messageIndex].isTyping = messages[messageIndex].typingEffect.isTyping.value
        messages[messageIndex].isPaused = messages[messageIndex].typingEffect.isPaused.value
        if (!messages[messageIndex].typingEffect.isTyping.value && !messages[messageIndex].typingEffect.isPaused.value) {
          clearInterval(updateInterval)
          saveMessagesToLocalStorage()
        }
        scrollToBottom()
      } else {
        clearInterval(updateInterval)
      }
    }, 20)
  }
}

// 生成AI回复（模拟函数，后续需替换为真实API调用）
const generateAIResponse = (userQuestion) => {
  const step = guideSteps[currentStepIndex.value]
  const responses = [
    `很好，你提到了“${userQuestion}”。这是学习${step.title}的重要起点。为了给你更有针对性的指导，你能具体说明一下：你之前对这个概念有哪些了解吗？`,
    `我注意到你在说“${userQuestion}”。根据这一步的目标“${step.currentTarget}”，我想请你思考一下：你认为这个概念中最关键的部分是什么？`,
    `基于你的回答“${userQuestion}”，我已经对你的理解有了初步了解。接下来，我将为你简要讲解核心部分。首先，这个概念通常包含以下几个要点...（此处为模拟讲解）`,
    `看起来你已经理解了基础部分。现在让我们通过一个小练习来巩固：如果让你用一句话向朋友解释“${userQuestion}”的核心，你会怎么说？`,
    `我们已经完成了主要的学习循环。基于我们刚才关于“${userQuestion}”的讨论，你现在是否可以总结出三个最重要的收获？`
  ]

  const followUpOptions = [
    ['你能举个例子吗？', '它和另一个相似概念有什么区别？', '我完全没基础，该怎么办？'],
    ['为什么它很重要？', '它不适用于什么情况？', '有哪些常见的误区？'],
    ['我可以用在哪里？', '第一步具体怎么做？', '能给我看段代码示例吗？'],
    ['我的答案准确吗？', '有没有更好的表达方式？', '还有其他的练习吗？'],
    ['我还有什么知识盲点？', '接下来该学什么？', '如何应用到实际中？']
  ]

  return {
    role: 'ai',
    text: responses[currentStepIndex.value] || '感谢你的回答。我们继续下一步的学习。',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    followUp: followUpOptions[currentStepIndex.value]
  }
}

// 模拟步骤推进逻辑
const simulateStepProgress = (userQuestion) => {
  // 简单的模拟逻辑：当用户输入较长，且当前步骤停留时间足够时，推进到下一步
  if (userQuestion.length > 10 && Math.random() > 0.7 && currentStepIndex.value < guideSteps.length - 1) {
    currentStepIndex.value++
  }
}

// 步骤控制
const nextStep = async () => {
  if (currentStepIndex.value < guideSteps.length - 1) {
    currentStepIndex.value++
    const stepMessage = {
      role: 'ai',
      text: `好的，我们已经完成【${guideSteps[currentStepIndex.value - 1].title}】，现在让我们进入【${guideSteps[currentStepIndex.value].title}】：${guideSteps[currentStepIndex.value].currentTarget}`,
      displayText: '',
      isTyping: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const messageIndex = messages.push(stepMessage) - 1
    
    await nextTick()
    scrollToBottom()
    
    // 启动打字机效果（根据模式决定是否启用暂停）
    const typingEffect = useTypingEffect()
    const enablePause = chatMode.value === '引导问答'
    typingEffect.start(stepMessage.text, 20, null, enablePause)
    
    const updateInterval = setInterval(() => {
      if (messages[messageIndex]) {
        messages[messageIndex].displayText = typingEffect.displayText.value
        messages[messageIndex].isTyping = typingEffect.isTyping.value
        if (!typingEffect.isTyping.value) {
          clearInterval(updateInterval)
        }
        scrollToBottom()
      }
    }, 20)
  }
}

const setCurrentStep = (index) => {
  if (index >= 0 && index < guideSteps.length) {
    currentStepIndex.value = index
  }
}

const resetSteps = async () => {
  currentStepIndex.value = 0
  messages.length = 0
  const resetMessage = {
    role: 'ai',
    text: '学习引导已重置。让我们重新开始。请告诉我，你今天想学习什么？',
    displayText: '',
    isTyping: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    followUp: ['我想学习机器学习', '我想了解如何搭建网站', '我想理解区块链']
  }
  const messageIndex = messages.push(resetMessage) - 1
  
  await nextTick()
  scrollToBottom()
  
  // 启动打字机效果（根据模式决定是否启用暂停）
  const typingEffect = useTypingEffect()
  const enablePause = chatMode.value === '引导问答'
  typingEffect.start(resetMessage.text, 20, null, enablePause)
  
  const updateInterval = setInterval(() => {
    if (messages[messageIndex]) {
      messages[messageIndex].displayText = typingEffect.displayText.value
      messages[messageIndex].isTyping = typingEffect.isTyping.value
      if (!typingEffect.isTyping.value) {
        clearInterval(updateInterval)
      }
      scrollToBottom()
    }
  }, 20)
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    })
  }
}

// 设置相关方法
const clearMessages = async () => {
  // 清空消息数组
  messages.length = 0
  
  // 添加初始消息
  const clearMessage = {
    role: 'ai',
    text: '对话已清空。我们可以重新开始学习对话。',
    displayText: '',
    isTyping: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    followUp: initialMessage.followUp
  }
  clearMessage.displayText = clearMessage.text
  const messageIndex = messages.push(clearMessage) - 1
  
  // 更新当前对话的消息
  if (currentChatId.value) {
    const chat = chatHistory.value.find(c => c.id === currentChatId.value)
    if (chat) {
      chat.messages = []
    }
  }
  
  // 保存清空后的初始消息
  saveMessagesToLocalStorage()
  saveChatHistory()
  
  await nextTick()
  scrollToBottom()
  
  // 启动打字机效果（根据模式决定是否启用暂停）
  const typingEffect = useTypingEffect()
  const enablePause = chatMode.value === '引导问答'
  typingEffect.start(clearMessage.text, 20, null, enablePause)
  
  const updateInterval = setInterval(() => {
    if (messages[messageIndex]) {
      messages[messageIndex].displayText = typingEffect.displayText.value
      messages[messageIndex].isTyping = typingEffect.isTyping.value
      if (!typingEffect.isTyping.value) {
        clearInterval(updateInterval)
        saveMessagesToLocalStorage()
        saveChatHistory()
      }
      scrollToBottom()
    }
  }, 20)
  
  ElMessage.success('对话已清空')
}

const exportMessages = () => {
  const dataStr = JSON.stringify(messages, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  const exportFileDefaultName = `ai-tutor-chat-${new Date().toISOString().slice(0,10)}.json`
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const saveSettings = () => {
  // 保存设置到 localStorage
  localStorage.setItem('aiTutorSettings', JSON.stringify({
    userName: userName.value,
    aiName: aiName.value,
    chatMode: chatMode.value
  }))
  
  // 保存 API 配置到 localStorage
  // ⚠️ 安全提醒：将 AccessKey 存储在前端存在安全风险，建议生产环境使用后端代理
  localStorage.setItem('aiTutorAPIConfig', JSON.stringify({
    accessKeyId: accessKeyId.value,
    accessKeySecret: accessKeySecret.value
  }))
  
  ElMessage.success('设置已保存')
}

// 保存消息到 localStorage
const saveMessagesToLocalStorage = () => {
  try {
    // 只保存必要的字段，排除临时状态
    const messagesToSave = messages.map(msg => ({
      role: msg.role,
      text: msg.text,
      time: msg.time,
      followUp: msg.followUp || null
    }))
    localStorage.setItem('aiTutorMessages', JSON.stringify(messagesToSave))
  } catch (error) {
    console.error('保存消息失败:', error)
    ElMessage.warning('保存对话记录失败，可能是存储空间不足')
  }
}

// 从 localStorage 加载消息
const loadMessagesFromLocalStorage = () => {
  try {
    const savedMessages = localStorage.getItem('aiTutorMessages')
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages)
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        // 恢复消息，为每条消息添加 displayText
        const restoredMessages = parsedMessages.map(msg => ({
          ...msg,
          displayText: msg.text,
          isTyping: false
        }))
        messages.length = 0
        messages.push(...restoredMessages)
        return true
      }
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.warning('加载历史对话失败')
  }
  return false
}

// 页面加载时，滚动到底部并加载设置
onMounted(() => {
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.vue:704',message:'onMounted called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
  // #endregion
  // 加载设置
  const savedSettings = localStorage.getItem('aiTutorSettings')
  if (savedSettings) {
    try {
      const { userName: savedUserName, aiName: savedAiName, chatMode: savedChatMode, chatModes: savedChatModes } = JSON.parse(savedSettings)
      userName.value = savedUserName || '学员'
      aiName.value = savedAiName || 'AI导师'
      // 优先使用新的 chatMode 字段，如果没有则尝试兼容旧的 chatModes 字段
      if (savedChatMode) {
        chatMode.value = savedChatMode
      } else if (savedChatModes) {
        // 兼容旧版本的多选格式，转换为单选
        if (Array.isArray(savedChatModes) && savedChatModes.length > 0) {
          chatMode.value = savedChatModes[0]
        } else if (typeof savedChatModes === 'string') {
          chatMode.value = savedChatModes
        }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
  
  // 加载 API 配置
  const savedAPIConfig = localStorage.getItem('aiTutorAPIConfig')
  if (savedAPIConfig) {
    try {
      const { accessKeyId: savedAccessKeyId, accessKeySecret: savedAccessKeySecret } = JSON.parse(savedAPIConfig)
      if (savedAccessKeyId) accessKeyId.value = savedAccessKeyId
      if (savedAccessKeySecret) accessKeySecret.value = savedAccessKeySecret
    } catch (error) {
      console.error('加载 API 配置失败:', error)
    }
  }
  
  // 加载对话历史
  loadChatHistory()
  
  scrollToBottom()
})

// 监听步骤变化，可以在这里触发特定的AI行为
watch(currentStepIndex, (newIndex) => {
  console.log(`当前步骤变更为：${newIndex + 1} - ${guideSteps[newIndex].title}`)
})

// 监听消息变化，自动保存到 localStorage
watch(
  () => messages.length,
  () => {
    // 防抖：避免频繁保存
    clearTimeout(window._saveMessagesTimeout)
    window._saveMessagesTimeout = setTimeout(() => {
      saveMessagesToLocalStorage()
      saveChatHistory()
    }, 500)
  },
  { deep: false }
)
</script>

<style scoped>
/* 暗色模式变量 */
:root {
  --bg-gradient-start: #f5f7fa;
  --bg-gradient-end: #c3cfe2;
  --header-gradient-start: #409EFF;
  --header-gradient-end: #337ecc;
  --card-bg: white;
  --message-ai-bg: #f0f7ff;
  --message-user-bg: #f0fff4;
  --text-primary: #303133;
  --text-secondary: #606266;
  --border-color: #e4e7ed;
}

html.dark,
.dark {
  --bg-gradient-start: #2d2d2d;
  --bg-gradient-end: #1a1a1a;
  --header-gradient-start: #1e88e5;
  --header-gradient-end: #1565c0;
  --card-bg: #1a1a1a;
  --message-ai-bg: #1e3a5f;
  --message-user-bg: #1a4d2e;
  --text-primary: #e5eaf3;
  --text-secondary: #a8abb2;
  --border-color: #4c4d4f;
}

html.dark .app-header h1,
.dark .app-header h1 {
  color: #e5eaf3 !important;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  transition: background 0.3s ease;
}

.app-header {
  background: linear-gradient(90deg, var(--header-gradient-start) 0%, var(--header-gradient-end) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 30px;
  box-shadow: none;
  transition: background 0.3s ease;
}

.app-header h1 {
  color: #303133;
  margin: 0;
  transition: color 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle, .settings-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  transition: all 0.3s;
}

.theme-toggle:hover, .settings-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.theme-toggle:hover {
  transform: rotate(180deg);
}

/* 浮动操作按钮：位于最上层 */
.floating-actions {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.floating-button {
  background: #409EFF;
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}

.floating-button:hover {
  background: #66b1ff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
  transform: translateY(-2px);
}

.theme-button:hover {
  transform: translateY(-2px) rotate(180deg);
}
.header-subtitle {
  margin: 5px 0 0 0;
  font-size: 0.95em;
  opacity: 0.9;
}

.main-content {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.guide-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  transition: width 0.3s ease, background 0.3s ease;
  overflow: hidden;
  /* 侧边栏底色：更深一点点的灰色（夜间会自动取反） */
  background: rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

html.dark .guide-sidebar,
.dark .guide-sidebar {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.guide-sidebar.collapsed {
  overflow: visible;
}

.sidebar-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  cursor: pointer;
}

.guide-sidebar.collapsed .sidebar-toggle {
  position: absolute;
  top: 10px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.sidebar-toggle .el-button {
  background: rgba(64, 158, 255, 0.25);
  border: 1px solid rgba(64, 158, 255, 0.35);
  color: #2b7cd9;
}

.sidebar-toggle .el-button:hover {
  background: rgba(64, 158, 255, 0.35);
}

/* 对话历史面板样式 */
.chat-history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  /* 给右上角折叠按钮留出视觉空间 */
  padding-top: 44px;
}

.new-chat-button {
  margin-bottom: 15px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--card-bg);
  position: relative;
}

.chat-item:hover {
  background: rgba(64, 158, 255, 0.1);
}

html.dark .chat-item:hover,
.dark .chat-item:hover {
  background: rgba(64, 158, 255, 0.2);
}

.chat-item.active {
  background: rgba(64, 158, 255, 0.15);
  border-left: 3px solid #409EFF;
}

html.dark .chat-item.active,
.dark .chat-item.active {
  background: rgba(64, 158, 255, 0.25);
}

.chat-icon {
  font-size: 18px;
  color: #409EFF;
  margin-right: 10px;
  flex-shrink: 0;
}

.chat-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.chat-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.chat-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.delete-chat-btn {
  opacity: 0;
  transition: opacity 0.3s;
  flex-shrink: 0;
}

.chat-item:hover .delete-chat-btn {
  opacity: 1;
}

.guide-card, .knowledge-card {
  height: fit-content;
  background: var(--card-bg);
  border: none;
  box-shadow: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
}
.icon-margin {
  margin-right: 8px;
}

.steps {
  margin-bottom: 20px;
}
.clickable-step {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.clickable-step:hover {
  background-color: rgba(64, 158, 255, 0.1);
  transition: background-color 0.3s;
}

html.dark .clickable-step:hover,
.dark .clickable-step:hover {
  background-color: rgba(64, 158, 255, 0.2);
}

.is-active {
  background-color: rgba(64, 158, 255, 0.15);
}

html.dark .is-active,
.dark .is-active {
  background-color: rgba(64, 158, 255, 0.25);
}

.step-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.current-tip {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  border-left: 4px solid #409EFF;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

html.dark .current-tip,
.dark .current-tip {
  background-color: rgba(64, 158, 255, 0.2);
}
.current-tip .el-icon {
  margin-right: 8px;
  color: #409EFF;
}

.knowledge-point {
  margin: 0 5px 5px 0;
}

.chat-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  transition: width 0.3s ease;
}
.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: none;
  box-shadow: none;
  background: transparent;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 260px; /* 为底部固定输入区域（含对话模式选择器）留出空间，避免内容被遮挡 */
}
.message-item {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.5s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.message-item.user {
  flex-direction: row-reverse;
}
.message-avatar {
  flex-shrink: 0;
  margin: 0 15px;
}
.message-item.user .message-avatar {
  margin-left: 15px;
  margin-right: 0;
}
.message-content {
  max-width: 70%;
  background: var(--card-bg);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

html.dark .message-content,
.dark .message-content {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.message-item.ai .message-content {
  background: var(--message-ai-bg);
  border-left: 4px solid #409EFF;
}
.message-item.user .message-content {
  background: var(--message-user-bg);
  border-right: 4px solid #67c23a;
}
.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9em;
}
.message-time {
  color: var(--text-secondary);
  font-size: 0.85em;
}
.message-text {
  line-height: 1.8;
  color: var(--text-primary);
  word-wrap: break-word;
}

/* Markdown 样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: var(--text-primary);
}

html.dark .markdown-body :deep(code),
.dark .markdown-body :deep(code) {
  background: rgba(255, 255, 255, 0.15);
  color: #e5eaf3;
}

.markdown-body :deep(pre) {
  background: #f6f8fa;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 12px 0;
}

html.dark .markdown-body :deep(pre),
.dark .markdown-body :deep(pre) {
  background: #1e1e1e;
  border-color: #4c4d4f;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.6;
}

/* 暗色模式下的代码高亮优化 */
html.dark .markdown-body :deep(pre),
.dark .markdown-body :deep(pre) {
  border-color: #404040;
}

html.dark .markdown-body :deep(pre code.hljs),
.dark .markdown-body :deep(pre code.hljs) {
  background: #1e1e1e;
  color: #d4d4d4;
}

/* 确保代码块在暗色模式下有足够的对比度 */
html.dark .markdown-body :deep(.hljs-keyword),
.dark .markdown-body :deep(.hljs-keyword),
html.dark .markdown-body :deep(.hljs-selector-tag),
.dark .markdown-body :deep(.hljs-selector-tag),
html.dark .markdown-body :deep(.hljs-built_in),
.dark .markdown-body :deep(.hljs-built_in),
html.dark .markdown-body :deep(.hljs-name),
.dark .markdown-body :deep(.hljs-name) {
  color: #569cd6;
}

html.dark .markdown-body :deep(.hljs-string),
.dark .markdown-body :deep(.hljs-string),
html.dark .markdown-body :deep(.hljs-title),
.dark .markdown-body :deep(.hljs-title) {
  color: #ce9178;
}

html.dark .markdown-body :deep(.hljs-comment),
.dark .markdown-body :deep(.hljs-comment),
html.dark .markdown-body :deep(.hljs-quote),
.dark .markdown-body :deep(.hljs-quote) {
  color: #6a9955;
  font-style: italic;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #409EFF;
  padding-left: 16px;
  margin: 12px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.markdown-body :deep(a) {
  color: #409EFF;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-body :deep(em) {
  font-style: italic;
}

/* 打字指示器 */
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* 暂停提示样式 */
.pause-prompt {
  margin-top: 16px;
  padding: 16px;
  background: rgba(64, 158, 255, 0.1);
  border-left: 4px solid #409EFF;
  border-radius: 8px;
}

html.dark .pause-prompt,
.dark .pause-prompt {
  background: rgba(30, 136, 229, 0.15);
  border-left-color: #1e88e5;
}

.pause-content {
  margin-top: 12px;
}

.pause-content p {
  margin: 8px 0;
  color: var(--text-primary);
  font-weight: 500;
}

.pause-content ul {
  margin: 12px 0;
  padding-left: 24px;
}

.pause-content li {
  margin: 6px 0;
  color: var(--text-secondary);
}

.continue-button {
  margin-top: 12px;
}

/* 数学公式样式 */
.markdown-body :deep(.katex) {
  font-size: 1.1em;
}

.markdown-body :deep(.katex-display) {
  margin: 16px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-body :deep(.katex-display > .katex) {
  display: inline-block;
  text-align: left;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-8px);
  }
}
.follow-up {
  margin-top: 15px;
}
.follow-up-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.follow-up-question {
  cursor: pointer;
  transition: all 0.3s;
}
.follow-up-question:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 固定在底部的输入区域 */
.fixed-input-area {
  position: fixed;
  bottom: 0;
  padding: 20px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color); /* 顶部描边，形成完整遮挡区域 */
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease, width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  z-index: 100;
}

/* 对话模式选择器样式 */
.chat-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: var(--card-bg);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

html.dark .chat-mode-selector,
.dark .chat-mode-selector {
  background: var(--card-bg);
  border-color: var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.chat-mode-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-mode-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  flex: 1;
  align-items: center;
}

.chat-mode-radio {
  margin-right: 0;
  transition: all 0.3s ease;
}

.chat-mode-radio:hover {
  transform: translateY(-1px);
}

.chat-mode-radio :deep(.el-radio__label) {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
  padding-left: 8px;
}

.chat-mode-radio :deep(.el-radio__input .el-radio__inner) {
  width: 18px;
  height: 18px;
  border-width: 2px;
  transition: all 0.3s ease;
}

.chat-mode-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

.chat-mode-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #409EFF;
  font-weight: 600;
}

html.dark .chat-mode-radio :deep(.el-radio__input.is-checked + .el-radio__label),
.dark .chat-mode-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #66b1ff;
}

html.dark .chat-mode-radio :deep(.el-radio__input .el-radio__inner),
.dark .chat-mode-radio :deep(.el-radio__input .el-radio__inner) {
  border-color: var(--border-color);
  background-color: transparent;
}

html.dark .chat-mode-radio :deep(.el-radio__input.is-checked .el-radio__inner),
.dark .chat-mode-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

html.dark .fixed-input-area,
.dark .fixed-input-area {
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);
}

.input-container {
  max-width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.message-input {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.settings-drawer {
  padding: 20px 0;
}

kbd {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  color: #374151;
  display: inline-block;
  font-size: 0.85em;
  line-height: 1;
  padding: 2px 5px;
  margin: 0 2px;
}

html.dark kbd,
.dark kbd {
  background-color: #2d2d2d;
  border: 1px solid #4c4d4f;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  color: #e5eaf3;
}

</style>