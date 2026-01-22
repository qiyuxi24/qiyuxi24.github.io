    /**
 * 对话本地缓存（localStorage）模块
 *
 * 目标：
 * - 统一管理本地缓存键名
 * - 统一处理序列化/反序列化（剔除临时字段，如 displayText / isTyping）
 * - 提供容错的读写方法，避免 JSON 解析错误导致页面崩溃
 */
 
export const CHAT_CACHE_KEYS = {
  chatHistory: 'aiTutorChatHistory',
  currentChatId: 'aiTutorCurrentChatId'
}
 
function safeJsonParse(text, fallback = null) {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}
 
function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}
 
/**
 * 将应用内消息对象转换为可持久化的最小结构
 * @param {any} msg
 * @returns {{role: string, text: string, time?: string, followUp?: any}|null}
 */
export function snapshotMessage(msg) {
  if (!msg || !isPlainObject(msg)) return null
  const role = typeof msg.role === 'string' ? msg.role : null
  const text = typeof msg.text === 'string' ? msg.text : null
  if (!role || !text) return null
 
  return {
    role,
    text,
    time: typeof msg.time === 'string' ? msg.time : undefined,
    followUp: msg.followUp ?? null
  }
}
 
/**
 * 将消息数组转换为可持久化快照
 * @param {Array} messages
 */
export function snapshotMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages.map(snapshotMessage).filter(Boolean)
}
 
/**
 * 从持久化结构恢复消息数组（补齐 displayText/isTyping）
 * @param {Array} savedMessages
 */
export function restoreMessages(savedMessages) {
  if (!Array.isArray(savedMessages)) return []
  return savedMessages
    .map((msg) => {
      if (!msg || !isPlainObject(msg)) return null
      if (typeof msg.role !== 'string' || typeof msg.text !== 'string') return null
      return {
        role: msg.role,
        text: msg.text,
        time: typeof msg.time === 'string' ? msg.time : '',
        followUp: msg.followUp ?? null,
        displayText: msg.text,
        isTyping: false
      }
    })
    .filter(Boolean)
}
 
function normalizeChat(chat) {
  if (!chat || !isPlainObject(chat)) return null
  const id = typeof chat.id === 'string' ? chat.id : null
  if (!id) return null
 
  return {
    id,
    title: typeof chat.title === 'string' ? chat.title : '新对话',
    messages: Array.isArray(chat.messages) ? chat.messages.map(snapshotMessage).filter(Boolean) : [],
    createdAt: typeof chat.createdAt === 'string' ? chat.createdAt : new Date().toISOString(),
    updatedAt: typeof chat.updatedAt === 'string' ? chat.updatedAt : new Date().toISOString()
  }
}
 
/**
 * 读取缓存中的对话历史与当前对话ID（带容错与基本校验）
 * @returns {{ chatHistory: Array, currentChatId: string|null }|null}
 */
export function readChatCache() {
  try {
    const rawHistory = localStorage.getItem(CHAT_CACHE_KEYS.chatHistory)
    const rawChatId = localStorage.getItem(CHAT_CACHE_KEYS.currentChatId)
 
    const parsedHistory = safeJsonParse(rawHistory, [])
    const history = Array.isArray(parsedHistory)
      ? parsedHistory.map(normalizeChat).filter(Boolean)
      : []
 
    const currentChatId = typeof rawChatId === 'string' && rawChatId ? rawChatId : null
 
    return { chatHistory: history, currentChatId }
  } catch {
    return null
  }
}
 
/**
 * 写入对话历史与当前对话ID到缓存
 * @param {{chatHistory: Array, currentChatId: string|null}} payload
 * @returns {{ success: true }|{ success: false, error: Error }}
 */
export function writeChatCache(payload) {
  try {
    const history = Array.isArray(payload?.chatHistory)
      ? payload.chatHistory.map(normalizeChat).filter(Boolean)
      : []
    const currentChatId = typeof payload?.currentChatId === 'string' ? payload.currentChatId : null
 
    localStorage.setItem(CHAT_CACHE_KEYS.chatHistory, JSON.stringify(history))
    localStorage.setItem(CHAT_CACHE_KEYS.currentChatId, currentChatId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error('写入缓存失败') }
  }
}
 
