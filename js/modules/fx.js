/**
 * Loud effects for the portfolio: text that scrambles and decodes, cards that tilt toward the pointer,
 * and a faint falling-code backdrop. All of it is skipped for visitors who prefer reduced motion,
 * and none of it changes what screen readers or search engines see (the real text stays in the page).
 */
import { prefersReducedMotion } from './motion.js'
import { resolvePortfolioUrl } from './utils.js'

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+<>/\\=?'
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

// Replaces an element's text with a scrambled copy that decodes left to right.
// The final text stays in a visually hidden span so assistive technology reads it normally.
export const scrambleText = (element, { duration = 2000, caret = false } = {}) => {
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
    ['#hero-title', { caret: true, delay: 700 }],
    ['#hero-tagline', { delay: 1900 }],
    ['.page-title', { caret: true, delay: 400 }],
    ['#project-main-title', { caret: true, delay: 400 }],
    ['.about-sidebar-name', { delay: 500 }],
    ['.about-sidebar-tagline', { delay: 1500 }]
  ]
  onLoad.forEach(([selector, options]) => {
    const element = document.querySelector(selector)
    if (!element) return
    setTimeout(() => scrambleText(element, options), options.delay || 0)
  })

  // Hovering any of these decodes them again.
  const onHover = '#hero-title, #hero-tagline, .page-title, .about-sidebar-name, .about-sidebar-tagline, .nav-title, .home-section-head h2'
  document.querySelectorAll(onHover).forEach((element) => {
    element.addEventListener('pointerenter', () => scrambleText(element, { duration: 1100 }))
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
      speed: 0.06 + Math.random() * 0.14,
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
        drop.speed = 0.06 + Math.random() * 0.14
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

const FINE_POINTER = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

// Page wipe: a red panel sweeps up over the page on a same-site link click, and away again on the next page
// (the next page's head script adds `fx-arrive` when it sees the flag set here).
const initWipe = () => {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest?.('a[href]')
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
    const url = new URL(link.href, window.location.href)
    if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return
    if (url.pathname === window.location.pathname && url.search === window.location.search) return
    event.preventDefault()
    try { window.sessionStorage.setItem('fx-wipe', '1') } catch { /* storage unavailable */ }
    document.documentElement.classList.add('fx-leaving')
    window.setTimeout(() => { window.location.href = url.href }, 560)
  })
  // Coming back with the browser's back button can restore the page mid-wipe.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.documentElement.classList.remove('fx-leaving')
  })
}

// A slow loop of skills across the page, built from the same content file the About page uses.
const initTicker = async () => {
  const anchor = document.getElementById('footer')
  if (!anchor || !(document.getElementById('portfolio-header') || document.getElementById('about-section'))) return
  let names = []
  try {
    const response = await fetch(resolvePortfolioUrl('./content/site/about.json'))
    const data = await response.json()
    names = [...new Set((data.skills?.pages || []).flatMap((page) => (page.skills || []).map((skill) => skill.name)))]
  } catch { return }
  if (names.length < 4) return

  const ticker = document.createElement('section')
  ticker.className = 'fx-ticker'
  ticker.setAttribute('aria-hidden', 'true')
  const track = document.createElement('div')
  track.className = 'fx-ticker-track'
  for (let copy = 0; copy < 2; copy += 1) {
    const group = document.createElement('span')
    group.className = 'fx-ticker-group'
    for (let repeat = 0; repeat < 2; repeat += 1) {
      names.forEach((name) => {
        const item = document.createElement('span')
        item.className = 'fx-ticker-item'
        item.textContent = name
        group.append(item)
      })
    }
    track.append(group)
  }
  ticker.append(track)
  anchor.before(ticker)
}

// ---- Parts that use GSAP (loaded only when needed) ----

const loadScript = (src) => new Promise((resolve, reject) => {
  const script = document.createElement('script')
  script.src = src
  script.async = true
  script.onload = resolve
  script.onerror = reject
  document.head.append(script)
})

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), ms))
])

