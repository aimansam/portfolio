/** Applies loaded JSON content to the page DOM. */
import { escapeHtml, resolvePortfolioUrl } from './utils.js'
import {
  createStructuredData, createCareerTimelineMarkup, createStatsRow,
  createSkillFilterMarkup, createSkillPageMarkup, createProjectMarkup,
  createBlogPreviewMarkup, createNavItemMarkup, createFooterLinkMarkup,
  createHeroSocialMarkup, createHeroBadgeMarkup
} from './markup.js'

// --- Content Application Logic ---

export const applyCommonContent = (content) => {
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

export const applyHeroContent = (content) => {
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

export const applyStatsContent = (content) => {
  const statsHeading = document.getElementById('stats-heading')
  if (!statsHeading) return

  const statsDiagram = document.getElementById('stats-diagram')
  if (content.stats?.heading) statsHeading.textContent = content.stats.heading
  if (Array.isArray(content.stats?.items) && content.stats.items.length && statsDiagram) {
    if (content.stats.type === 'timeline') {
      statsDiagram.innerHTML = createCareerTimelineMarkup(content.stats.items)
      return
    }
    const groups = []
    for (let index = 0; index < content.stats.items.length; index += 4) {
      groups.push(content.stats.items.slice(index, index + 4))
    }
    statsDiagram.innerHTML = groups.map((group, index) => createStatsRow(group, index > 0)).join('')
  }
}

export const applyAboutContent = (content) => {
  const aboutTitle = document.getElementById('about-title')
  const aboutLookingLabel = document.getElementById('about-looking-label')
  const aboutRoleList = document.getElementById('about-role-list')
  const aboutIntro = document.getElementById('about-intro')
  const aboutPoints = document.getElementById('about-points')
  if (content.about?.title && aboutTitle) aboutTitle.textContent = content.about.title
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

  const storyContent = document.querySelectorAll('[data-story-content]')
  if (Array.isArray(content.about?.story) && storyContent.length) {
    storyContent.forEach(container => {
      const storyIndex = Number(container.dataset.storyContent)
      const story = content.about.story[storyIndex]
      if (!story) return

      const title = document.createElement('h2')
      title.textContent = story.title || ''
      const description = document.createElement('p')
      description.textContent = story.description || ''
      container.replaceChildren(title, description)

      if (Array.isArray(story.highlights)) {
        story.highlights.forEach(highlight => {
          const item = document.createElement('strong')
          item.textContent = highlight
          container.appendChild(item)
        })
      }
    })
  }

  const storyMedia = document.querySelectorAll('[data-story-media]')
  if (Array.isArray(content.about?.story) && storyMedia.length) {
    storyMedia.forEach(media => {
      const storyIndex = Number(media.dataset.storyMedia)
      const story = content.about.story[storyIndex]
      if (!story) return

      media.setAttribute('aria-label', story.imageAlt || 'Story image placeholder')
      if (!story.image) {
        delete media.dataset.imageLabel
        media.removeAttribute('data-lightbox')
        media.removeAttribute('data-lightbox-title')
        media.removeAttribute('data-lightbox-desc')
        media.removeAttribute('tabindex')
        media.setAttribute('role', 'img')
        return
      }

      const image = document.createElement('img')
      image.src = resolvePortfolioUrl(story.image)
      image.alt = story.imageAlt || 'Story image'
      image.loading = 'lazy'
      media.replaceChildren(image)
      media.dataset.imageLabel = `${String(storyIndex + 1).padStart(2, '0')} / WINNING`
      media.dataset.lightbox = image.src
      media.dataset.lightboxTitle = story.title || story.imageAlt || 'Story image'
      media.dataset.lightboxDesc = story.imageAlt || ''
      media.setAttribute('aria-label', `Open ${story.title || 'story'} image`)
      media.setAttribute('role', 'button')
      media.setAttribute('tabindex', '0')
      media.classList.add('has-image')
    })
  }
}

export const applySkillsContent = (content) => {
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
export const certPerPage = 3

export const applyCertificatesContent = (content) => {
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

export const renderCertPage = (allCerts, certList, certCounter, certPrevBtn, certNextBtn) => {
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
            <img src="${escapeHtml(cert.image || './assets/images/me/aimansamformal.webp')}" alt="${escapeHtml(cert.name)}" class="about-cert-masonry-image" loading="lazy" decoding="async">
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

export const applyGalleryContent = (content) => {
  const galleryTitle = document.getElementById('gallery-title')
  const galleryList = document.getElementById('gallery-list')
  if (content.gallery?.title && galleryTitle) galleryTitle.textContent = content.gallery.title
  if (Array.isArray(content.gallery?.items) && content.gallery.items.length && galleryList) {
    galleryList.innerHTML = content.gallery.items.map(item => {
      const media = item.type === 'video'
        ? `<video class="gallery-masonry-video" controls preload="none"${item.poster ? ` poster="${escapeHtml(item.poster)}"` : ''} playsinline aria-label="${escapeHtml(item.alt || 'Gallery video')}"><source src="${escapeHtml(item.video)}" type="video/mp4"></video>`
        : `<div class="gallery-masonry-card" role="button" tabindex="0" aria-label="View ${escapeHtml(item.alt || 'image')} in lightbox" data-lightbox="${escapeHtml(item.image)}" data-lightbox-title="${escapeHtml(item.alt || '')}">
            <div class="gallery-image-wrapper"><img src="${escapeHtml(item.thumb || item.image)}"${item.thumb ? ` srcset="${escapeHtml(item.thumb)} 640w, ${escapeHtml(item.image)} 1600w" sizes="(max-width: 800px) 90vw, 400px"` : ''} alt="${escapeHtml(item.alt || 'Gallery image')}" class="gallery-masonry-image" loading="lazy" decoding="async"></div>
          </div>`
      return `<div class="gallery-masonry-item${item.type === 'video' ? ' gallery-masonry-item-video' : ''}">${media}</div>`
    }).join('')
  }
}

export const applyProjectsContent = (content) => {
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

export const applyBlogPreviewContent = (content) => {
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

export const applySEOContent = (content) => {
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

export const applyProjectDetailContent = (content) => {
  const projectTitle = document.getElementById('project-main-title')
  if (!projectTitle) return

  const projectDesc = document.getElementById('project-main-desc')
  const projectImage = document.getElementById('project-header-image')
  const projectTitleTag = document.getElementById('project-title-tag')
  const projectMetaDesc = document.getElementById('project-meta-desc')
  const projectCategory = document.getElementById('project-category')
  const projectFocusList = document.getElementById('project-focus-list')
  const projectFactGrid = document.getElementById('project-fact-grid')
  const projectLinkList = document.getElementById('project-link-list')
  const detailsContainer = document.getElementById('project-details-container')
  const galleryGrid = document.getElementById('project-gallery-grid')

  if (content.title) {
    projectTitle.textContent = content.title
    if (projectTitleTag) projectTitleTag.textContent = content.title + (content.site?.siteTag ? ` | ${content.site.siteTag}` : '')
    const projectOgTitle = document.getElementById('project-og-title')
    const projectTwitterTitle = document.getElementById('project-twitter-title')
    if (projectOgTitle) projectOgTitle.setAttribute('content', content.title + ' | Aiman Sam')
    if (projectTwitterTitle) projectTwitterTitle.setAttribute('content', content.title + ' | Aiman Sam')
  }
  if (projectCategory) projectCategory.textContent = content.category || 'Security project'
  if (projectFocusList && Array.isArray(content.focus)) {
    projectFocusList.innerHTML = content.focus.map(item => `<span class="project-tag">${escapeHtml(item)}</span>`).join('')
  }
  if (projectFactGrid && Array.isArray(content.facts)) {
    projectFactGrid.innerHTML = content.facts.map(fact => `
      <div class="project-fact">
        <span class="project-fact-label">${escapeHtml(fact.label)}</span>
        <span class="project-fact-value">${escapeHtml(fact.value)}</span>
      </div>
    `).join('')
  }
  if (projectLinkList && content.githubUrl) {
    projectLinkList.innerHTML = `<a class="button" href="${escapeHtml(content.githubUrl)}" target="_blank" rel="noopener noreferrer"><span class="button-text">View source on GitHub</span><img src="../assets/icons/arrow-right.svg" class="right-arrow-icon" alt=""></a>`
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

  const projectId = new URLSearchParams(window.location.search).get('id')
  const projectUrl = new URL(window.location.href)
  projectUrl.hash = ''
  if (projectId) projectUrl.search = `?id=${encodeURIComponent(projectId)}`
  const projectCanonical = document.getElementById('project-canonical')
  const projectOgUrl = document.getElementById('project-og-url')
  if (projectCanonical) projectCanonical.setAttribute('href', projectUrl.href)
  if (projectOgUrl) projectOgUrl.setAttribute('content', projectUrl.href)

  if (Array.isArray(content.sections) && content.sections.length && detailsContainer) {
    detailsContainer.innerHTML = content.sections.map(section => `
      <div class="project-details-content">
        <h2 class="subheader-text">${escapeHtml(section.title)}</h2>
        ${section.content.map(p => `<p class="body-text">${escapeHtml(p)}</p>`).join('')}
      </div>
    `).join('')
  }

  if (Array.isArray(content.gallery) && content.gallery.length && galleryGrid) {
    galleryGrid.innerHTML = content.gallery.map(item => {
      const caption = escapeHtml(item.caption || '')
      return `
      <div class="gallery-image-container ${item.width === 'half' ? 'half-width' : ''}">
        <img src="${escapeHtml(item.image)}" class="gallery-image" alt="${caption || 'Project image'}" loading="lazy" role="button" tabindex="0" aria-label="View ${caption || 'image'} in lightbox" data-lightbox="${escapeHtml(item.image)}" data-lightbox-title="${caption}">
        ${item.caption ? `<span class="body-text">${caption}</span>` : ''}
      </div>
    `}).join('')
  }
}

export const applyPortfolioContent = (content) => {
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
