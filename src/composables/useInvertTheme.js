import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 全局颜色取反主题（扫描文字/背景/边框/阴影/渐变 + 图片滤镜）
 *
 * 目标：
 * - 纯黑 -> 纯白、纯白 -> 纯黑
 * - 浅蓝 -> 深蓝（保持色相与饱和度，反转亮度）
 * - 同时处理图片：对 <img>/<svg>/<video>/<canvas> 等应用滤镜取反
 *
 * 注意：
 * - 这是运行时扫描 + 写入 inline style 的方案，不需要为每个新组件手写暗色 CSS
 * - 不记录/不输出任何密钥信息
 */

const LOG_ENDPOINT =
  'http://127.0.0.1:7244/ingest/6da02d2c-eddb-414c-ba5e-278b852814ec'

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'caretColor',
  // SVG 常见颜色属性（computedStyle 可读）
  'fill',
  'stroke',
  'stopColor'
]

const STRING_COLOR_PROPS = ['backgroundImage', 'boxShadow', 'textShadow']

// 这些“选中态/激活态”的高亮颜色会随着交互变化（class 切换）。
// 如果在首次扫描时把它们的 computedStyle 写进缓存表，会导致：
// - 选中高亮被“锁死”在某个元素上（即使后来取消选中）
// - 新选中的元素无法正确高亮（被旧的 inline 覆盖）
// 解决：将这些上下文标记为 dynamic，取反时实时计算，并在 class 变化时重建。
const DYNAMIC_CONTEXT_SELECTOR = [
  // 当前对话高亮（侧边栏）
  '.chat-item.active',
  '.chat-item.is-active',
  '.chat-item.selected',
  '.chat-item.is-selected',
  // Element Plus 单选框/按钮选中态
  '.el-radio.is-checked',
  '.el-radio__input.is-checked',
  '.el-radio-button.is-active',
  // 兜底：常见激活态
  '.is-active',
  '.is-checked'
].join(',')

