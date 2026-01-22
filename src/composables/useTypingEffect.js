import { ref, onUnmounted } from 'vue'

/**
 * 打字机效果 composable（支持关键节点暂停）
 * @param {string} text - 要显示的文本
 * @param {number} speed - 打字速度（毫秒/字符）
 * @returns {Object} - { displayText, isTyping, isPaused, start, stop, resume }
 */
export function useTypingEffect(text = '', speed = 30) {
  const displayText = ref('')
  const isTyping = ref(false)
  const isPaused = ref(false)
  let timer = null
  let currentIndex = 0
  let targetText = ''
  let typingSpeed = speed
  let pauseCallback = null

  // 检测关键节点（标题、步骤等）
  const detectPausePoint = (text, index, enablePause = true) => {
    // 如果禁用了暂停功能，直接返回null
    if (!enablePause) {
      return null
    }
    
    // 检测模式：第一步、第二步、第三步等，或者 **第一步:**、## 第一步 等
    const pausePatterns = [
      /第[一二三四五六七八九十\d]+步[：:]/g,
      /##\s*第[一二三四五六七八九十\d]+步/g,
      /\*\*第[一二三四五六七八九十\d]+步[：:]\*\*/g,
      /###\s*第[一二三四五六七八九十\d]+步/g,
      // 添加更多关键节点检测：完成、总结、思考等
      /(?:完成|总结|思考|回顾|接下来|现在|然后)[：:]/g,
      /(?:##\s*)(?:完成|总结|思考|回顾)/g
    ]
    
    // 检查当前位置之后是否有暂停点
    const remainingText = text.substring(index)
    for (const pattern of pausePatterns) {
      const match = remainingText.match(pattern)
      if (match && match.index !== undefined && match.index < 200) {
        // 找到暂停点，返回应该暂停的位置（在匹配点之后）
        const pausePos = index + match.index + match[0].length
        // 找到下一个换行或段落结束
        const nextBreak = text.indexOf('\n\n', pausePos)
        if (nextBreak !== -1 && nextBreak - pausePos < 500) {
          return nextBreak + 2
        }
        // 或者找到下一个标题
        const nextTitle = text.search(/\n##|\n\*\*第/, pausePos)
        if (nextTitle !== -1 && nextTitle - pausePos < 500) {
          return nextTitle
        }
        return pausePos + 100 // 在匹配点后100字符处暂停
      }
    }
    return null
  }

  let enablePauseFeature = true // 是否启用暂停功能

  const start = (newText = text, newSpeed = speed, onPause = null, enablePause = true) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:14',message:'useTypingEffect.start called',data:{newTextLength:newText?.length||0,newSpeed,speed,timerExists:!!timer,enablePause},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    stop() // 先停止之前的打字效果
    displayText.value = ''
    isTyping.value = true
    isPaused.value = false
    currentIndex = 0
    targetText = newText || text
    typingSpeed = newSpeed || speed
    pauseCallback = onPause
    enablePauseFeature = enablePause

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:24',message:'before starting type loop',data:{targetTextLength:targetText.length,typingSpeed,enablePauseFeature},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const type = () => {
      if (currentIndex < targetText.length && !isPaused.value) {
        // 检测是否需要暂停（仅在启用暂停功能时）
        const pausePoint = detectPausePoint(targetText, currentIndex, enablePauseFeature)
        if (pausePoint !== null && currentIndex >= pausePoint - 50 && currentIndex < pausePoint) {
          // 到达暂停点
          isPaused.value = true
          isTyping.value = false
          if (pauseCallback) {
            pauseCallback()
          }
          return
        }
        
        displayText.value += targetText[currentIndex]
        currentIndex++
        timer = setTimeout(type, typingSpeed)
        // #region agent log
        if (currentIndex % 50 === 0 || currentIndex === targetText.length) {
          fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:33',message:'typing progress',data:{index:currentIndex,targetLength:targetText.length,displayLength:displayText.value.length,isTyping:isTyping.value,isPaused:isPaused.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }
        // #endregion
      } else if (currentIndex >= targetText.length) {
        isTyping.value = false
        isPaused.value = false
        timer = null
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0742b738-8510-42a3-913c-b9b9f2a546ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTypingEffect.js:38',message:'typing finished',data:{finalIndex:currentIndex,targetLength:targetText.length,displayLength:displayText.value.length,isTyping:isTyping.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }

    type()
  }

  const resume = () => {
    if (isPaused.value && currentIndex < targetText.length) {
      isPaused.value = false
      isTyping.value = true
      const type = () => {
        if (currentIndex < targetText.length && !isPaused.value) {
          const pausePoint = detectPausePoint(targetText, currentIndex, enablePauseFeature)
          if (pausePoint !== null && currentIndex >= pausePoint - 50 && currentIndex < pausePoint) {
            isPaused.value = true
            isTyping.value = false
            if (pauseCallback) {
              pauseCallback()
            }
            return
          }
          
          displayText.value += targetText[currentIndex]
          currentIndex++
          timer = setTimeout(type, typingSpeed)
        } else if (currentIndex >= targetText.length) {
          isTyping.value = false
          isPaused.value = false
          timer = null
        }
      }
      type()
    }
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
    isPaused,
    start,
    stop,
    resume,
    finish
  }
}

