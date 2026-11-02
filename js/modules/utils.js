/** Shared helpers: HTML escaping, URL resolution, nav state. */

// --- Utility Functions ---

// Escape HTML special characters to prevent XSS when injecting JSON data into innerHTML.
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Resolve shared content from the portfolio root, even when the current page is
// nested (for example, /project-pages/project.html).
export // The prerenderer (scripts/prerender.js) overrides the root so output stays relative.
const portfolioRootUrl = new URL(globalThis.__PORTFOLIO_ROOT__ || '../../', import.meta.url)

export const resolvePortfolioUrl = (value) => {
  if (!value) return ''

  try {
    return new URL(value, portfolioRootUrl).href
  } catch {
    return value
  }
}

export const normalizePathname = (pathname) => {
  const normalized = pathname.replace(/\/index\.html$/i, '/')
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized
}

export const isNavItemActive = (item) => {
  if (!item?.href || !/^https?:/i.test(resolvePortfolioUrl(item.href))) return false

  const targetUrl = new URL(resolvePortfolioUrl(item.href))
  if (targetUrl.origin !== window.location.origin) return false

  const currentPath = normalizePathname(window.location.pathname)
  const targetPath = normalizePathname(targetUrl.pathname)
  const rootPath = normalizePathname(portfolioRootUrl.pathname)

  // Home must match exactly; otherwise every route below the site root would
  // incorrectly activate it.
  if (targetPath === rootPath) return currentPath === rootPath

  // Project detail pages belong to the Projects navigation section.
  if (/\/projects\.html$/i.test(targetUrl.pathname)) {
    const projectPagesPath = `${portfolioRootUrl.pathname.replace(/\/$/, '')}/project-pages/`
    return currentPath === targetPath || window.location.pathname.startsWith(projectPagesPath)
  }

  // Treat directory index links (notably /blog/index.html) as their section so
  // posts beneath that directory retain the active state when this nav is used.
  if (/\/index\.html$/i.test(targetUrl.pathname)) {
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  }

  return currentPath === targetPath
}