function inDynamicContext(el) {
  if (!(el instanceof Element)) return false
  try {
    return !!el.closest(DYNAMIC_CONTEXT_SELECTOR)
  } catch {
    return false
  }
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

function parseRgb(colorStr) {
  if (!colorStr) return null
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

function invertRgbaByLightness(rgba) {
  const hsl = rgbToHsl(rgba)
  const inverted = hslToRgb({ h: hsl.h, s: hsl.s, l: 1 - hsl.l })
  return { ...inverted, a: rgba.a }
}

function srgbToLinear(v) {
  const x = v / 255
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

function relativeLuminance({ r, g, b }) {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(rgb1, rgb2) {
  const L1 = relativeLuminance(rgb1)
  const L2 = relativeLuminance(rgb2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function findEffectiveBackgroundColor(el) {
  // 从当前元素向上找第一个不透明背景色；找不到就按白色处理
  let cur = el
  while (cur && cur instanceof Element) {
    const cs = getComputedStyle(cur)
    const bg = parseRgb(cs.backgroundColor)
    if (bg && bg.a > 0.05) return bg
    cur = cur.parentElement
  }
  return { r: 255, g: 255, b: 255, a: 1 }
}

function adjustTextForContrast(invertedTextRgba, bgRgba, minRatio = 4.5) {
  // 仅对不透明文字做校正
  const txt = { r: invertedTextRgba.r, g: invertedTextRgba.g, b: invertedTextRgba.b }
  const bg = { r: bgRgba.r, g: bgRgba.g, b: bgRgba.b }
  let ratio = contrastRatio(txt, bg)
  if (ratio >= minRatio) return invertedTextRgba

  const hsl = rgbToHsl(invertedTextRgba)
  const bgLum = relativeLuminance(bg)

  // 背景偏亮 -> 把字往更暗推；背景偏暗 -> 把字往更亮推
  const targetDir = bgLum > 0.5 ? -1 : 1
  let best = { ...invertedTextRgba }
  let bestRatio = ratio

  // 小步调整亮度，找达到阈值或最优的
  for (let i = 1; i <= 20; i++) {
    const step = i * 0.03 * targetDir
    const nextL = clamp01(hsl.l + step)
    const nextRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: nextL })
    const next = { ...nextRgb, a: invertedTextRgba.a }
    const nextRatio = contrastRatio(nextRgb, bg)
    if (nextRatio > bestRatio) {
      bestRatio = nextRatio
      best = next
    }
    if (nextRatio >= minRatio) return next
  }

  return best
}

function replaceRgbInString(str, replacer) {
  if (!str || str === 'none') return str
  return str.replace(/rgba?\([^)]+\)/gi, (match) => {
    const parsed = parseRgb(match)
    const next = replacer(parsed)
    return next ? rgbaToString(next) : match
  })
}

function isImageLike(el) {
  if (!(el instanceof Element)) return false
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'IMG' || tag === 'SVG' || tag === 'VIDEO' || tag === 'CANVAS'
}

export function useInvertTheme(options = {}) {
  const isInverted = ref(false)
  const rootSelector =
    typeof options.rootSelector === 'string' ? options.rootSelector : 'html'
  const storageKey =
    typeof options.storageKey === 'string' && options.storageKey.trim()
      ? options.storageKey.trim()
      : 'aiTutorThemeInverted'

  function readStoredInverted() {
    try {
      const v = localStorage.getItem(storageKey)
      if (v === null || v === undefined) return null
      const s = String(v).toLowerCase()
      if (s === '1' || s === 'true') return true
      if (s === '0' || s === 'false') return false
      return null
    } catch {
      return null
    }
  }

  function writeStoredInverted(next) {
    try {
      localStorage.setItem(storageKey, next ? '1' : '0')
    } catch {
      // ignore
    }
  }

  // “结构体”：缓存每个元素的原始/取反后的颜色数据（首次构建，之后每次点击直接应用缓存）
  // Map<Element, { props: Map<prop,{origInline,inv}>, stringProps: Map<prop,{origInline,inv}>, filter?: {origInline,inv} }>
  const colorTable = new Map()

  const originals = new WeakMap()
  let observer = null

  function log(location, message, data, hypothesisId = 'T') {
    // #region agent log
    fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        message,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId
      })
    }).catch(() => {})
    // #endregion
  }

  function record(el, prop, value) {
    let map = originals.get(el)
    if (!map) {
      map = new Map()
      originals.set(el, map)
    }
    if (!map.has(prop)) map.set(prop, value)
  }

  function buildEntry(el) {
    if (!(el instanceof Element)) return null
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return null

    const entry = {
      dynamic: inDynamicContext(el),
      props: new Map(),
      stringProps: new Map(),
      filter: null
    }

    // dynamic 节点：不在首次扫描时固定 inv（避免锁死选中态颜色）
    // inv 在 applyEntry 时根据当前 computedStyle 实时计算
    if (entry.dynamic) return entry

    const cs = getComputedStyle(el)
    const effectiveBg = findEffectiveBackgroundColor(el)
    const invertedBg = invertRgbaByLightness(effectiveBg)

    for (const prop of COLOR_PROPS) {
      const current = cs[prop]
      const parsed = parseRgb(current)
      if (!parsed) continue
      if (parsed.a <= 0.01) continue

      let inverted = invertRgbaByLightness(parsed)
      if (prop === 'color' || prop === 'caretColor') {
        inverted = adjustTextForContrast(inverted, invertedBg, 4.5)
      }

      entry.props.set(prop, {
        origInline: el.style[prop],
        inv: rgbaToString(inverted)
      })
    }

    for (const prop of STRING_COLOR_PROPS) {
      const current = cs[prop]
      if (!current || current === 'none') continue
      const next = replaceRgbInString(current, (parsed) =>
        parsed && parsed.a > 0.01 ? invertRgbaByLightness(parsed) : null
      )
      if (next !== current) {
        entry.stringProps.set(prop, {
          origInline: el.style[prop],
          inv: next
        })
      }
    }

    if (isImageLike(el)) {
      const existing = el.style.filter || ''
      const inv = `${existing ? existing + ' ' : ''}invert(1) hue-rotate(180deg)`
      entry.filter = { origInline: el.style.filter, inv }
    }

    return entry
  }

  function applyDynamicToElement(el, entry, stats) {
    const cs = getComputedStyle(el)
    const effectiveBg = findEffectiveBackgroundColor(el)
    const invertedBg = invertRgbaByLightness(effectiveBg)

    for (const prop of COLOR_PROPS) {
      const current = cs[prop]
      const parsed = parseRgb(current)
      if (!parsed) continue
      if (parsed.a <= 0.01) continue

      if (!entry.props.has(prop)) {
        entry.props.set(prop, { origInline: el.style[prop] })
      }

      let inverted = invertRgbaByLightness(parsed)
      if (prop === 'color' || prop === 'caretColor') {
        inverted = adjustTextForContrast(inverted, invertedBg, 4.5)
      }
      el.style[prop] = rgbaToString(inverted)
      stats.colorsChanged++
    }

    for (const prop of STRING_COLOR_PROPS) {
      const current = cs[prop]
      if (!current || current === 'none') continue
      const next = replaceRgbInString(current, (parsed) =>
        parsed && parsed.a > 0.01 ? invertRgbaByLightness(parsed) : null
      )
      if (next !== current) {
        if (!entry.stringProps.has(prop)) {
          entry.stringProps.set(prop, { origInline: el.style[prop] })
        }
        el.style[prop] = next
        stats.stringColorsChanged++
      }
    }

    if (isImageLike(el)) {
      const existing = el.style.filter || ''
      if (!existing.includes('invert(')) {
        if (!entry.filter) entry.filter = { origInline: el.style.filter }
        el.style.filter = `${existing ? existing + ' ' : ''}invert(1) hue-rotate(180deg)`
        stats.imagesFiltered++
      }
    }
  }

  function restoreElementFromEntry(el, entry) {
    if (!entry) return
    for (const [prop, rec] of entry.props.entries()) el.style[prop] = rec.origInline
    for (const [prop, rec] of entry.stringProps.entries()) el.style[prop] = rec.origInline
    if (entry.filter) el.style.filter = entry.filter.origInline
  }

  function applyEntry(el, entry, stats) {
    if (!entry) return

    // 记录一次原始 inline 值（用于 restoreAll 的兜底）
    for (const [prop, rec] of entry.props.entries()) {
      record(el, prop, rec.origInline)
    }
    for (const [prop, rec] of entry.stringProps.entries()) {
      record(el, prop, rec.origInline)
    }
    if (entry.filter) record(el, 'filter', entry.filter.origInline)

    if (isInverted.value) {
      if (entry.dynamic) {
        applyDynamicToElement(el, entry, stats)
      } else {
        // 应用取反值（静态缓存）
        for (const [prop, rec] of entry.props.entries()) {
          el.style[prop] = rec.inv
          stats.colorsChanged++
        }
        for (const [prop, rec] of entry.stringProps.entries()) {
          el.style[prop] = rec.inv
          stats.stringColorsChanged++
        }
        if (entry.filter) {
          el.style.filter = entry.filter.inv
          stats.imagesFiltered++
        }
      }
    } else {
      // 恢复原始 inline（结构体保存的是“原始 inline”，为空串则代表清除）
      for (const [prop, rec] of entry.props.entries()) el.style[prop] = rec.origInline
      for (const [prop, rec] of entry.stringProps.entries()) el.style[prop] = rec.origInline
      if (entry.filter) el.style.filter = entry.filter.origInline
    }
  }

  function ensureEntry(el) {
    const existing = colorTable.get(el)
    if (existing) return existing
    const entry = buildEntry(el)
    if (entry) colorTable.set(el, entry)
    return entry
  }

  function applyToElement(el, stats) {
    if (!(el instanceof Element)) return
    // HTMLElement / SVGElement 都支持 getComputedStyle 与 style（SVG 为 SVGAnimatedString 场景下也可用 CSS）
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return
    const entry = ensureEntry(el)
    applyEntry(el, entry, stats)
  }

  function applyAll() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root) return

    const t0 = performance.now()
    const stats = {
      elements: 0,
      colorsChanged: 0,
      stringColorsChanged: 0,
      imagesFiltered: 0
    }

    // 第一次点击时：先构建结构体（全量扫描一次）
    if (colorTable.size === 0) {
      const buildRoot = root instanceof Element ? root : document.documentElement
      const allToBuild = [buildRoot, ...buildRoot.querySelectorAll('*')]
      for (const el of allToBuild) {
        if (!(el instanceof Element)) continue
        if (colorTable.has(el)) continue
        const entry = buildEntry(el)
        if (entry) colorTable.set(el, entry)
      }
      log(
        'useInvertTheme.js:build',
        'built color table',
        { entries: colorTable.size },
        'T'
      )
    }

    if (root instanceof Element) {
      stats.elements++
      applyToElement(root, stats)
    }
    const all = root.querySelectorAll('*')
    stats.elements += all.length
    for (const el of all) applyToElement(el, stats)

    const dt = Math.round(performance.now() - t0)
    log(
      'useInvertTheme.js:applyAll',
      'applied inversion',
      { ...stats, durationMs: dt },
      'T'
    )
  }

  function restoreAll() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root) return

    const t0 = performance.now()
    let restoredProps = 0

    const all = [root, ...root.querySelectorAll('*')]
    for (const el of all) {
      if (!(el instanceof Element)) continue
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue
      const entry = colorTable.get(el)
      if (entry) {
        for (const [prop, rec] of entry.props.entries()) {
          el.style[prop] = rec.origInline
          restoredProps++
        }
        for (const [prop, rec] of entry.stringProps.entries()) {
          el.style[prop] = rec.origInline
          restoredProps++
        }
        if (entry.filter) {
          el.style.filter = entry.filter.origInline
          restoredProps++
        }
        continue
      }

      // 兜底：老的 originals
      const map = originals.get(el)
      if (!map) continue
      for (const [prop, value] of map.entries()) {
        el.style[prop] = value
        restoredProps++
      }
      originals.delete(el)
    }

    const dt = Math.round(performance.now() - t0)
    log(
      'useInvertTheme.js:restoreAll',
      'restored inversion',
      { restoredProps, durationMs: dt },
      'T'
    )
  }

  function startObserver() {
    const root = document.querySelector(rootSelector) || document.body
    if (!root || observer) return

    observer = new MutationObserver((mutations) => {
      if (!isInverted.value) return
      const stats = { colorsChanged: 0, stringColorsChanged: 0, imagesFiltered: 0 }
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (!(node instanceof Element)) continue
            const targets = [node, ...(node.querySelectorAll?.('*') || [])]
            for (const el of targets) {
              if (!(el instanceof Element)) continue
              if (!colorTable.has(el)) {
                const entry = buildEntry(el)
                if (entry) colorTable.set(el, entry)
              }
              applyToElement(el, stats)
            }
          }
        } else if (m.type === 'attributes' && m.attributeName === 'class') {
          const node = m.target
          if (!(node instanceof Element)) continue

          // class 变化意味着“选中态/激活态”可能切换：先把旧 entry 还原并移除，再重建并应用
          const targets = [node, ...(node.querySelectorAll?.('*') || [])]
          for (const el of targets) {
            const old = colorTable.get(el)
            if (old) {
              restoreElementFromEntry(el, old)
              colorTable.delete(el)
            }
          }
          for (const el of targets) {
            if (!colorTable.has(el)) {
              const entry = buildEntry(el)
              if (entry) colorTable.set(el, entry)
            }
            applyToElement(el, stats)
          }
        }
      }
      if (stats.colorsChanged || stats.stringColorsChanged || stats.imagesFiltered) {
        log(
          'useInvertTheme.js:observer',
          'applied to added nodes',
          stats,
          'T'
        )
      }
    })
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  function enable() {
    log('useInvertTheme.js:enable', 'toggle on', {}, 'T')
    isInverted.value = true
    writeStoredInverted(true)
    applyAll()
    startObserver()
  }

  function disable() {
    log('useInvertTheme.js:disable', 'toggle off', {}, 'T')
    isInverted.value = false
    writeStoredInverted(false)
    stopObserver()
    restoreAll()
  }

  function toggle() {
    if (isInverted.value) disable()
    else enable()
  }

  onUnmounted(() => {
    stopObserver()
  })

  // 启动时恢复上一次主题选择
  const initial = readStoredInverted()
  if (initial === true) {
    onMounted(() => {
      // 避免在 DOM 未挂载时就扫描
      enable()
    })
  }

  return { isInverted, enable, disable, toggle }
}

