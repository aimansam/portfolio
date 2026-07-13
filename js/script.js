/**
 * Portfolio Script
 * Handles dynamic content loading and UI interactions
 */

// Fallback: Force visibility on window load in case DOMContentLoaded already fired
window.addEventListener('load', () => {
  const loader = document.querySelector('.page-loader')
  if (loader) {
    loader.style.opacity = '0'
    loader.style.visibility = 'hidden'
    setTimeout(() => {
      loader.style.display = 'none'
    }, 300)
  }
  document.body.classList.remove('is-loading')
  document.body.classList.add('is-loaded')
})

// --- Utility Functions ---

// Escape HTML special characters to prevent XSS when injecting JSON data into innerHTML.
const escapeHtml = (str) => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
}

// Resolve shared content from the portfolio root, even when the current page is
// nested (for example, /project-pages/project.html).
const portfolioRootUrl = new URL('../', document.currentScript?.src || window.location.href)

const resolvePortfolioUrl = (value) => {
  if (!value) return ''

  try {
    return new URL(value, portfolioRootUrl).href
  } catch {
    return value
  }
}

const normalizePathname = (pathname) => {
  const normalized = pathname.replace(/\/index\.html$/i, '/')
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized
}

const isNavItemActive = (item) => {
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

const createNavItemMarkup = (item) => {
  const isActive = isNavItemActive(item)
  const targetAttributes = item.target
    ? ` target="${escapeHtml(item.target)}" rel="noopener noreferrer"`
    : ''
  const label = escapeHtml(item.label)
  const ariaLabel = escapeHtml(item.ariaLabel || item.label)

  return `
  <a class="nav-icon-link${isActive ? ' is-active' : ''}" href="${resolvePortfolioUrl(item.href)}" aria-label="${ariaLabel}"${isActive ? ' aria-current="page"' : ''}${targetAttributes}>
    <img src="${resolvePortfolioUrl(item.icon)}" class="nav-icon" alt="">
    <span class="nav-icon-label">${label}</span>
  </a>
`
}

const createFooterLinkMarkup = (item) => {
  const label = escapeHtml(item.label)
  const ariaLabel = escapeHtml(item.ariaLabel || item.label)
  const targetAttr = item.target ? `target="${escapeHtml(item.target)}" rel="noopener noreferrer"` : ''
  return `
  <a class="icon-link" href="${resolvePortfolioUrl(item.href)}" ${targetAttr} aria-label="${ariaLabel}">
    <img src="${resolvePortfolioUrl(item.icon)}" class="footer-icon" alt="${label}"/>
  </a>
`
};

const createHeroSocialMarkup = (item) => `
  <a class="hero-social-link" href="${item.href}" ${item.target ? `target="${item.target}" rel="noopener noreferrer"` : ''} aria-label="${item.label}">
    <img src="${item.icon}" class="hero-social-icon" alt="">
  </a>
`;

const createHeroBadgeMarkup = (item) => `
  <a class="hero-badge-link ${item.className}" href="${item.href}" target="_blank" rel="noopener noreferrer" aria-label="${item.label}">
    <img src="${item.image}" class="hero-badge-image" alt="${item.label}">
  </a>
`;

const createStatsRow = (items, isCompact) => `
  <div class="stats-row ${isCompact ? 'stats-row-compact' : ''}">
    ${items.map(item => `
      <div class="stat-node">
        <span class="stat-step">${item.step}</span>
        <span class="stat-value">${item.value}</span>
        <span class="stat-label">${item.label}</span>
        <div class="body-text stat-note">${item.note}</div>
      </div>
    `).join('')}
  </div>
`;

const createSkillFilterMarkup = (filter, isActive) => `
  <button class="about-skill-filter${isActive ? ' is-active' : ''}" type="button" data-skill-filter="${filter.id}">${filter.label}</button>
`;

const createSkillPageMarkup = (page, isActive) => `
  <section class="about-skill-page${isActive ? ' is-active' : ''}" data-skill-page="${page.id}">
    <div class="about-pill-list">
      ${page.skills.map(skill => `
        <span class="about-pill"><i data-lucide="${skill.icon}"></i>${skill.name}</span>
      `).join('')}
    </div>
  </section>
`;

const createCertificateMarkup = (cert) => `
  <li class="about-certificate-item">
    <div class="about-certificate-image-wrapper">
      <img src="${cert.image || './assets/images/8443.jpg'}" alt="${cert.name}" class="about-certificate-image">
    </div>
    <div class="about-certificate-body">
      <span class="about-certificate-name">${cert.name}</span>
      <span class="about-certificate-note">${cert.note}</span>
    </div>
  </li>
`;

const createProjectMarkup = (project) => `
  <div class="project-card" data-category="${escapeHtml(project.category)}">
    <img src="${project.image}" class="project-image" loading="lazy">
    <div class="project-card-text-container">
      <div class="project-card-tags">
        ${project.tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="subheader-text project-title">${escapeHtml(project.title)}</div>
      <div class="body-text project-card-text">${escapeHtml(project.description)}</div>
    </div>
    <a class="button" href="${project.href || './project-pages/project.html?id=' + project.id}">
      <span class="button-text">Read More</span>
      <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon"/>
    </a>
  </div>
`;

const createBlogPreviewMarkup = (post) => `
  <article class="blog-preview-card ${post.accent ? 'blog-preview-card-accent' : ''}">
    <div class="blog-preview-tags">
      ${post.tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('')}
    </div>
    <div class="blog-preview-card-text">
      <div class="subheader-text blog-preview-title">${escapeHtml(post.title)}</div>
      <div class="body-text blog-preview-text">${escapeHtml(post.description)}</div>
    </div>
    <div class="blog-preview-meta">Published · ${escapeHtml(post.date)}</div>
    <a class="button" href="${post.url}">
      <span class="button-text">Read post</span>
      <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon" alt="">
    </a>
  </article>
`;

const createStructuredData = (seo) => JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${seo.canonicalUrl}#aiman-sam`,
      "name": "Aiman Sam",
      "url": seo.canonicalUrl,
      "image": seo.image,
      "description": seo.description
    },
    {
      "@type": "WebSite",
      "@id": `${seo.canonicalUrl}#website`,
      "url": seo.canonicalUrl,
      "name": "Aiman Sam Portfolio"
    }
  ]
}, null, 2);

