/**
 * Portfolio entry point: loads JSON content, renders it, starts UI behaviour.
 */
import { resolvePortfolioUrl } from './modules/utils.js'
import { applyPortfolioContent } from './modules/apply.js'
import { loadPageContent } from './modules/content.js'
import { initLightbox, initBackToTop, initAnalytics } from './modules/ui.js'
import { initReveal, initCountUp, initImageFade } from './modules/motion.js'

const hideLoader = (delay) => {
  document.body.classList.remove('is-loading')
  document.body.classList.add('is-loaded')
  const loader = document.querySelector('.page-loader')
  if (loader) {
    loader.style.opacity = '0'
    loader.style.visibility = 'hidden'
    setTimeout(() => { loader.style.display = 'none' }, delay)
  }
}

// Fallback: force visibility on window load in case initialization failed.
window.addEventListener('load', () => hideLoader(300))

// Revalidate with the server on each load (cheap 304s) instead of bypassing the cache.
const safeFetch = async (url) => {
  const resolvedUrl = resolvePortfolioUrl(url)
  try {
    const res = await fetch(resolvedUrl, { cache: 'no-cache' })
    if (!res.ok) {
      console.warn(`Fetch warning: ${resolvedUrl} returned ${res.status}`)
      return null
    }
    return await res.json()
  } catch (e) {
    console.warn(`Fetch error: ${resolvedUrl} - ${e.message}`)
    return null
  }
}

// Leaf elements first, so a card animates on its own instead of with its whole section.
// A thin line appears under the header once the page scrolls (same as the blog).
const siteHeader = document.getElementById('site-header')
if (siteHeader) {
  const syncHeader = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 8)
  window.addEventListener('scroll', syncHeader, { passive: true })
  syncHeader()
}

const REVEAL_GROUPS = [
  { selector: '#main-content .project-card' },
  { selector: '#main-content .gallery-masonry-item:nth-child(n+10)' },
  { selector: '#main-content .blog-preview-card' },
  { selector: '#main-content .stat-node' },
  { selector: '#main-content .about-card' },
  { selector: '#main-content .story-chapter' },
  { selector: '#main-content > *:not(.story-chapters)' },
  { selector: '#footer', variant: 'fade' }
]

const IMAGE_FADE = '.gallery-masonry-image, .project-image, .about-cert-masonry-image, .about-certificate-image'

// The full-screen loader is for a visitor's first page only; <head> reads this flag.
try { window.sessionStorage.setItem('zx10r-seen', '1') } catch { /* storage unavailable */ }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    hideLoader(500)

    const finalContent = await loadPageContent(safeFetch, window.location.pathname, window.location.search)

    applyPortfolioContent(finalContent)

    // Lucide is loaded with `defer`, so wait for it before drawing icons.
    const drawIcons = () => window.lucide?.createIcons?.()
    if (window.lucide) drawIcons()
    else window.addEventListener('load', drawIcons, { once: true })

    initImageFade(IMAGE_FADE)
    initReveal(REVEAL_GROUPS)
    initCountUp('.stat-value')
    initLightbox()
    initBackToTop()
    initAnalytics(finalContent.site?.analyticsId)
  } catch (error) {
    console.error('Critical error during initialization:', error)
    hideLoader(500)
  }
})
