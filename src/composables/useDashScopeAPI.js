/**
 * 阿里云 DashScope 通义千问 API 调用模块
 * ⚠️ 安全提醒：将 AccessKey 存储在前端 localStorage 存在安全风险，
 * 建议在生产环境中使用后端代理来调用 API。
 */

/**
 * 调用 DashScope 通义千问 API
 * @param {Array} messages - 对话消息数组，格式：[{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @param {string} accessKeyId - AccessKey ID
 * @param {string} accessKeySecret - AccessKey Secret（可选，某些 API 只需 ID）
 * @returns {Promise<Object>} API 响应
 */
export async function callDashScopeAPI(messages, accessKeyId, accessKeySecret = null) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:14',message:'callDashScopeAPI entry',data:{messagesLength:messages.length,hasAccessKeyId:!!accessKeyId,hasAccessKeySecret:!!accessKeySecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  if (!accessKeyId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:16',message:'AccessKey ID missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error('AccessKey ID 未配置，请在设置中配置 API 密钥')
  }

  // DashScope API 端点
  const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  
  // 使用 AccessKey 作为 API Key（DashScope 通常使用 AccessKey ID 或 Secret 作为 API Key）
  // 根据实际文档调整，有些 API 使用 ID，有些使用 Secret
  const apiKey = accessKeySecret || accessKeyId

  // 构建请求体
  const requestBody = {
    model: 'qwen-turbo', // 使用 qwen-turbo 模型，可根据需要改为 qwen-plus
    input: {
      messages: messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content || msg.text
      }))
    },
    parameters: {
      // 可选参数
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 2000
    }
  }

  try {
    // 创建带超时的 fetch 请求
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'disable' // 禁用服务器发送事件
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:61',message:'API response not ok',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      let errorMessage = `API 请求失败: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:67',message:'parsed error data',data:{status:response.status,errorCode:errorData.code,errorMessage:errorData.message||errorData.msg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // 处理常见的 API 错误
        if (response.status === 401) {
          errorMessage = 'API 密钥无效，请检查 AccessKey ID 和 Secret 是否正确'
        } else if (response.status === 429) {
          errorMessage = 'API 调用频率过高，请稍后再试'
        } else if (response.status === 403) {
          errorMessage = 'API 访问被拒绝，请检查密钥权限'
        } else if (response.status >= 500) {
          errorMessage = '服务器错误，请稍后再试'
        } else {
          errorMessage = errorData.message || errorData.msg || errorMessage
        }
      } catch (parseError) {
        // 无法解析错误响应，使用默认错误信息
        console.warn('无法解析错误响应:', parseError)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:82',message:'failed to parse error response',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:87',message:'parsed API response',data:{hasCode:!!data.code,code:data.code,hasOutput:!!data.output,hasChoices:!!(data.output?.choices),choicesLength:data.output?.choices?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // 检查响应中是否有错误
    if (data.code && data.code !== 'Success') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:92',message:'API response has error code',data:{code:data.code,message:data.message||data.msg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new Error(data.message || data.msg || 'API 返回错误')
    }
    
    // 提取 AI 回复文本
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const reply = data.output.choices[0].message.content
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:98',message:'extracted reply from response',data:{hasReply:!!reply,replyLength:reply?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!reply) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:100',message:'reply is empty',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw new Error('API 返回的回复内容为空')
      }
      return {
        success: true,
        text: reply,
        raw: data
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:108',message:'API response format invalid',data:{hasOutput:!!data.output,hasChoices:!!(data.output?.choices),choicesLength:data.output?.choices?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new Error('API 响应格式异常，未找到回复内容')
    }
  } catch (error) {
    console.error('DashScope API 调用失败:', error)
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试')
    }
    
    // 处理网络错误
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络后重试')
    }
    
    // 抛出原始错误或包装的错误
    throw error instanceof Error ? error : new Error('API 调用失败')
  }
}

/**
 * 将应用消息格式转换为 DashScope API 格式
 * @param {Array} appMessages - 应用内部消息格式
 * @returns {Array} DashScope API 格式的消息数组
 */
export function convertMessagesToDashScopeFormat(appMessages) {
  return appMessages
    .filter(msg => msg.text || msg.content) // 过滤掉空消息
    .map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text || msg.content || ''
    }))
}
