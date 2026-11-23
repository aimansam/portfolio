/**
 * Effects for the portfolio, themed as an intrusion: text that scrambles and decodes, a falling-code backdrop
 * that lights up around the pointer, cards that tilt toward it, headings that decode and
 * rules that draw in as you scroll, a skills ticker driven by scroll speed, and a two-layer page wipe.
 * All of it is skipped for visitors who prefer reduced motion, and none of it changes what screen readers
 * or search engines see (the real text stays in the page).
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
    ['#hero-title', { caret: true, delay: 300 }],
    ['#hero-tagline', { delay: 1100 }],
    ['.page-title', { caret: true, delay: 250 }],
    ['#project-main-title', { caret: true, delay: 250 }],
    ['.about-sidebar-name', { delay: 300 }],
    ['.about-sidebar-tagline', { delay: 1000 }]
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

// A backdrop of falling code that is only faintly there until the pointer comes near, then lights up in a
// spotlight around it (cells inside it also flicker). About 24 fps, paused when the tab is hidden, off on small screens.
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
  const TRAIL = 14
  const RADIUS = 260
  const AMBIENT = 0.2
  const CHARS = '01{}[]<>/\\$#%&=+*;:ABCDEF'
  let columns = []
  let width = 0
  let height = 0
  let pointerX = -9999
  let pointerY = -9999

  const resize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    const count = Math.floor(width / SIZE)
    columns = Array.from({ length: count }, () => ({
      row: -Math.random() * (height / SIZE),
      speed: 0.08 + Math.random() * 0.18,
      active: Math.random() < 0.62
    }))
    ctx.font = `${SIZE - 2}px monospace`
  }

  // The same cell always shows the same character, so the trail does not flicker (except in the spotlight).
  const glyphAt = (column, row, shift) => CHARS[(column * 31 + row * 17 + (column ^ row) + shift) % CHARS.length]

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX
    pointerY = event.clientY
  }, { passive: true })
  document.documentElement.addEventListener('mouseleave', () => {
    pointerX = -9999
    pointerY = -9999
  })

  let last = 0
  let frame = 0
  let running = true
  const draw = (now) => {
    if (!running) return
    requestAnimationFrame(draw)
    if (now - last < 1000 / 24) return
    last = now
    frame += 1
    ctx.clearRect(0, 0, width, height)
    const rows = height / SIZE
    // The spotlight: a field of code that fades in around the pointer, on top of the falling drops.
    if (pointerX > -999) {
      const first = Math.max(0, Math.floor((pointerX - RADIUS) / SIZE))
      const lastColumn = Math.min(columns.length - 1, Math.ceil((pointerX + RADIUS) / SIZE))
      const firstRow = Math.max(0, Math.floor((pointerY - RADIUS) / SIZE))
      const lastRow = Math.min(Math.ceil(rows), Math.ceil((pointerY + RADIUS) / SIZE))
      for (let column = first; column <= lastColumn; column += 1) {
        for (let row = firstRow; row <= lastRow; row += 1) {
          const x = column * SIZE
          const y = row * SIZE
          const near = 1 - Math.hypot(x + SIZE / 2 - pointerX, y - SIZE / 2 - pointerY) / RADIUS
          if (near <= 0) continue
          ctx.fillStyle = `rgba(179, 38, 30, ${(near * near * 0.46).toFixed(3)})`
          ctx.fillText(glyphAt(column, row, (frame >> 3) + ((column * 7 + row * 3) % 5)), x, y)
        }
      }
    }
    columns.forEach((drop, column) => {
      if (!drop.active) return
      drop.row += drop.speed
      const head = Math.floor(drop.row)
      const x = column * SIZE
      for (let k = 0; k < TRAIL; k += 1) {
        const row = head - k
        if (row < 0 || row > rows) continue
        const y = row * SIZE
        const near = Math.max(0, 1 - Math.hypot(x + SIZE / 2 - pointerX, y - pointerY) / RADIUS)
        const light = AMBIENT + (1 - AMBIENT) * near * near
        const alpha = (k === 0 ? 0.95 : (1 - k / TRAIL) * 0.6) * light
        if (alpha < 0.012) continue
        ctx.fillStyle = k === 0 && near > 0.35 ? `rgba(255, 96, 80, ${alpha.toFixed(3)})` : `rgba(179, 38, 30, ${alpha.toFixed(3)})`
        ctx.fillText(glyphAt(column, row, near > 0.15 ? frame >> 2 : 0), x, y)
      }
      if (head - TRAIL > rows) {
        drop.row = -Math.random() * 20
        drop.speed = 0.08 + Math.random() * 0.18
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

// Page wipe: a red panel and then an ink panel sweep up over the page on a same-site link click, and away again on the next page
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
    window.setTimeout(() => { window.location.href = url.href }, 700)
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
  ;[names, [...names].reverse()].forEach((list, index) => {
    const track = document.createElement('div')
    track.className = `fx-ticker-track${index ? ' is-reverse' : ''}`
    for (let copy = 0; copy < 2; copy += 1) {
      const group = document.createElement('span')
      group.className = 'fx-ticker-group'
      for (let repeat = 0; repeat < 2; repeat += 1) {
        list.forEach((name) => {
          const item = document.createElement('span')
          item.className = 'fx-ticker-item'
          item.textContent = name
          group.append(item)
        })
      }
      track.append(group)
    }
    ticker.append(track)
  })
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
      const reach = Math.max(rect.width, rect.height) / 2 + 90
      if (Math.hypot(dx, dy) < reach) {
        item.x(dx * 0.38)
        item.y(dy * 0.38)
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

// Cursor labels: pointing at a card or a row shows what clicking it does.
const CURSOR_LABELS = [
  ['.home-card, .project-card', 'View'],
  ['.home-row, .blog-preview-card, .home-research a', 'Read'],
  ['.gallery-masonry-item', 'Open']
]

// A red ring follows the mouse with a little lag, swells over anything clickable and names cards and rows.
const initCursor = (gsap) => {
  if (!FINE_POINTER()) return
  const ring = document.createElement('div')
  ring.className = 'fx-cursor'
  ring.setAttribute('aria-hidden', 'true')
  const label = document.createElement('span')
  label.className = 'fx-cursor-label'
  ring.append(label)
  document.body.append(ring)
  const dot = document.createElement('div')
  dot.className = 'fx-cursor-dot'
  dot.setAttribute('aria-hidden', 'true')
  document.body.append(dot)
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50, x: -100, y: -100 })
  const moveX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
  const moveY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' })
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' })
  window.addEventListener('pointermove', (event) => {
    moveX(event.clientX)
    moveY(event.clientY)
    dotX(event.clientX)
    dotY(event.clientY)
    ring.classList.add('is-visible')
    dot.classList.add('is-visible')
  }, { passive: true })
  document.addEventListener('pointerover', (event) => {
    const target = event.target
    const match = CURSOR_LABELS.find(([selector]) => target.closest?.(selector))
    label.textContent = match ? match[1] : ''
    ring.classList.toggle('has-label', Boolean(match))
    ring.classList.toggle('is-active', !match && Boolean(target.closest?.('a, button, [role="button"]')))
  })
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'))
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'))
  document.documentElement.addEventListener('mouseleave', () => {
    ring.classList.remove('is-visible')
    dot.classList.remove('is-visible')
  })
}

// Headings decode as they scroll into view, and section rules draw in from the left.
const initScrollText = (gsap) => {
  const headings = document.querySelectorAll('.home-section-head h2, .home-research-title, .home-contact-title, .about-card-title, .project-body h2')
  headings.forEach((heading) => {
    if (heading.children.length || heading.dataset.fxRunning) return
    window.ScrollTrigger.create({
      trigger: heading,
      start: 'top 88%',
      once: true,
      onEnter: () => scrambleText(heading, { duration: 1000 })
    })
  })
  document.querySelectorAll('.home-section-head').forEach((head) => {
    head.classList.add('fx-line')
    window.ScrollTrigger.create({
      trigger: head,
      start: 'top 92%',
      once: true,
      onEnter: () => head.classList.add('fx-drawn')
    })
  })
}

// The skills ticker runs on scroll speed: it speeds up and skews while you scroll, and its two rows pull in opposite directions.
const initTickerMotion = (gsap) => {
  const tracks = [...document.querySelectorAll('.fx-ticker-track')]
  if (!tracks.length) return
  const state = tracks.map((track, index) => ({
    track,
    direction: index % 2 ? 1 : -1,
    x: 0,
    base: index % 2 ? 38 : 52,
    setSkew: gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' })
  }))
  state.forEach(({ track }) => track.classList.add('is-driven'))
  let boost = 0
  let push = 1
  window.ScrollTrigger.create({
    onUpdate: (self) => {
      boost = Math.max(boost, Math.abs(self.getVelocity()))
      push = self.direction
    }
  })
  gsap.ticker.add((_time, delta) => {
    const seconds = Math.min(delta, 100) / 1000
    boost *= 0.94
    const skew = Math.max(-10, Math.min(10, (boost / 160) * push))
    state.forEach((row) => {
      const half = row.track.scrollWidth / 2
      if (!half) return
      row.x += row.direction * (row.base + boost * 0.55) * seconds
      if (row.x <= -half) row.x += half
      if (row.x >= 0) row.x -= half
      gsap.set(row.track, { x: row.x })
      row.setSkew(skew * row.direction)
    })
  })
}

const safely = (label, task) => {
  try {
    const result = task()
    if (result?.catch) result.catch((error) => console.warn(`fx: ${label} failed`, error))
  } catch (error) {
    console.warn(`fx: ${label} failed`, error)
  }
}

export const initFx = (ready = Promise.resolve()) => {
  if (prefersReducedMotion()) return
  safely('tilt', initTilt)
  safely('code rain', initCodeRain)
  safely('wipe', initWipe)
  const tickerBuilt = Promise.resolve().then(initTicker).catch((error) => console.warn('fx: ticker failed', error))
  // The home intro (js/modules/boot.js) decides when the page's own entrance starts; the text decodes then.
  ready.then(() => safely('scramble', initScramble))
  loadGsap().then((gsap) => {
    if (!gsap) return
    safely('progress', () => initProgress(gsap))
    safely('parallax', () => initParallax(gsap))
    safely('magnets', () => initMagnets(gsap))
    safely('cursor', () => initCursor(gsap))
    // These measure the page, so they wait for the intro to finish and for the ticker to exist.
    Promise.all([ready, tickerBuilt]).then(() => {
      safely('scroll text', () => initScrollText(gsap))
      safely('ticker motion', () => initTickerMotion(gsap))
    })
  })
}