// --- Content Application Logic ---

const applyCommonContent = (content) => {
  const navBrandLink = document.getElementById('nav-brand-link')
  const navBrandLabel = document.getElementById('nav-brand-label')
  const navCtaLink = document.getElementById('nav-cta-link')
  const navCtaLabel = document.getElementById('nav-cta-label')
  const mobileNavLinks = document.getElementById('mobile-nav-links')
  const footerCopy = document.getElementById('footer-copy')
  const footerLinkList = document.getElementById('footer-link-list')

  if (content.navigation?.brand?.href && navBrandLink) navBrandLink.href = resolvePortfolioUrl(content.navigation.brand.href)
  if (content.navigation?.brand?.label && navBrandLabel) navBrandLabel.textContent = content.navigation.brand.label
  if (content.navigation?.cta?.href && navCtaLink) navCtaLink.href = resolvePortfolioUrl(content.navigation.cta.href)
  if (content.navigation?.cta?.label && navCtaLabel) navCtaLabel.textContent = content.navigation.cta.label
  if (Array.isArray(content.navigation?.items) && content.navigation.items.length && mobileNavLinks) {
    mobileNavLinks.innerHTML = content.navigation.items.map(createNavItemMarkup).join('')
  }
  if (content.footer?.copy && footerCopy) footerCopy.textContent = content.footer.copy
  if (Array.isArray(content.footer?.links) && content.footer.links.length && footerLinkList) {
    footerLinkList.innerHTML = content.footer.links.map(createFooterLinkMarkup).join('')
  }
}

