/**
 * 前端调用本地后端代理（/api/chat）
 * - 浏览器端不保存/不暴露任何 API Key
 * - 由 server/index.js 读取环境变量 OPENAI_API_KEY 代为请求上游模型
 */
 
export async function callChatProxyAPI(messages, model) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)
 
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
      signal: controller.signal
    })
 
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = data?.error || data?.message || `请求失败: ${res.status} ${res.statusText}`
      throw new Error(msg)
    }
 
    if (!data?.success || !data?.text) {
      throw new Error('API 返回格式异常')
    }
 
    return data
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw err instanceof Error ? err : new Error('API 调用失败')
  } finally {
    clearTimeout(timeoutId)
  }
}
 
export function convertMessagesToOpenAIFormat(appMessages) {
  return (appMessages || [])
    .filter((m) => m?.text)
    .map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text
    }))
}
 
