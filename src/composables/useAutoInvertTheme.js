import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 自动“黑白灰取反”主题切换
 *
 * 设计目标：
 * - 不再为每个新组件手写一套暗色 CSS
 * - 点击后自动扫描页面，把低饱和度颜色（黑白灰、浅灰/深灰、接近灰的颜色）做“亮度取反”
 * - 不影响高饱和度的品牌/强调色（例如蓝色按钮），避免变成橙色等
 */

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'caretColor'
]

const STRING_COLOR_PROPS = ['backgroundImage', 'boxShadow', 'textShadow']

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

function parseRgb(colorStr) {
  // 仅处理浏览器 computedStyle 常见的 rgb()/rgba() 格式
  const m = colorStr
    .replace(/\s+/g, '')
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)$/i)
  if (!m) return null
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const a = m[4] === undefined ? 1 : Number(m[4])
  if ([r, g, b, a].some((x) => Number.isNaN(x))) return null
  return { r, g, b, a: clamp01(a) }
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      case bn:
        h = (rn - gn) / d + 4
        break
      default:
        h = 0
    }
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s: clamp01(s), l: clamp01(l) }
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (h % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0,
    g1 = 0,
    b1 = 0

  if (0 <= hp && hp < 1) {
    r1 = c
    g1 = x
  } else if (1 <= hp && hp < 2) {
    r1 = x
    g1 = c
  } else if (2 <= hp && hp < 3) {
    g1 = c
    b1 = x
  } else if (3 <= hp && hp < 4) {
    g1 = x
    b1 = c
  } else if (4 <= hp && hp < 5) {
    r1 = x
    b1 = c
  } else if (5 <= hp && hp < 6) {
    r1 = c
    b1 = x
  }

  const m = l - c / 2
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  return {
    r: Math.min(255, Math.max(0, r)),
    g: Math.min(255, Math.max(0, g)),
    b: Math.min(255, Math.max(0, b))
  }
}

function rgbaToString({ r, g, b, a }) {
  const alpha = clamp01(a)
  if (alpha === 1) return `rgb(${r}, ${g}, ${b})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function shouldInvertNeutral(rgba, saturationThreshold = 0.45, alphaThreshold = 0.02) {
  if (!rgba) return false
  if (rgba.a <= alphaThreshold) return false
  const { s } = rgbToHsl(rgba)
  return s <= saturationThreshold
}

function invertNeutralColor(rgba) {
  const hsl = rgbToHsl(rgba)
  const inverted = hslToRgb({ h: hsl.h, s: hsl.s, l: 1 - hsl.l })
  return { ...inverted, a: rgba.a }
}

function isNeutralBackground(computedStyle) {
  if (!computedStyle) return true

  const bgColor = parseRgb(computedStyle.backgroundColor)
  if (bgColor && bgColor.a > 0.05) {
    return shouldInvertNeutral(bgColor)
  }

  const bgImg = computedStyle.backgroundImage
  if (!bgImg || bgImg === 'none') return true

  // 渐变等：如果背景里包含高饱和度颜色，则认为是“强调背景”，不强行反转文字色
  const matches = bgImg.match(/rgba?\([^)]+\)/gi) || []
  let maxS = 0
  for (const m of matches) {
    const parsed = parseRgb(m)
    if (!parsed) continue
    const { s } = rgbToHsl(parsed)
    if (s > maxS) maxS = s
  }
  return maxS <= 0.45
}

function replaceRgbInString(str, replacer) {
  if (!str || str === 'none') return str
  return str.replace(/rgba?\([^)]+\)/gi, (match) => {
    const parsed = parseRgb(match)
    const next = replacer(parsed)
    return next ? rgbaToString(next) : match
  })
}

export function useAutoInvertTheme(options = {}) {
  const isDark = ref(false)
  const rootSelector = typeof options.rootSelector === 'string' ? options.rootSelector : '#app'
  const persistKey =
    typeof options.persistKey === 'string' && options.persistKey.trim()
      ? options.persistKey.trim()
      : 'aiTutorThemeInverted'

  const originals = new WeakMap()
  let observer = null

  function readPersisted() {
    try {
      const v = localStorage.getItem(persistKey)
      return v === '1' || v === 'true'
    } catch {
      return false
    }
  }

  function writePersisted(next) {
    try {
      localStorage.setItem(persistKey, next ? '1' : '0')
    } catch {
      // 忽略：无痕/隐私模式可能写入失败
    }
  }

  function record(el, prop, value) {
    let map = originals.get(el)
    if (!map) {
      map = new Map()
      originals.set(el, map)
    }
    if (!map.has(prop)) map.set(prop, value)
  }

  function applyToElement(el) {
    if (!(el instanceof HTMLElement)) return

    const cs = getComputedStyle(el)
    const neutralBg = isNeutralBackground(cs)

    for (const prop of COLOR_PROPS) {
      const current = cs[prop]
      const parsed = parseRgb(current)
      if (!shouldInvertNeutral(parsed)) continue

      // 避免“蓝色等强调背景”上的文字颜色被强行取反导致可读性下降
      if ((prop === 'color' || prop === 'caretColor') && !neutralBg) continue

      record(el, prop, el.style[prop])
      const inverted = invertNeutralColor(parsed)
      el.style[prop] = rgbaToString(inverted)
    }

    for (const prop of STRING_COLOR_PROPS) {
      const current = cs[prop]
      if (!current || current === 'none') continue

      const next = replaceRgbInString(current, (parsed) => {
        if (!shouldInvertNeutral(parsed)) return null
        return invertNeutralColor(parsed)
      })

      if (next !== current) {
        record(el, prop, el.style[prop])
        el.style[prop] = next
      }
    }
  }

  function applyAll() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root) return

    applyToElement(root)
    const all = root.querySelectorAll('*')
    for (const el of all) applyToElement(el)
  }

  function restoreAll() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root) return

    const all = [root, ...root.querySelectorAll('*')]
    for (const el of all) {
      const map = originals.get(el)
      if (!map) continue
      for (const [prop, value] of map.entries()) {
        // value 是“原本的 inline style 值”（可能为空字符串）
        el.style[prop] = value
      }
      originals.delete(el)
    }
  }

  function startObserver() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root) return
    if (observer) return

    observer = new MutationObserver((mutations) => {
      if (!isDark.value) return
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          applyToElement(node)
          for (const el of node.querySelectorAll?.('*') || []) applyToElement(el)
        }
      }
    })
    observer.observe(root, { childList: true, subtree: true })
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  function enable() {
    applyAll()
    startObserver()
    isDark.value = true
    writePersisted(true)
  }

  function disable() {
    stopObserver()
    restoreAll()
    isDark.value = false
    writePersisted(false)
  }

  function toggleDark() {
    if (isDark.value) disable()
    else enable()
  }

  onUnmounted(() => {
    stopObserver()
  })

  onMounted(() => {
    if (readPersisted()) {
      // 等一帧，确保初次渲染完成，避免漏扫
      requestAnimationFrame(() => {
        enable()
      })
    }
  })

  return {
    isDark,
    enable,
    disable,
    toggleDark
  }
}