const applyHeroContent = (content) => {
  const heroTitle = document.getElementById('hero-title')
  if (!heroTitle) return

  const heroIntro = document.getElementById('hero-intro')
  const heroPrimaryActionLabel = document.getElementById('hero-primary-action-label')
  const heroSecondaryActionLink = document.getElementById('hero-secondary-action-link')
  const heroSecondaryActionLabel = document.getElementById('hero-secondary-action-label')
  const heroSocialLinks = document.getElementById('hero-social-links')
  const heroBadgeLinks = document.getElementById('hero-badge-links')

  if (content.hero?.title) heroTitle.textContent = content.hero.title
  if (content.hero?.intro && heroIntro) heroIntro.textContent = content.hero.intro
  if (content.hero?.primaryAction?.label && heroPrimaryActionLabel) heroPrimaryActionLabel.textContent = content.hero.primaryAction.label
  if (content.hero?.primaryAction?.href) {
    const myWorkLink = document.getElementById('my-work-link')
    if (myWorkLink) myWorkLink.href = content.hero.primaryAction.href
  }
  if (content.hero?.secondaryAction?.href && heroSecondaryActionLink) heroSecondaryActionLink.href = content.hero.secondaryAction.href
  if (content.hero?.secondaryAction?.download && heroSecondaryActionLink) heroSecondaryActionLink.download = content.hero.secondaryAction.download
  if (content.hero?.secondaryAction?.label && heroSecondaryActionLabel) heroSecondaryActionLabel.textContent = content.hero.secondaryAction.label
  if (Array.isArray(content.hero?.socialLinks) && content.hero.socialLinks.length && heroSocialLinks) {
    heroSocialLinks.innerHTML = content.hero.socialLinks.map(createHeroSocialMarkup).join('')
  }
  if (Array.isArray(content.hero?.badges) && content.hero.badges.length && heroBadgeLinks) {
    heroBadgeLinks.innerHTML = content.hero.badges.map(createHeroBadgeMarkup).join('')
  }
}

const applyStatsContent = (content) => {
  const statsHeading = document.getElementById('stats-heading')
  if (!statsHeading) return

  const statsDiagram = document.getElementById('stats-diagram')
  if (content.stats?.heading) statsHeading.textContent = content.stats.heading
  if (Array.isArray(content.stats?.items) && content.stats.items.length && statsDiagram) {
    const groups = []
    for (let index = 0; index < content.stats.items.length; index += 4) {
      groups.push(content.stats.items.slice(index, index + 4))
    }
    statsDiagram.innerHTML = groups.map((group, index) => createStatsRow(group, index > 0)).join('')
  }
}

const applyAboutContent = (content) => {
  const aboutTitle = document.getElementById('about-title')
  if (!aboutTitle) return

  const aboutLookingLabel = document.getElementById('about-looking-label')
  const aboutRoleList = document.getElementById('about-role-list')
  const aboutIntro = document.getElementById('about-intro')
  const aboutPoints = document.getElementById('about-points')
  if (content.about?.title) aboutTitle.textContent = content.about.title
  if (content.about?.lookingLabel && aboutLookingLabel) aboutLookingLabel.textContent = content.about.lookingLabel
  if (Array.isArray(content.about?.roles) && aboutRoleList) {
    aboutRoleList.replaceChildren(...content.about.roles.map(role => {
      const chip = document.createElement('span'); chip.className = 'about-story-chip'; chip.textContent = role; return chip;
    }))
  }
  if (content.about?.intro && aboutIntro) aboutIntro.textContent = content.about.intro
  if (Array.isArray(content.about?.points) && aboutPoints) {
    aboutPoints.replaceChildren(...content.about.points.map(point => {
      const item = document.createElement('li'); item.textContent = point; return item;
    }))
  }
}

