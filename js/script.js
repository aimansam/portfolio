/**
 * Portfolio Script
 * Handles dynamic content loading and UI interactions
 */

// --- Utility Functions ---

const createNavItemMarkup = (item) => `
  <a class="nav-icon-link" href="${item.href}" aria-label="${item.label}">
    <img src="${item.icon}" class="nav-icon" alt="">
    <span class="nav-icon-label">${item.label}</span>
  </a>
`;

const createFooterLinkMarkup = (item) => `
  <a class="icon-link" href="${item.href}" ${item.target ? `target="${item.target}" rel="noopener noreferrer"` : ''} aria-label="${item.label}">
    <img src="${item.icon}" class="footer-icon" alt="${item.label}"/>
  </a>
`;

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
    <div class="about-certificate-body">
      <span class="about-certificate-name">${cert.name}</span>
      <span class="about-certificate-note">${cert.note}</span>
    </div>
    <div class="about-certificate-media" aria-hidden="true">
      <span class="about-certificate-badge-code">${cert.code}</span>
      <span class="about-certificate-badge-meta">${cert.meta}</span>
    </div>
  </li>
`;

const createProjectMarkup = (project) => `
  <div class="project-card" data-category="${project.category}">
    ${project.featured ? '<div class="project-featured-badge">Featured</div>' : ''}
    <img src="./assets/images/${project.image}" class="project-image">
    <div class="project-card-text-container">
      <div class="project-card-tags">
        ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
      <div class="subheader-text project-title">${project.title}</div>
      <div class="body-text project-card-text">${project.description}</div>
    </div>
    <a class="button" href="./project-pages/${project.page}">
      <span class="button-text">Read More</span>
      <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon"/>
    </a>
  </div>
`;

const createBlogPreviewMarkup = (post) => `
  <article class="blog-preview-card ${post.accent ? 'blog-preview-card-accent' : ''}">
    <div class="blog-preview-tags">
      ${post.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
    </div>
    <div class="blog-preview-card-text">
      <div class="subheader-text blog-preview-title">${post.title}</div>
      <div class="body-text blog-preview-text">${post.description}</div>
    </div>
    <div class="blog-preview-meta">Published · ${post.date}</div>
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

  if (content.navigation?.brand?.href && navBrandLink) navBrandLink.href = content.navigation.brand.href
  if (content.navigation?.brand?.label && navBrandLabel) navBrandLabel.textContent = content.navigation.brand.label
  if (content.navigation?.cta?.href && navCtaLink) navCtaLink.href = content.navigation.cta.href
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

const applyCertificatesContent = (content) => {
  const certificatesTitle = document.getElementById('certificates-title')
  if (!certificatesTitle) return

  const certificateList = document.getElementById('certificate-list')
  if (content.certificates?.title) certificatesTitle.textContent = content.certificates.title
  if (Array.isArray(content.certificates?.items) && content.certificates.items.length && certificateList) {
    certificateList.innerHTML = content.certificates.items.map(createCertificateMarkup).join('')
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
    const sortedItems = [...content.projects.items].sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
    projectsContainer.innerHTML = sortedItems.map(createProjectMarkup).join('')
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

const applyPortfolioContent = (content) => {
  if (!content || typeof content !== 'object') return
  
  applyCommonContent(content)
  applyHeroContent(content)
  applyStatsContent(content)
  applyAboutContent(content)
  applySkillsContent(content)
  applyCertificatesContent(content)
  applyProjectsContent(content)
  applyBlogPreviewContent(content)
  applySEOContent(content)
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

  try {
    console.log('Initializing portfolio loading sequence...')
    
    // 1. Always load common navigation and footer first to prevent blank navs
    console.log('Fetching common elements...')
    const [navRes, footerRes] = await Promise.all([
      fetch('content/site/navigation.json'),
      fetch('content/site/footer.json')
    ])
    
    if (!navRes.ok || !footerRes.ok) throw new Error(`Common elements fetch failed: Nav(${navRes.status}), Footer(${footerRes.status})`)
    
    const navData = await navRes.json()
    const footerData = await footerRes.json()
    
    const baseContent = {
      navigation: navData.navigation,
      footer: footerData.footer
    }
    console.log('Common elements loaded successfully.')

    // 2. Determine page-specific content file
    const path = window.location.pathname
    console.log('Current path:', path)
    let contentFile = 'content/site/index.json'
    
    if (path.endsWith('about.html') || path.includes('/about.html')) contentFile = 'content/site/about.json'
    else if (path.endsWith('projects.html') || path.includes('/projects.html')) contentFile = 'content/site/projects.json'
    else if (path.endsWith('certificates.html') || path.includes('/certificates.html')) contentFile = 'content/site/certificates.json'
    else if (path === '/' || path === '/index.html' || path.endsWith('index.html')) contentFile = 'content/site/index.json'
    
    console.log('Target content file:', contentFile)
    
    // 3. Fetch page-specific content
    try {
      const pageRes = await fetch(contentFile)
      if (pageRes.ok) {
        const pageContent = await pageRes.json()
        console.log('Page content loaded successfully.')
        const finalContent = { ...baseContent, ...pageContent }
        applyPortfolioContent(finalContent)
      } else {
        console.warn(`Could not load page content from ${contentFile} (Status: ${pageRes.status}), using base content only.`)
        applyPortfolioContent(baseContent)
      }
    } catch (pageError) {
      console.error('Network error loading page-specific content:', pageError)
      applyPortfolioContent(baseContent)
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons()
    } else {
      console.error('Lucide library not loaded')
    }
    
    // Initialize Animations
    initScrollReveal()
    
    // Fallback: Force visibility for elements that might be stuck in hidden state
    // This ensures that even if the IntersectionObserver fails or window is not scrolled,
    // the content is visible.
    document.querySelectorAll('[data-scroll-reveal="true"]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    
  } catch (error) {
    console.error('Critical error loading portfolio site:', error)
  } finally {
    hideLoader()
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