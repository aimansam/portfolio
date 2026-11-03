/** Interactive UI: menu, filters, lightbox, back-to-top, analytics. */

// Mobile Menu Toggle
const menuToggle = document.querySelector('.nav-menu-toggle')
const mobileNav = document.getElementById('mobile-nav-links')
if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
    menuToggle.setAttribute('aria-expanded', !expanded)
    mobileNav.classList.toggle('is-open')
  })
}

// Skill Filters
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('about-skill-filter')) {
    const filter = e.target.dataset.skillFilter
    const filters = document.querySelectorAll('.about-skill-filter')
    const pages = document.querySelectorAll('.about-skill-page')
    
    filters.forEach(f => f.classList.remove('is-active'))
    e.target.classList.add('is-active')
    
    pages.forEach(p => {
      p.classList.remove('is-active')
      if (p.dataset.skillPage === filter) p.classList.add('is-active')
    })
  }
})

// Project Filters
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-button')) {
    const filter = e.target.dataset.filter
    const buttons = document.querySelectorAll('.filter-button')
    const projects = document.querySelectorAll('.project-card')
    
    buttons.forEach(b => b.classList.remove('is-active'))
    e.target.classList.add('is-active')
    
    projects.forEach(p => {
      if (filter === 'all' || p.dataset.category === filter) {
        p.style.display = 'flex'
      } else {
        p.style.display = 'none'
      }
    })
  }
})

// --- Image Lightbox ---
export const initLightbox = () => {
  const lightbox = document.createElement('div')
  lightbox.className = 'lightbox-overlay'
  lightbox.setAttribute('role', 'dialog')
  lightbox.setAttribute('aria-modal', 'true')
  lightbox.setAttribute('aria-label', 'Image viewer')
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Close image viewer">&times;</button>
    <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-next" aria-label="Next image">&#8250;</button>
    <div class="lightbox-content">
      <img class="lightbox-image" alt="">
      <div class="lightbox-caption">
        <span class="lightbox-title"></span>
        <span class="lightbox-desc"></span>
      </div>
    </div>
  `
  document.body.appendChild(lightbox)

  let lightboxItems = []
  let lightboxIndex = 0
  let lastFocusedElement = null

  const getFocusableElements = () =>
    [...lightbox.querySelectorAll('button')]
      .filter(el => !el.disabled && el.offsetParent !== null)

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return
    const focusable = getFocusableElements()
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const openLightbox = (items, index, trigger) => {
    lightboxItems = items
    lightboxIndex = index
    lastFocusedElement = trigger || document.activeElement
    updateLightbox()
    lightbox.classList.add('is-open')
    document.body.style.overflow = 'hidden'
    lightbox.addEventListener('keydown', trapFocus)
    const closeBtn = lightbox.querySelector('.lightbox-close')
    if (closeBtn) closeBtn.focus()
  }

  const closeLightbox = () => {
    lightbox.classList.remove('is-open')
    document.body.style.overflow = ''
    lightbox.removeEventListener('keydown', trapFocus)
    if (lastFocusedElement) {
      lastFocusedElement.focus()
      lastFocusedElement = null
    }
  }

  const updateLightbox = () => {
    const item = lightboxItems[lightboxIndex]
    if (!item) return
    const img = lightbox.querySelector('.lightbox-image')
    img.src = item.src
    img.alt = item.title || 'Gallery image'
    lightbox.querySelector('.lightbox-title').textContent = item.title || ''
    lightbox.querySelector('.lightbox-desc').textContent = item.desc || ''
  }

  const nextLightbox = () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length
    updateLightbox()
  }

  const prevLightbox = () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length
    updateLightbox()
  }

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox)
  lightbox.querySelector('.lightbox-next').addEventListener('click', nextLightbox)
  lightbox.querySelector('.lightbox-prev').addEventListener('click', prevLightbox)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox()
  })

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox() }
    if (e.key === 'ArrowRight') { e.preventDefault(); nextLightbox() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevLightbox() }
  })

  // Attach click handlers to gallery cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-lightbox]')
    if (!card) return
    const allCards = document.querySelectorAll('[data-lightbox]')
    const items = Array.from(allCards).map(c => ({
      src: c.dataset.lightbox,
      title: c.dataset.lightboxTitle || '',
      desc: c.dataset.lightboxDesc || ''
    }))
    const index = Array.from(allCards).indexOf(card)
    openLightbox(items, index, card)
  })

  // Keyboard activation for gallery cards (Enter/Space)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const card = e.target.closest('[data-lightbox]')
    if (!card) return
    e.preventDefault()
    const allCards = document.querySelectorAll('[data-lightbox]')
    const items = Array.from(allCards).map(c => ({
      src: c.dataset.lightbox,
      title: c.dataset.lightboxTitle || '',
      desc: c.dataset.lightboxDesc || ''
    }))
    const index = Array.from(allCards).indexOf(card)
    openLightbox(items, index, card)
  })
}

// --- Back to Top Button ---
export const initBackToTop = () => {
  const btn = document.createElement('button')
  btn.className = 'back-to-top'
  btn.setAttribute('aria-label', 'Back to top')
  btn.innerHTML = '&#8593;'
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
  document.body.appendChild(btn)

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible')
    } else {
      btn.classList.remove('is-visible')
    }
  })
}

// --- Analytics (ID comes from content/site/site.json) ---
export const initAnalytics = (ANALYTICS_ID) => {
  if (!ANALYTICS_ID) return
  // Google Analytics 4
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`
  document.head.appendChild(script)
  script.onload = () => {
    window.dataLayer = window.dataLayer || []
    function gtag() { dataLayer.push(arguments) }
    gtag('js', new Date())
    gtag('config', ANALYTICS_ID)
  }
}
