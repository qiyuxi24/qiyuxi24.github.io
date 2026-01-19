import express from 'express'
 
const app = express()
app.use(express.json({ limit: '1mb' }))
 
const PORT = Number(process.env.PORT || 8787)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/+$/, '')
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
 
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})
 
app.post('/api/chat', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY 未配置。请在启动 server 前设置环境变量。'
      })
    }
 
    const { messages, model } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' })
    }
 
    // OpenAI Chat Completions (兼容多数 OpenAI-style 网关)
    const upstream = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: typeof model === 'string' && model.trim() ? model.trim() : OPENAI_MODEL,
        messages,
        temperature: 0.7
      })
    })
 
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `上游请求失败: ${upstream.status} ${upstream.statusText}`
      return res.status(upstream.status).json({ error: msg })
    }
 
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      return res.status(502).json({ error: '上游响应缺少 message.content' })
    }
 
    return res.json({ success: true, text, raw: data })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'server error'
    })
  }
})
 
app.listen(PORT, () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`)
})
 
