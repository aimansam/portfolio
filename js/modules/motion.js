/**
 * Motion helpers shared by the portfolio and the blog.
 * Everything here is progressive: content is visible without JS, and every
 * effect is skipped when the visitor prefers reduced motion.
 */

// `window` is absent when the render modules run in Node for prerendering.
const REDUCED = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null

export const prefersReducedMotion = () => Boolean(REDUCED?.matches)

const STAGGER_MS = 60
const MAX_STAGGER_STEPS = 5
const SETTLE_MS = 700

// Visible now, or already scrolled past (for example after a reload mid-page): nothing to animate.
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect()
  return rect.top < window.innerHeight * 0.92
}

// Once an element has finished animating in, hand its transitions back to its own CSS.
const settle = (element) => {
  window.setTimeout(() => {
    element.removeAttribute('data-reveal')
    element.classList.remove('is-revealed')
    element.style.removeProperty('--reveal-delay')
  }, SETTLE_MS + MAX_STAGGER_STEPS * STAGGER_MS)
}

/**
 * Reveals elements as they scroll into view.
 * groups: [{ selector, variant = 'up' }]. Elements already on screen are left alone,
 * so nothing above the fold waits for a script.
 */
export const initReveal = (groups) => {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return

  const targets = []
  groups.forEach(({ selector, variant = 'up' }) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.hasAttribute('data-reveal') || isInViewport(element)) return
      // A container whose children already animate, or a child of one that does, stays still.
      if (element.querySelector('[data-reveal]') || element.parentElement?.closest('[data-reveal]')) return
      element.setAttribute('data-reveal', variant)
      targets.push(element)
    })
  })
  if (!targets.length) return

  const observer = new IntersectionObserver((entries) => {
    // Entries that arrive together (a row of cards) cascade by their position on screen.
    // Anything the visitor scrolled straight past is shown without animation.
    entries
      .filter((entry) => !entry.isIntersecting && entry.boundingClientRect.bottom < 0)
      .forEach((entry) => {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
        settle(entry.target)
      })

    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((entry, index) => {
        const step = Math.min(index, MAX_STAGGER_STEPS)
        entry.target.style.setProperty('--reveal-delay', `${step * STAGGER_MS}ms`)
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
        settle(entry.target)
      })
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

  targets.forEach((element) => observer.observe(element))

  // A big jump (End key, scrollbar drag) can carry elements out of view without ever
  // intersecting; once scrolling settles, show those without animation.
  let idle
  window.addEventListener('scroll', () => {
    window.clearTimeout(idle)
    idle = window.setTimeout(() => {
      targets.forEach((element) => {
        if (element.hasAttribute('data-reveal') && !element.classList.contains('is-revealed') && element.getBoundingClientRect().bottom < 0) {
          element.classList.add('is-revealed')
          observer.unobserve(element)
          settle(element)
        }
      })
    }, 150)
  }, { passive: true })
}

/** Counts plain numbers (350+, 3.80, 5) up from zero once they scroll into view. */
export const initCountUp = (selector) => {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return

  const elements = [...document.querySelectorAll(selector)].filter((element) => /^\d+(?:\.\d+)?[+%]?$/.test(element.textContent.trim()) && parseFloat(element.textContent) >= 3)
  if (!elements.length) return

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      observer.unobserve(entry.target)
      const text = entry.target.textContent.trim()
      const match = /^(\d+(?:\.\d+)?)([+%]?)$/.exec(text)
      const target = parseFloat(match[1])
      const decimals = (match[1].split('.')[1] || '').length
      const suffix = match[2]
      const duration = 800
      const start = performance.now()
      // Reserve the final width so the layout never shifts while counting.
      entry.target.style.minWidth = `${entry.target.getBoundingClientRect().width}px`

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - progress) ** 3
        entry.target.textContent = `${(target * eased).toFixed(decimals)}${suffix}`
        if (progress < 1) requestAnimationFrame(tick)
        else entry.target.style.minWidth = ''
      }
      requestAnimationFrame(tick)
    })
  }, { threshold: 0.6 })

  elements.forEach((element) => observer.observe(element))
}

/** Fades images in once they have loaded (skips ones that are already complete). */
export const initImageFade = (selector) => {
  if (prefersReducedMotion()) return
  document.querySelectorAll(selector).forEach((image) => {
    if (image.complete) return
    image.classList.add('is-loading')
    const done = () => {
      image.classList.remove('is-loading')
      image.classList.add('is-loading-done')
      image.addEventListener('animationend', () => image.classList.remove('is-loading-done'), { once: true })
    }
    image.addEventListener('load', done, { once: true })
    image.addEventListener('error', () => image.classList.remove('is-loading'), { once: true })
  })
}

/**
 * FLIP: animate elements from where they were to where they are after `change()` runs.
 * `items` is a function returning the elements to track (called before and after).
 */
