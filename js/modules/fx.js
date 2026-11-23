/**
 * Loud effects for the portfolio: text that scrambles and decodes, cards that tilt toward the pointer,
 * and a faint falling-code backdrop. All of it is skipped for visitors who prefer reduced motion,
 * and none of it changes what screen readers or search engines see (the real text stays in the page).
 */
import { prefersReducedMotion } from './motion.js'

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+<>/\\=?'
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

// Replaces an element's text with a scrambled copy that decodes left to right.
// The final text stays in a visually hidden span so assistive technology reads it normally.
export const scrambleText = (element, { duration = 950, caret = false } = {}) => {
  const final = (element.dataset.fxText || element.textContent || '').trim()
  if (!final || element.dataset.fxRunning === '1') return
  element.dataset.fxText = final
  element.dataset.fxRunning = '1'

  let visual = element.querySelector(':scope > .fx-visual')
  if (!visual) {
    element.textContent = ''
    const readable = document.createElement('span')
    readable.className = 'fx-sr'
    readable.textContent = final
    visual = document.createElement('span')
    visual.className = 'fx-visual'
    visual.setAttribute('aria-hidden', 'true')
    element.append(readable, visual)
    if (caret) {
      const mark = document.createElement('span')
      mark.className = 'fx-caret'
      mark.setAttribute('aria-hidden', 'true')
      element.append(mark)
    }
  }

  const chars = [...final]
  const revealAt = chars.map((_, index) => (index / chars.length) * duration * 0.65 + Math.random() * duration * 0.35)
  const started = performance.now()
  element.classList.add('fx-scrambling')
  visual.textContent = chars.map((char) => (char === ' ' ? ' ' : randomGlyph())).join('')

  const tick = () => {
    const elapsed = performance.now() - started
    let output = ''
    let finished = true
    chars.forEach((char, index) => {
      if (char === ' ' || elapsed >= revealAt[index]) output += char
      else {
        output += randomGlyph()
        finished = false
      }
    })
    visual.textContent = output
    if (!finished) {
      requestAnimationFrame(tick)
      return
    }
    element.classList.remove('fx-scrambling')
    element.dataset.fxRunning = '0'
  }
  requestAnimationFrame(tick)
}

const initScramble = () => {
  const onLoad = [
    ['#hero-title', { caret: true }],
    ['#hero-tagline', { delay: 250 }],
    ['.page-title', { caret: true }],
    ['#project-main-title', { caret: true }],
    ['.about-sidebar-name', {}],
    ['.about-sidebar-tagline', { delay: 250 }]
  ]
  onLoad.forEach(([selector, options]) => {
    const element = document.querySelector(selector)
    if (!element) return
    setTimeout(() => scrambleText(element, options), options.delay || 0)
  })

  // Hovering any of these decodes them again.
  const onHover = '#hero-title, #hero-tagline, .page-title, .about-sidebar-name, .about-sidebar-tagline, .nav-title, .home-section-head h2'
  document.querySelectorAll(onHover).forEach((element) => {
    element.addEventListener('pointerenter', () => scrambleText(element, { duration: 600 }))
  })
}

// Cards tilt a few degrees toward the pointer (mouse and trackpad only).
const initTilt = () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  document.querySelectorAll('.home-card').forEach((card) => {
    card.classList.add('fx-tilt')
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      card.style.setProperty('--fx-ry', `${(x * 9).toFixed(2)}deg`)
      card.style.setProperty('--fx-rx', `${(-y * 9).toFixed(2)}deg`)
    })
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--fx-rx')
      card.style.removeProperty('--fx-ry')
    })
  })
}

// A faint backdrop of falling code. Drawn at about 24 fps, paused when the tab is hidden, off on small screens.
const initCodeRain = () => {
  if (window.innerWidth < 700 || navigator.connection?.saveData) return
  const canvas = document.createElement('canvas')
  canvas.className = 'fx-rain'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.prepend(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const SIZE = 16
  const TRAIL = 13
  const CHARS = '01{}[]<>/\\$#%&=+*;:ABCDEF'
  let columns = []
  let width = 0
  let height = 0

  const resize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    const count = Math.floor(width / SIZE)
    columns = Array.from({ length: count }, () => ({
      row: -Math.random() * (height / SIZE),
      speed: 0.18 + Math.random() * 0.4,
      active: Math.random() < 0.38
    }))
    ctx.font = `${SIZE - 2}px monospace`
  }

  // The same cell always shows the same character, so the trail does not flicker.
  const glyphAt = (column, row) => CHARS[(column * 31 + row * 17 + (column ^ row)) % CHARS.length]

  let last = 0
  let running = true
  const draw = (now) => {
    if (!running) return
    requestAnimationFrame(draw)
    if (now - last < 1000 / 24) return
    last = now
    ctx.clearRect(0, 0, width, height)
    const rows = height / SIZE
    columns.forEach((drop, column) => {
      if (!drop.active) return
      drop.row += drop.speed
      const head = Math.floor(drop.row)
      for (let k = 0; k < TRAIL; k += 1) {
        const row = head - k
        if (row < 0 || row > rows) continue
        const alpha = k === 0 ? 0.95 : (1 - k / TRAIL) * 0.55
        ctx.fillStyle = `rgba(179, 38, 30, ${alpha.toFixed(3)})`
        ctx.fillText(glyphAt(column, row), column * SIZE, row * SIZE)
      }
      if (head - TRAIL > rows) {
        drop.row = -Math.random() * 20
        drop.speed = 0.18 + Math.random() * 0.4
      }
    })
  }

  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden
    if (running) requestAnimationFrame(draw)
  })
  requestAnimationFrame(draw)
}

export const initFx = () => {
  if (prefersReducedMotion()) return
  initScramble()
  initTilt()
  initCodeRain()
}