const applySkillsContent = (content) => {
  const skillsTitle = document.getElementById('skills-title')
  if (!skillsTitle) return

  const skillsFilterList = document.getElementById('skills-filter-list')
  const skillsPageList = document.getElementById('skills-page-list')
  if (content.skills?.title) skillsTitle.textContent = content.skills.title
  if (Array.isArray(content.skills?.filters) && content.skills.filters.length && skillsFilterList) {
    skillsFilterList.innerHTML = content.skills.filters.map((f, i) => createSkillFilterMarkup(f, i === 0)).join('')
  }
  if (Array.isArray(content.skills?.pages) && content.skills.pages.length && skillsPageList) {
    skillsPageList.innerHTML = content.skills.pages.map((p, i) => createSkillPageMarkup(p, i === 0)).join('')
  }
}

// Certificate pagination state
let certCurrentPage = 1
const certPerPage = 2

const applyCertificatesContent = (content) => {
  // Apply to masonry grid with pagination (right column below skills)
  const certsTitle = document.getElementById('certs-title')
  if (certsTitle && content.certificates?.title) {
    certsTitle.textContent = content.certificates.title
  }
  
  const certList = document.getElementById('cert-list')
  const certCounter = document.getElementById('cert-counter')
  const certPrevBtn = document.querySelector('[data-cert-prev]')
  const certNextBtn = document.querySelector('[data-cert-next]')
  
  if (certList && Array.isArray(content.certificates?.items) && content.certificates.items.length) {
    const allCerts = content.certificates.items
    const totalPages = Math.ceil(allCerts.length / certPerPage)
    
    // Store all certs on the element for pagination
    certList.dataset.totalCerts = allCerts.length
    certList.dataset.totalPages = totalPages
    
    // Render current page
    renderCertPage(allCerts, certList, certCounter, certPrevBtn, certNextBtn)
    
    // Setup pagination event listeners
    if (certPrevBtn) {
      certPrevBtn.addEventListener('click', () => {
        if (certCurrentPage > 1) {
          certCurrentPage--
          renderCertPage(allCerts, certList, certCounter, certPrevBtn, certNextBtn)
        }
      })
    }
    
    if (certNextBtn) {
      certNextBtn.addEventListener('click', () => {
        if (certCurrentPage < totalPages) {
          certCurrentPage++
          renderCertPage(allCerts, certList, certCounter, certPrevBtn, certNextBtn)
        }
      })
    }
  }
}

