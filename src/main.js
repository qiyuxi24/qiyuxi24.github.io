import { createApp } from 'vue'
import './style.css'

// 导入 Element Plus 及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入 highlight.js 样式（基础主题，暗色模式通过 CSS 覆盖）
import 'highlight.js/styles/github.css'
// 导入 KaTeX 样式
import 'katex/dist/katex.min.css'

import App from './App.vue'

// #region agent log
try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:20',message:'before creating app',data:{hasApp:!!App},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
// #endregion

const app = createApp(App)

// 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)

// #region agent log
try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:30',message:'before mounting app',data:{hasAppElement:!!document.getElementById('app')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
// #endregion

try {
  app.mount('#app')
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:36',message:'app mounted successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
  // #endregion
} catch (error) {
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:40',message:'app mount error',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
  // #endregion
  console.error('应用启动失败:', error)
  throw error
}

// 全局错误处理
window.addEventListener('error', (event) => {
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:48',message:'global error handler',data:{errorMessage:event.message,errorFilename:event.filename,errorLineno:event.lineno,errorColno:event.colno},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
  // #endregion
})

window.addEventListener('unhandledrejection', (event) => {
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:53',message:'unhandled promise rejection',data:{errorMessage:event.reason?.message||event.reason,errorStack:event.reason?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{}); } catch(e) {}
  // #endregion
})