const loadGsap = async () => {
  try {
    if (!window.gsap) await withTimeout(loadScript(resolvePortfolioUrl('./assets/vendor/gsap/gsap.min.js')), 6000)
    if (!window.ScrollTrigger) await withTimeout(loadScript(resolvePortfolioUrl('./assets/vendor/gsap/ScrollTrigger.min.js')), 6000)
    window.gsap.registerPlugin(window.ScrollTrigger)
    return window.gsap
  } catch {
    return null
  }
}

// A red bar along the top fills as you scroll down the page.
const initProgress = (gsap) => {
  const bar = document.createElement('div')
  bar.className = 'fx-progress'
  bar.setAttribute('aria-hidden', 'true')
  document.body.append(bar)
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })
}

// Images drift at a different speed from the page.
const initParallax = (gsap) => {
  document.querySelectorAll('.home-research-media img').forEach((image) => {
    gsap.fromTo(image, { scale: 1.08, yPercent: -4 }, {
      yPercent: 4,
      ease: 'none',
      scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    })
  })
  document.querySelectorAll('.project-header-image').forEach((image) => {
    gsap.fromTo(image, { y: -14 }, {
      y: 14,
      ease: 'none',
      scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    })
  })
}

// Buttons and icon links lean toward the pointer as it comes near.
const initMagnets = (gsap) => {
  if (!FINE_POINTER()) return
  const items = [...document.querySelectorAll('a.button, .hero-social-link, a.icon-link, .about-sidebar-links a, .site-header .nav-cta')]
    .map((element) => ({
      element,
      x: gsap.quickTo(element, 'x', { duration: 0.7, ease: 'power3.out' }),
      y: gsap.quickTo(element, 'y', { duration: 0.7, ease: 'power3.out' })
    }))
  if (!items.length) return
  let frame = 0
  let pointerX = 0
  let pointerY = 0
  const update = () => {
    frame = 0
    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect()
      const dx = pointerX - (rect.left + rect.width / 2)
      const dy = pointerY - (rect.top + rect.height / 2)
      const reach = Math.max(rect.width, rect.height) / 2 + 70
      if (Math.hypot(dx, dy) < reach) {
        item.x(dx * 0.28)
        item.y(dy * 0.28)
      } else {
        item.x(0)
        item.y(0)
      }
    })
  }
  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX
    pointerY = event.clientY
    if (!frame) frame = window.requestAnimationFrame(update)
  }, { passive: true })
}

// A red ring follows the mouse with a little lag and swells over anything clickable.
const initCursor = (gsap) => {
  if (!FINE_POINTER()) return
  const ring = document.createElement('div')
  ring.className = 'fx-cursor'
  ring.setAttribute('aria-hidden', 'true')
  document.body.append(ring)
  gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100 })
  const moveX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
  const moveY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })
  window.addEventListener('pointermove', (event) => {
    moveX(event.clientX)
    moveY(event.clientY)
    ring.classList.add('is-visible')
  }, { passive: true })
  document.addEventListener('pointerover', (event) => {
    ring.classList.toggle('is-active', Boolean(event.target.closest?.('a, button, [role="button"]')))
  })
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'))
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'))
  document.documentElement.addEventListener('mouseleave', () => ring.classList.remove('is-visible'))
}

const safely = (label, task) => {
  try {
    const result = task()
    if (result?.catch) result.catch((error) => console.warn(`fx: ${label} failed`, error))
  } catch (error) {
    console.warn(`fx: ${label} failed`, error)
  }
}

export const initFx = () => {
  if (prefersReducedMotion()) return
  safely('scramble', initScramble)
  safely('tilt', initTilt)
  safely('code rain', initCodeRain)
  safely('wipe', initWipe)
  safely('ticker', initTicker)
  loadGsap().then((gsap) => {
    if (!gsap) return
    safely('progress', () => initProgress(gsap))
    safely('parallax', () => initParallax(gsap))
    safely('magnets', () => initMagnets(gsap))
    safely('cursor', () => initCursor(gsap))
  })
}
