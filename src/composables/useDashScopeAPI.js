/**
 * 阿里云 DashScope 通义千问 API 调用模块
 * ⚠️ 安全提醒：将 AccessKey 存储在前端 localStorage 存在安全风险，
 * 建议在生产环境中使用后端代理来调用 API。
 */

/**
 * 调用 DashScope 通义千问 API
 * @param {Array} messages - 对话消息数组，格式：[{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @param {string} accessKeyId - 千问 API Key（在阿里云 DashScope 控制台获取）
 * @param {string} accessKeySecret - 可选，通常不需要（如果提供了会优先使用）
 * @returns {Promise<Object>} API 响应
 */
export async function callDashScopeAPI(messages, accessKeyId, accessKeySecret = null) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:callDashScopeAPI',message:'entry',data:{messagesLength:messages?.length||0,roles:(messages||[]).map(m=>m.role).slice(0,6),hasAccessKeyId:!!accessKeyId,hasAccessKeySecret:!!accessKeySecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:14',message:'callDashScopeAPI entry',data:{messagesLength:messages.length,hasAccessKeyId:!!accessKeyId,hasAccessKeySecret:!!accessKeySecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  // 至少需要提供 AccessKey ID 或 AccessKey Secret 之一
  if (!accessKeyId && !accessKeySecret) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:16',message:'API Key missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error('API 密钥未配置，请在设置中配置 AccessKey ID 或 AccessKey Secret')
  }

  // 优先使用兼容模式端点（OpenAI兼容格式，更稳定）
  // 如果兼容模式失败，可以尝试原生端点
  const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
  
  // 使用 API Key 进行认证（千问 API 使用 Bearer Token 认证）
  // 优先使用 accessKeySecret，如果没有则使用 accessKeyId
  const apiKey = accessKeySecret || accessKeyId

  // 构建请求体（兼容OpenAI格式）
  const requestBody = {
    model: 'qwen-turbo', // 使用 qwen-turbo 模型，可根据需要改为 qwen-plus
    messages: messages.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.content || msg.text
    })),
    temperature: 0.7,
    top_p: 0.8,
    max_tokens: 2000
  }
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:callDashScopeAPI',message:'before fetch',data:{apiUrl,model:requestBody.model,hasApiKey:!!apiKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

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
      signal: controller.signal,
      mode: 'cors' // 明确指定CORS模式
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:callDashScopeAPI',message:'response not ok',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:87',message:'parsed API response',data:{hasCode:!!data.code,code:data.code,hasChoices:!!data.choices,choicesLength:data.choices?.length||0,hasError:!!data.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // 兼容模式返回的错误格式
    if (data.error) {
      throw new Error(data.error.message || data.error.code || 'API 返回错误')
    }
    
    // 兼容模式返回格式：{ choices: [{ message: { content: '...' } }] }
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message?.content
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
    }
    
    // 兼容原生DashScope格式（如果使用原生端点）
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const reply = data.output.choices[0].message.content
      if (!reply) {
        throw new Error('API 返回的回复内容为空')
      }
      return {
        success: true,
        text: reply,
        raw: data
      }
    }
    
    // 检查响应中是否有错误（原生格式）
    if (data.code && data.code !== 'Success') {
      throw new Error(data.message || data.msg || 'API 返回错误')
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:108',message:'API response format invalid',data:{hasChoices:!!data.choices,hasOutput:!!data.output},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error('API 响应格式异常，未找到回复内容')
  } catch (error) {
    console.error('DashScope API 调用失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDashScopeAPI.js:callDashScopeAPI',message:'caught error',data:{errorName:error?.name,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试')
    }
    
    // 处理网络错误（包括CORS错误）
    if (error.message && (
      error.message.includes('Failed to fetch') || 
      error.message.includes('NetworkError') ||
      error.message.includes('CORS')
    )) {
      throw new Error('网络连接失败，可能是CORS跨域问题。建议使用后端代理调用API，或检查API密钥是否正确')
    }
    
    // 抛出原始错误或包装的错误
    throw error instanceof Error ? error : new Error('API 调用失败')
  }
}

/**
 * 将应用消息格式转换为 DashScope API 格式
 * @param {Array} appMessages - 应用内部消息格式
 * @param {string} chatMode - 对话模式：'引导问答'、'检测考验'、'即时回答'
 * @returns {Array} DashScope API 格式的消息数组
 */
export function convertMessagesToDashScopeFormat(appMessages, chatMode = '即时回答') {
  // 根据模式生成系统提示词
  const systemPrompts = {
    '引导问答': `你是一位耐心的AI学习导师，采用引导式问答的教学方式。你的任务是：
1. 通过一系列引导性问题，帮助学生循序渐进地掌握知识
2. 在讲解关键概念时，使用"第一步"、"第二步"等步骤标记，便于学生理解学习进度
3. 在关键回答节点（如完成一个步骤、讲解完一个概念）后暂停，给学生思考时间
4. 使用启发性的问题引导学生思考，而不是直接给出答案
5. 根据学生的回答调整教学节奏和深度
6. 在适当的时候提出追问，帮助学生深入理解

请确保你的回答结构清晰，使用步骤标记（如"第一步："、"第二步："等），并在关键节点后自然停顿，给学生思考的时间。`,
    
    '检测考验': `你是一位严格的AI学习导师，采用检测考验的教学方式。你的任务是：
1. 在学生回答后，提出类似但略有变化的问题来考验学生是否真正理解
2. 通过变换角度、改变条件、增加难度等方式，检测学生的掌握程度
3. 如果学生回答正确，可以适当增加难度；如果回答有误，指出问题并引导纠正
4. 使用类似"那么，如果换一个角度..."、"让我们换个方式思考..."等过渡语
5. 通过连续的问题考验，确保学生真正掌握了知识，而不是死记硬背
6. 在考验过程中，适时给予鼓励和反馈

请确保你的问题具有挑战性，能够有效检测学生的理解程度。`,
    
    '即时回答': `你是一位知识渊博的AI学习导师，采用即时回答的教学方式。你的任务是：
1. 直接、清晰地回答学生的问题，不设置额外的停顿或考验
2. 提供准确、全面的信息
3. 如果问题复杂，可以分点讲解，但不需要刻意停顿
4. 根据学生的需求，提供详细的解释和示例
5. 保持回答的连贯性和完整性

请确保你的回答直接、完整、准确。`
  }
  
  // 获取当前模式的系统提示词
  const systemPrompt = systemPrompts[chatMode] || systemPrompts['即时回答']
  
  // 转换消息格式
  const convertedMessages = appMessages
    .filter(msg => msg.text || msg.content) // 过滤掉空消息
    .map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text || msg.content || ''
    }))
  
  // 检查是否已有系统消息，如果没有则添加
  const hasSystemMessage = convertedMessages.length > 0 && convertedMessages[0].role === 'system'
  
  if (!hasSystemMessage) {
    // 在消息数组开头插入系统提示词
    convertedMessages.unshift({
      role: 'system',
      content: systemPrompt
    })
  } else {
    // 如果已有系统消息，更新它
    convertedMessages[0].content = systemPrompt
  }
  
  return convertedMessages
}
