/**
 * Portfolio entry point: loads JSON content, renders it, starts UI behaviour.
 */
import { resolvePortfolioUrl } from './modules/utils.js'
import { applyPortfolioContent } from './modules/apply.js'
import { initLightbox, initBackToTop, initAnalytics } from './modules/ui.js'

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

const pathMatches = (name) => new RegExp(`(^|/)${name}\\.html$`, 'i').test(window.location.pathname)

const getPageContentFile = () => {
  if (pathMatches('project')) {
    const projectId = new URLSearchParams(window.location.search).get('id')
    return projectId ? `content/projects/${encodeURIComponent(projectId)}.json` : 'content/site/projects.json'
  }
  if (pathMatches('about')) return 'content/site/about.json'
  if (pathMatches('projects')) return 'content/site/projects.json'
  if (pathMatches('gallery')) return 'content/site/gallery.json'
  if (pathMatches('certificates')) return 'content/site/certificates.json'
  return 'content/site/index.json'
}

const initScrollReveal = () => {
  const revealTargets = document.querySelectorAll([
    '#main-content > *:not(.story-chapters)',
    '#main-content .story-chapter',
    '#main-content .about-card',
    '#main-content .project-card',
    '#main-content .gallery-masonry-item',
    '#main-content .blog-preview-card'
  ].join(','))

  revealTargets.forEach((element, index) => {
    if (element.dataset.scrollReveal !== 'true') {
      element.dataset.scrollReveal = 'true'
    }
    const delay = element.classList.contains('story-chapter') ? 0 : Math.min((index % 6) * 70, 350)
    element.style.setProperty('--scroll-reveal-delay', `${delay}ms`)
  })

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-scroll-visible'))
    return
  }

  const observerOptions = {
    threshold: 0.16,
    rootMargin: '0px 0px -18% 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, entryIndex) => {
        if (entry.isIntersecting) {
          const delay = entry.target.classList.contains('story-chapter')
            ? 0
            : Math.min(entryIndex * 90, 360)
          entry.target.style.setProperty('--scroll-reveal-delay', `${delay}ms`)
          entry.target.classList.add('is-scroll-visible')
          observer.unobserve(entry.target)
        }
      })
  }, observerOptions)

  document.querySelectorAll('[data-scroll-reveal="true"]').forEach(el => {
    observer.observe(el)
  })
}


document.addEventListener('DOMContentLoaded', async () => {
  const isHomePage = !/\.html$/i.test(window.location.pathname) || pathMatches('index')

  try {
    hideLoader(500)

    // Every JSON file is independent, so fetch them all at once.
    const [navData, footerData, siteData, pageContent, heroContent, certificatesContent] = await Promise.all([
      safeFetch('content/site/navigation.json'),
      safeFetch('content/site/footer.json'),
      safeFetch('content/site/site.json'),
      safeFetch(getPageContentFile()),
      isHomePage ? safeFetch('content/site/hero.json') : null,
      pathMatches('about') ? safeFetch('content/site/certificates.json') : null
    ])

    const finalContent = {
      navigation: navData?.navigation || null,
      footer: footerData?.footer || null,
      site: siteData?.site || null
    }
    if (pageContent) {
      Object.assign(finalContent, pageContent)
    } else {
      console.warn('Page content not available, using base content only')
    }
    if (heroContent?.hero) finalContent.hero = heroContent.hero
    if (certificatesContent?.certificates) finalContent.certificates = certificatesContent.certificates
    // Keep the site config even if a page file defines its own `site` key.
    finalContent.site = siteData?.site || finalContent.site

    applyPortfolioContent(finalContent)

    // Lucide is loaded with `defer`, so wait for it before drawing icons.
    const drawIcons = () => window.lucide?.createIcons?.()
    if (window.lucide) drawIcons()
    else window.addEventListener('load', drawIcons, { once: true })

    initScrollReveal()
    initLightbox()
    initBackToTop()
    initAnalytics(finalContent.site?.analyticsId)
  } catch (error) {
    console.error('Critical error during initialization:', error)
    hideLoader(500)
  }
})