export const flip = (items, change) => {
  if (prefersReducedMotion()) {
    change()
    return
  }
  const before = new Map(items().map((element) => [element, element.getBoundingClientRect()]))
  change()
  items().forEach((element) => {
    const from = before.get(element)
    const to = element.getBoundingClientRect()
    if (!from) {
      // Newly shown.
      element.animate([{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
      return
    }
    const dx = from.left - to.left
    const dy = from.top - to.top
    if (!dx && !dy) return
    element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
  })
}

/** Smoothly opens and closes a <details> element whose content is `bodySelector`. */
export const animateDetails = (details, bodySelector) => {
  const summary = details.querySelector('summary')
  const body = details.querySelector(bodySelector)
  if (!summary || !body) return

  summary.addEventListener('click', (event) => {
    if (prefersReducedMotion() || !body.animate) return
    event.preventDefault()
    const opening = !details.open
    if (opening) details.open = true
    const height = `${body.scrollHeight}px`
    const animation = body.animate(
      { height: opening ? ['0px', height] : [height, '0px'], opacity: opening ? [0, 1] : [1, 0] },
      { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )
    body.style.overflow = 'hidden'
    animation.onfinish = () => {
      body.style.overflow = ''
      if (!opening) details.open = false
    }
  })
}

/** Highlights the table-of-contents link for the section being read, with a sliding marker. */
export const initTocSpy = (toc) => {
  const list = toc?.querySelector('ol')
  if (!list || !('IntersectionObserver' in window)) return

  const links = [...list.querySelectorAll('a[href^="#"]')]
  const headings = links.map((link) => document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))).filter(Boolean)
  if (!headings.length) return

  // Wide screens: the list sits beside the article and only the main sections show; the
  // sub-sections of the section being read unfold. Narrower screens: a floating "Contents"
  // button opens the full list as a panel, so it never pushes the article down.
  const wide = window.matchMedia('(min-width: 1100px)')
  const details = toc.querySelector('details')
  const fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'blog-toc-fab'
  fab.setAttribute('aria-expanded', 'false')
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14"/></svg><span>Contents</span>'
  const setSheet = (open) => {
    toc.classList.toggle('is-sheet-open', open)
    fab.setAttribute('aria-expanded', String(open))
  }
  const applyMode = () => {
    toc.classList.toggle('is-compact', wide.matches)
    toc.classList.toggle('is-sheet', !wide.matches)
    fab.hidden = wide.matches
    if (!wide.matches) details?.setAttribute('open', '')
    if (wide.matches) setSheet(false)
  }
  document.querySelectorAll('.blog-toc-fab').forEach((old) => old.remove())
  document.body.appendChild(fab)
  fab.addEventListener('click', () => {
    setSheet(!toc.classList.contains('is-sheet-open'))
    requestAnimationFrame(() => update())
  })
  toc.addEventListener('click', (event) => { if (event.target.closest('a')) setSheet(false) })
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setSheet(false) })
  document.addEventListener('click', (event) => {
    if (toc.classList.contains('is-sheet-open') && !event.target.closest('.blog-toc, .blog-toc-fab')) setSheet(false)
  })
  const subItems = [...list.querySelectorAll('.blog-toc-level-3, .blog-toc-level-4')]
  const unfold = (section) => subItems.forEach((item) => item.classList.toggle('is-open', Boolean(section) && item.dataset.section === section))

  list.style.position = 'relative'
  const marker = document.createElement('span')
  marker.className = 'blog-toc-marker'
  marker.setAttribute('aria-hidden', 'true')
  list.appendChild(marker)

  const setCurrent = (heading) => {
    const link = links.find((item) => item.getAttribute('href') === `#${heading.id}`)
    if (!link) return
    links.forEach((item) => {
      item.classList.toggle('is-current', item === link)
      if (item === link) item.setAttribute('aria-current', 'location')
      else item.removeAttribute('aria-current')
    })
    unfold(link.parentElement.dataset.section)
    if (!toc.offsetParent && getComputedStyle(toc).display === 'none') return
    marker.style.opacity = '1'
    marker.style.transform = `translateY(${link.parentElement.offsetTop}px)`
    marker.style.height = `${link.parentElement.offsetHeight}px`
  }

  // The current section is the last heading that has scrolled above the reading line.
  const update = () => {
    const line = window.innerHeight * 0.3
    let current = null
    headings.forEach((heading) => {
      if (heading.getBoundingClientRect().top <= line) current = heading
    })
    if (current) setCurrent(current)
    else {
      marker.style.opacity = '0'
      unfold('')
      links.forEach((item) => item.classList.remove('is-current'))
    }
  }

  applyMode()
  wide.addEventListener?.('change', () => { applyMode(); update() })

  let ticking = false
  window.addEventListener('scroll', () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      update()
      ticking = false
    })
  }, { passive: true })
  update()
}