const renderCertPage = (allCerts, certList, certCounter, certPrevBtn, certNextBtn) => {
  const totalPages = Math.ceil(allCerts.length / certPerPage)
  const startIdx = (certCurrentPage - 1) * certPerPage
  const endIdx = Math.min(startIdx + certPerPage, allCerts.length)
  const pageCerts = allCerts.slice(startIdx, endIdx)
  
  // Render certificates with fade animation
  certList.style.opacity = '0'
  certList.style.transition = 'opacity 200ms ease'
  
  setTimeout(() => {
    certList.innerHTML = pageCerts.map(cert => `
      <div class="about-cert-masonry-item">
        <div class="about-cert-masonry-card">
          <div class="about-cert-image-wrapper">
            <img src="${cert.image || './assets/images/8443.jpg'}" alt="${cert.name}" class="about-cert-masonry-image" loading="lazy">
          </div>
          <div class="about-cert-overlay">
            <div class="about-cert-overlay-content">
              <span class="about-cert-overlay-name">${escapeHtml(cert.name)}</span>
              <span class="about-cert-overlay-note">${escapeHtml(cert.note)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('')
    
    certList.style.opacity = '1'
    
    // Update counter
    if (certCounter) {
      certCounter.textContent = `${allCerts.length} certificate${allCerts.length !== 1 ? 's' : ''} · Page ${certCurrentPage} of ${totalPages}`
    }
    
    // Update button states
    if (certPrevBtn) {
      certPrevBtn.disabled = certCurrentPage === 1
      certPrevBtn.style.opacity = certCurrentPage === 1 ? '0.5' : '1'
      certPrevBtn.style.cursor = certCurrentPage === 1 ? 'not-allowed' : 'pointer'
    }
    
    if (certNextBtn) {
      certNextBtn.disabled = certCurrentPage === totalPages
      certNextBtn.style.opacity = certCurrentPage === totalPages ? '0.5' : '1'
      certNextBtn.style.cursor = certCurrentPage === totalPages ? 'not-allowed' : 'pointer'
    }
  }, 200)
}

const applyGalleryContent = (content) => {
  const galleryTitle = document.getElementById('gallery-title')
  if (!galleryTitle) return

  const galleryList = document.getElementById('gallery-list')
  if (content.gallery?.title) galleryTitle.textContent = content.gallery.title
  if (Array.isArray(content.gallery?.items) && content.gallery.items.length && galleryList) {
    galleryList.innerHTML = content.gallery.items.map(item => `
      <div class="gallery-masonry-item">
        <div class="gallery-masonry-card" role="button" tabindex="0" aria-label="View ${item.title || 'image'} in lightbox" data-lightbox="${item.image || './assets/images/8443.jpg'}" data-lightbox-title="${item.title || ''}" data-lightbox-desc="${item.description || ''}">
          <div class="gallery-image-wrapper">
            <img src="${item.image || './assets/images/8443.jpg'}" alt="${item.title || 'Gallery image'}" class="gallery-masonry-image" loading="lazy">
          </div>
          <div class="gallery-overlay">
            <div class="gallery-overlay-content">
              <span class="gallery-overlay-title">${escapeHtml(item.title || 'Untitled')}</span>
              <span class="gallery-overlay-description">${escapeHtml(item.description || '')}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('')
  }
}

const applyProjectsContent = (content) => {
  const projectsHeading = document.getElementById('projects-heading')
  if (!projectsHeading) return

  const projectFilterList = document.getElementById('project-filter-list')
  const projectsContainer = document.getElementById('projects-container')
  if (content.projects?.heading) projectsHeading.textContent = content.projects.heading
  if (Array.isArray(content.projects?.filters) && content.projects.filters.length && projectFilterList) {
    projectFilterList.innerHTML = content.projects.filters.map((f, i) => `<button class="filter-button${i === 0 ? ' is-active' : ''}" type="button" data-filter="${f.id}">${f.label}</button>`).join('')
  }
  if (Array.isArray(content.projects?.items) && content.projects.items.length && projectsContainer) {
    projectsContainer.innerHTML = content.projects.items.map(createProjectMarkup).join('')
  }
}

const applyBlogPreviewContent = (content) => {
  const blogPreviewHeading = document.getElementById('blog-preview-heading')
  if (!blogPreviewHeading) return

  const blogPreviewIntro = document.getElementById('blog-preview-intro')
  const blogPreviewViewAll = document.getElementById('blog-preview-view-all')
  const blogPreviewViewAllLabel = document.getElementById('blog-preview-view-all-label')
  const blogPreviewGrid = document.getElementById('blog-preview-grid')
  if (content.blogPreview?.heading) blogPreviewHeading.textContent = content.blogPreview.heading
  if (content.blogPreview?.intro && blogPreviewIntro) blogPreviewIntro.textContent = content.blogPreview.intro
  if (content.blogPreview?.viewAllHref && blogPreviewViewAll) blogPreviewViewAll.href = content.blogPreview.viewAllHref
  if (content.blogPreview?.viewAllLabel && blogPreviewViewAllLabel) blogPreviewViewAllLabel.textContent = content.blogPreview.viewAllLabel
  if (Array.isArray(content.blogPreview?.items) && content.blogPreview.items.length && blogPreviewGrid) {
    blogPreviewGrid.innerHTML = content.blogPreview.items.map(createBlogPreviewMarkup).join('')
  }
}

const applySEOContent = (content) => {
  const seoTitle = document.getElementById('seo-title')
  if (!seoTitle || !content.seo) return

  const seoDescription = document.getElementById('seo-description')
  const seoCanonical = document.getElementById('seo-canonical')
  const seoOgTitle = document.getElementById('seo-og-title')
  const seoOgDescription = document.getElementById('seo-og-description')
  const seoOgUrl = document.getElementById('seo-og-url')
  const seoOgSiteName = document.getElementById('seo-og-site-name')
  const seoOgImage = document.getElementById('seo-og-image')
  const seoOgImageAlt = document.getElementById('seo-og-image-alt')
  const seoTwitterTitle = document.getElementById('seo-twitter-title')
  const seoTwitterDescription = document.getElementById('seo-twitter-description')
  const seoTwitterImage = document.getElementById('seo-twitter-image')
  const seoStructuredData = document.getElementById('seo-structured-data')

  if (content.seo.title) { seoTitle.textContent = content.seo.title; document.title = content.seo.title; }
  if (content.seo.description && seoDescription) seoDescription.setAttribute('content', content.seo.description);
  if (content.seo.canonicalUrl && seoCanonical) seoCanonical.setAttribute('href', content.seo.canonicalUrl);
  if (content.seo.title && seoOgTitle) seoOgTitle.setAttribute('content', content.seo.title);
  if (content.seo.description && seoOgDescription) seoOgDescription.setAttribute('content', content.seo.description);
  if (content.seo.canonicalUrl && seoOgUrl) seoOgUrl.setAttribute('content', content.seo.canonicalUrl);
  if (content.seo.siteName && seoOgSiteName) seoOgSiteName.setAttribute('content', content.seo.siteName);
  if (content.seo.image && seoOgImage) seoOgImage.setAttribute('content', content.seo.image);
  if (content.seo.imageAlt && seoOgImageAlt) seoOgImageAlt.setAttribute('content', content.seo.imageAlt);
  if (content.seo.title && seoTwitterTitle) seoTwitterTitle.setAttribute('content', content.seo.title);
  if (content.seo.description && seoTwitterDescription) seoTwitterDescription.setAttribute('content', content.seo.description);
  if (content.seo.image && seoTwitterImage) seoTwitterImage.setAttribute('content', content.seo.image);
  if (seoStructuredData) seoStructuredData.textContent = createStructuredData(content.seo);
}

const applyProjectDetailContent = (content) => {
  const projectTitle = document.getElementById('project-main-title')
  if (!projectTitle) return

  const projectDesc = document.getElementById('project-main-desc')
  const projectImage = document.getElementById('project-header-image')
  const projectTitleTag = document.getElementById('project-title-tag')
  const projectMetaDesc = document.getElementById('project-meta-desc')
  const detailsContainer = document.getElementById('project-details-container')
  const galleryGrid = document.getElementById('project-gallery-grid')

  if (content.title) {
    projectTitle.textContent = content.title
    if (projectTitleTag) projectTitleTag.textContent = content.title + ' | zx10r'
    const projectOgTitle = document.getElementById('project-og-title')
    const projectTwitterTitle = document.getElementById('project-twitter-title')
    if (projectOgTitle) projectOgTitle.setAttribute('content', content.title + ' | Aiman Sam')
    if (projectTwitterTitle) projectTwitterTitle.setAttribute('content', content.title + ' | Aiman Sam')
  }
  if (content.description) {
    projectDesc.textContent = content.description
    if (projectMetaDesc) projectMetaDesc.setAttribute('content', content.description)
    const projectOgDesc = document.getElementById('project-og-desc')
    const projectTwitterDesc = document.getElementById('project-twitter-desc')
    if (projectOgDesc) projectOgDesc.setAttribute('content', content.description)
    if (projectTwitterDesc) projectTwitterDesc.setAttribute('content', content.description)
  }
  if (content.headerImage && projectImage) {
    projectImage.src = content.headerImage
    projectImage.alt = content.title || 'Project header'
    const projectOgImage = document.getElementById('project-og-image')
    const projectTwitterImage = document.getElementById('project-twitter-image')
    const resolvedImage = resolvePortfolioUrl(content.headerImage)
    if (projectOgImage) projectOgImage.setAttribute('content', resolvedImage)
    if (projectTwitterImage) projectTwitterImage.setAttribute('content', resolvedImage)
  }

  if (Array.isArray(content.sections) && content.sections.length && detailsContainer) {
    detailsContainer.innerHTML = content.sections.map(section => `
      <div class="project-details-content">
        <div class="subheader-text">${escapeHtml(section.title)}</div>
        ${section.content.map(p => `<p class="body-text">${escapeHtml(p)}</p>`).join('')}
      </div>
    `).join('')
  }

  if (Array.isArray(content.gallery) && content.gallery.length && galleryGrid) {
    galleryGrid.innerHTML = content.gallery.map(item => {
      const caption = escapeHtml(item.caption || '')
      return `
      <div class="gallery-image-container ${item.width === 'half' ? 'half-width' : ''}">
        <img src="${item.image}" class="gallery-image" alt="${caption}" loading="lazy" role="button" tabindex="0" aria-label="View ${caption || 'image'} in lightbox" data-lightbox="${item.image}" data-lightbox-title="${caption}">
        ${item.caption ? `<span class="body-text">${caption}</span>` : ''}
      </div>
    `}).join('')
  }
}

const applyPortfolioContent = (content) => {
  if (!content || typeof content !== 'object') return
  
  // Check if this is a project detail page
  const path = window.location.pathname
  const urlParams = new URLSearchParams(window.location.search)
  const projectId = urlParams.get('id')
  
  if (path.match(/project\.html$/i) || path.match(/\/project\.html/i)) {
    // Project detail page - apply project-specific content
    applyCommonContent(content)
    applyProjectDetailContent(content)
    applySEOContent(content)
  } else {
    // Regular pages
    applyCommonContent(content)
    applyHeroContent(content)
    applyStatsContent(content)
    applyAboutContent(content)
    applySkillsContent(content)
    applyCertificatesContent(content)
    applyGalleryContent(content)
    applyProjectsContent(content)
    applyBlogPreviewContent(content)
    applySEOContent(content)
  }
}

// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  const hideLoader = () => {
    document.body.classList.remove('is-loading')
    const loader = document.querySelector('.page-loader')
    if (loader) {
      loader.style.opacity = '0'
      setTimeout(() => {
        loader.style.display = 'none'
      }, 500)
    }
  }

  // Initialize Scroll Reveal Observer
  const initScrollReveal = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-scroll-visible')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    document.querySelectorAll('[data-scroll-reveal="true"]').forEach(el => {
      observer.observe(el)
    })
  }

  // Helper to safely fetch and parse JSON
  const safeFetch = async (url) => {
    const resolvedUrl = resolvePortfolioUrl(url)
    try {
      const res = await fetch(resolvedUrl)
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

  // Force content visibility - minimal fallback that doesn't break CSS
  const forceContentVisibility = () => {
    // Remove loading class to allow normal CSS to take over
    document.body.classList.remove('is-loading')
    document.body.classList.add('is-loaded')
    
    // Hide loader - CSS handles this via body.is-loaded .page-loader
    // But we also add inline style as a fallback to ensure it hides
    const loader = document.querySelector('.page-loader')
    if (loader) {
      loader.style.opacity = '0'
      loader.style.visibility = 'hidden'
      setTimeout(() => {
        loader.style.display = 'none'
      }, 500)
    }
    
    // Force visibility on scroll-reveal elements that might be stuck
    document.querySelectorAll('[data-scroll-reveal="true"]').forEach(el => {
      el.classList.add('is-scroll-visible')
    })
    
  }

  try {
    // Force visibility early to prevent blank page
    forceContentVisibility()
    
    // 1. Load common elements (non-blocking)
    const navData = await safeFetch('content/site/navigation.json')
    const footerData = await safeFetch('content/site/footer.json')
    
    const baseContent = {
      navigation: navData?.navigation || null,
      footer: footerData?.footer || null
    }
    

    // 2. Determine page-specific content file based on pathname
    const path = window.location.pathname
    let contentFile = 'content/site/index.json'
    
    // Handle project detail page with ?id= parameter
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('id')
    
    if (path.match(/project\.html$/i) || path.match(/\/project\.html/i)) {
      if (projectId) {
        contentFile = `content/projects/${projectId}.json`
      } else {
        contentFile = 'content/site/projects.json'
      }
    }
    // Handle various path formats: /about.html, about.html, /portfolio/about.html, etc.
    else if (path.match(/about\.html$/i) || path.match(/\/about\.html/i)) {
      contentFile = 'content/site/about.json'
    } else if (path.match(/projects\.html$/i) || path.match(/\/projects\.html/i)) {
      contentFile = 'content/site/projects.json'
    } else if (path.match(/gallery\.html$/i) || path.match(/\/gallery\.html/i)) {
      contentFile = 'content/site/gallery.json'
    } else if (path.match(/certificates\.html$/i) || path.match(/\/certificates\.html/i)) {
      contentFile = 'content/site/certificates.json'
    }
    // Default to index.json for root path or index.html
    else if (path === '/' || path === '' || path.match(/index\.html$/i)) {
      contentFile = 'content/site/index.json'
    }
    
    // 3. Fetch page-specific content
    const pageContent = await safeFetch(contentFile)
    
    // Merge and apply content
    const finalContent = { ...baseContent }
    if (pageContent) {
      Object.assign(finalContent, pageContent)
    } else {
      console.warn('Page content not available, using base content only')
    }
    
    applyPortfolioContent(finalContent)
    
    // Initialize Lucide icons after a short delay to ensure library is loaded
    setTimeout(() => {
      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons()
      }
    }, 100)
    
    // Initialize scroll reveal animations
    initScrollReveal()
    
    // Additional visibility check after content is applied
    setTimeout(() => {
      forceContentVisibility()
    }, 1000)
    
  } catch (error) {
    console.error('Critical error during initialization:', error)
    // Force visibility even on error
    forceContentVisibility()
  }
})

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

// Certificate Carousel
const certNavPrev = document.querySelector('[data-certificate-nav="prev"]')
const certNavNext = document.querySelector('[data-certificate-nav="next"]')
const certList = document.getElementById('certificate-list')

if (certNavPrev && certNavNext && certList) {
  let currentScroll = 0
  const scrollAmount = 300 // Approximate width of one item

  certNavPrev.addEventListener('click', () => {
    currentScroll = Math.max(0, currentScroll - scrollAmount)
    certList.scrollTo({ left: currentScroll, behavior: 'smooth' })
  })

  certNavNext.addEventListener('click', () => {
    currentScroll += scrollAmount
    certList.scrollTo({ left: currentScroll, behavior: 'smooth' })
  })
}

// --- Image Lightbox ---
const initLightbox = () => {
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
      <img class="lightbox-image" src="" alt="">
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
const initBackToTop = () => {
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

// --- Analytics Placeholder ---
// Replace with your actual analytics ID
const ANALYTICS_ID = '' // e.g., 'G-XXXXXXXXXX' for Google Analytics

const initAnalytics = () => {
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

// --- Initialize all enhancements ---
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initLightbox()
    initBackToTop()
    initAnalytics()
  }, 500)
})
