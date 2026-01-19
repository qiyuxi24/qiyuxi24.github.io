import { ref, onUnmounted } from 'vue'

/**
 * 打字机效果 composable
 * @param {string} text - 要显示的文本
 * @param {number} speed - 打字速度（毫秒/字符）
 * @returns {Object} - { displayText, isTyping, start, stop }
 */
export function useTypingEffect(text = '', speed = 30) {
  const displayText = ref('')
  const isTyping = ref(false)
  let timer = null

  const start = (newText = text, newSpeed = speed) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:14',message:'useTypingEffect.start called',data:{newTextLength:newText?.length||0,newSpeed,speed,timerExists:!!timer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    stop() // 先停止之前的打字效果
    displayText.value = ''
    isTyping.value = true
    
    let index = 0
    const targetText = newText || text
    const typingSpeed = newSpeed || speed

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:24',message:'before starting type loop',data:{targetTextLength:targetText.length,typingSpeed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const type = () => {
      if (index < targetText.length) {
        displayText.value += targetText[index]
        index++
        timer = setTimeout(type, typingSpeed)
        // #region agent log
        if (index % 50 === 0 || index === targetText.length) {
          fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:33',message:'typing progress',data:{index,targetLength:targetText.length,displayLength:displayText.value.length,isTyping:isTyping.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }
        // #endregion
      } else {
        isTyping.value = false
        timer = null
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:38',message:'typing finished',data:{finalIndex:index,targetLength:targetText.length,displayLength:displayText.value.length,isTyping:isTyping.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }

    type()
  }

  const stop = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isTyping.value = false
  }

  const finish = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:50',message:'finish called',data:{textLength:text?.length||0,displayLength:displayText.value.length,isTyping:isTyping.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    stop()
    displayText.value = text
  }

  onUnmounted(() => {
    stop()
  })

  return {
    displayText,
    isTyping,
    start,
    stop,
    finish
  }
}

