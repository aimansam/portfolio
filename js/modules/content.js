/**
 * Decides which JSON files a page needs and merges them into one content object.
 * Shared by the browser (js/main.js) and the build-time prerenderer (scripts/prerender.js).
 */

const pageIs = (pathname, name) => new RegExp(`(^|/)${name}\\.html$`, 'i').test(pathname)

export const isHomePath = (pathname) => !/\.html$/i.test(pathname) || pageIs(pathname, 'index')

const getPageContentFile = (pathname, search) => {
  if (pageIs(pathname, 'project')) {
    const projectId = new URLSearchParams(search).get('id')
    return projectId ? `content/projects/${encodeURIComponent(projectId)}.json` : 'content/site/projects.json'
  }
  if (pageIs(pathname, 'about')) return 'content/site/about.json'
  if (pageIs(pathname, 'projects')) return 'content/site/projects.json'
  if (pageIs(pathname, 'gallery')) return 'content/site/gallery.json'
  if (pageIs(pathname, 'certificates')) return 'content/site/certificates.json'
  return 'content/site/index.json'
}

// `fetchJson` resolves a content path to parsed JSON, or null when unavailable.
export const loadPageContent = async (fetchJson, pathname, search = '') => {
  // Every JSON file is independent, so fetch them all at once.
  const [navData, footerData, siteData, pageContent, heroContent, certificatesContent] = await Promise.all([
    fetchJson('content/site/navigation.json'),
    fetchJson('content/site/footer.json'),
    fetchJson('content/site/site.json'),
    fetchJson(getPageContentFile(pathname, search)),
    isHomePath(pathname) ? fetchJson('content/site/hero.json') : null,
    pageIs(pathname, 'about') ? fetchJson('content/site/certificates.json') : null
  ])

  const content = {
    navigation: navData?.navigation || null,
    footer: footerData?.footer || null,
    site: siteData?.site || null
  }
  if (pageContent) {
    Object.assign(content, pageContent)
  } else {
    console.warn('Page content not available, using base content only')
  }
  if (heroContent?.hero) content.hero = heroContent.hero
  if (certificatesContent?.certificates) content.certificates = certificatesContent.certificates
  // Keep the site config even if a page file defines its own `site` key.
  content.site = siteData?.site || content.site
  return content
}
