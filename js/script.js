const initializeSmoothScroll = () => {
  const anchorLinks = document.querySelectorAll('a[href^="#"]')

  if (!anchorLinks.length) {
    return
  }

  anchorLinks.forEach((link) => {
    if (link.dataset.smoothScrollInitialized === 'true') {
      return
    }

    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href')
      const target = targetId === '#main-content'
        ? document.getElementById('main-content')
        : document.querySelector(targetId)

      if (!target) {
        return
      }

      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', targetId)
    })

    link.dataset.smoothScrollInitialized = 'true'
  })
}

const loadAnimationStartedAt = window.performance.now()

const completePageLoadAnimation = () => {
  const pageLoader = document.querySelector('.page-loader')
  const remainingLoadTime = Math.max(0, 700 - (window.performance.now() - loadAnimationStartedAt))

  window.setTimeout(() => {
    document.body.classList.remove('is-loading')
    document.body.classList.add('is-loaded')

    if (pageLoader) {
      window.setTimeout(() => {
        pageLoader.remove()
      }, 460)
    }
  }, remainingLoadTime)
}

const createTagMarkup = (tags = []) => tags.map((tag) => `<span class="project-tag">${tag}</span>`).join('')

const createStatsRow = (items, compact = false) => `
  <div class="stats-row${compact ? ' stats-row-compact' : ''}">
    ${items.map((item) => `
      <div class="stat-node">
        <span class="stat-step">${item.step}</span>
        <span class="stat-value">${item.value}</span>
        <span class="stat-label">${item.label}</span>
        <div class="body-text stat-note">${item.note}</div>
      </div>
    `).join('')}
  </div>
`

const createSkillFilterMarkup = (filter, isActive) => `
  <button class="about-skill-filter${isActive ? ' is-active' : ''}" type="button" data-skill-filter="${filter.id}">${filter.label}</button>
`

const createSkillPageMarkup = (page, isActive) => `
  <section class="about-skill-page${isActive ? ' is-active' : ''}" data-skill-page="${page.id}">
    <div class="about-pill-list">
      ${page.items.map((item) => `<span class="about-pill"><i data-lucide="${item.icon}"></i>${item.label}</span>`).join('')}
    </div>
  </section>
`

const createCertificateMarkup = (item) => `
  <li class="about-certificate-item">
    <div class="about-certificate-body">
      <span class="about-certificate-name">${item.name}</span>
      <span class="about-certificate-note">${item.note}</span>
    </div>
    <div class="about-certificate-media" aria-hidden="true">
      <span class="about-certificate-badge-code">${item.code}</span>
      <span class="about-certificate-badge-meta">${item.meta}</span>
    </div>
  </li>
`

const createProjectMarkup = (item) => `
  <div class="project-card" data-category="${item.category}">
    <img src="${item.image}" class="project-image" alt="${item.title}">
    <div class="project-card-text-container">
      <div class="project-card-tags">
        ${createTagMarkup(item.tags)}
      </div>
      <div class="subheader-text project-title">${item.title}</div>
      <div class="body-text project-card-text">${item.description}</div>
    </div>
    <a class="button" href="${item.href}">
      <span class="button-text">Read More</span>
      <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon" alt="">
    </a>
  </div>
`

const isExternalLink = (href = '') => href.startsWith('http://') || href.startsWith('https://')

const createLinkTargetAttributes = (href = '') => isExternalLink(href)
  ? ' target="_blank" rel="noopener noreferrer"'
  : ''

const createHeroSocialMarkup = (item) => `
  <a class="hero-social-link" href="${item.href}" aria-label="${item.label}"${createLinkTargetAttributes(item.href)}>
    <img src="${item.icon}" class="hero-social-icon" alt="">
  </a>
`

const createHeroBadgeMarkup = (item) => `
  <a class="${item.className || 'hero-badge-link'}" href="${item.href}" aria-label="${item.label}"${createLinkTargetAttributes(item.href)}>
    <img src="${item.image}" class="hero-badge-image" alt="${item.alt}">
  </a>
`

const createNavItemMarkup = (item) => `
  <a class="nav-icon-link" href="${item.href}" aria-label="${item.ariaLabel}"${createLinkTargetAttributes(item.href)}>
    <img src="${item.icon}" class="nav-icon" alt="">
    <span class="nav-icon-label">${item.label}</span>
  </a>
`

const createFooterLinkMarkup = (item) => `
  <a class="icon-link" href="${item.href}" aria-label="${item.label}"${createLinkTargetAttributes(item.href)}>
    <img src="${item.icon}" class="footer-icon" alt="${item.label.replace(' profile', '')}">
  </a>
`

const createBlogPreviewMarkup = (item) => `
  <article class="blog-preview-card${item.accent ? ' blog-preview-card-accent' : ''}">
    <div class="blog-preview-tags">
      ${createTagMarkup(item.tags)}
    </div>
    <div class="blog-preview-card-text">
      <div class="subheader-text blog-preview-title">${item.title}</div>
      <div class="body-text blog-preview-text">${item.text}</div>
    </div>
    <div class="blog-preview-meta">${item.meta}</div>
    <a class="button" href="${item.href}">
      <span class="button-text">${item.buttonLabel}</span>
      <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon" alt="">
    </a>
  </article>
`

const createStructuredData = (seo) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${seo.canonicalUrl}#aiman-sam`,
      name: seo.personName,
      alternateName: seo.alternateName,
      url: seo.canonicalUrl,
      image: seo.image,
      jobTitle: seo.jobTitle,
      description: seo.description,
      email: seo.email,
      sameAs: seo.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${seo.canonicalUrl}#website`,
      url: seo.canonicalUrl,
      name: seo.siteName,
      description: seo.description,
      publisher: {
        '@id': `${seo.canonicalUrl}#aiman-sam`,
      },
    },
  ],
}, null, 2)

const applyPortfolioContent = (content) => {
  if (!content || typeof content !== 'object') {
    return
  }

  const heroTitle = document.getElementById('hero-title')
  const heroIntro = document.getElementById('hero-intro')
  const heroPrimaryActionLabel = document.getElementById('hero-primary-action-label')
  const heroSecondaryActionLink = document.getElementById('hero-secondary-action-link')
  const heroSecondaryActionLabel = document.getElementById('hero-secondary-action-label')
  const heroSocialLinks = document.getElementById('hero-social-links')
  const heroBadgeLinks = document.getElementById('hero-badge-links')
  const navBrandLink = document.getElementById('nav-brand-link')
  const navBrandLabel = document.getElementById('nav-brand-label')
  const navCtaLink = document.getElementById('nav-cta-link')
  const navCtaLabel = document.getElementById('nav-cta-label')
  const mobileNavLinks = document.getElementById('mobile-nav-links')
  const statsHeading = document.getElementById('stats-heading')
  const statsDiagram = document.getElementById('stats-diagram')
  const aboutTitle = document.getElementById('about-title')
  const aboutLookingLabel = document.getElementById('about-looking-label')
  const aboutRoleList = document.getElementById('about-role-list')
  const aboutIntro = document.getElementById('about-intro')
  const aboutPoints = document.getElementById('about-points')
  const skillsTitle = document.getElementById('skills-title')
  const skillsFilterList = document.getElementById('skills-filter-list')
  const skillsPageList = document.getElementById('skills-page-list')
  const certificatesTitle = document.getElementById('certificates-title')
  const certificateList = document.getElementById('certificate-list')
  const projectsHeading = document.getElementById('projects-heading')
  const projectFilterList = document.getElementById('project-filter-list')
  const projectsContainer = document.getElementById('projects-container')
  const blogPreviewHeading = document.getElementById('blog-preview-heading')
  const blogPreviewIntro = document.getElementById('blog-preview-intro')
  const blogPreviewViewAll = document.getElementById('blog-preview-view-all')
  const blogPreviewViewAllLabel = document.getElementById('blog-preview-view-all-label')
  const blogPreviewGrid = document.getElementById('blog-preview-grid')
  const footerCopy = document.getElementById('footer-copy')
  const footerLinkList = document.getElementById('footer-link-list')
  const seoTitle = document.getElementById('seo-title')
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

  if (content.seo) {
    if (content.seo.title && seoTitle) {
      seoTitle.textContent = content.seo.title
      document.title = content.seo.title
    }

    if (content.seo.description && seoDescription) {
      seoDescription.setAttribute('content', content.seo.description)
    }

    if (content.seo.canonicalUrl && seoCanonical) {
      seoCanonical.setAttribute('href', content.seo.canonicalUrl)
    }

    if (content.seo.title && seoOgTitle) {
      seoOgTitle.setAttribute('content', content.seo.title)
    }

    if (content.seo.description && seoOgDescription) {
      seoOgDescription.setAttribute('content', content.seo.description)
    }

    if (content.seo.canonicalUrl && seoOgUrl) {
      seoOgUrl.setAttribute('content', content.seo.canonicalUrl)
    }

    if (content.seo.siteName && seoOgSiteName) {
      seoOgSiteName.setAttribute('content', content.seo.siteName)
    }

    if (content.seo.image && seoOgImage) {
      seoOgImage.setAttribute('content', content.seo.image)
    }

    if (content.seo.imageAlt && seoOgImageAlt) {
      seoOgImageAlt.setAttribute('content', content.seo.imageAlt)
    }

    if (content.seo.title && seoTwitterTitle) {
      seoTwitterTitle.setAttribute('content', content.seo.title)
    }

    if (content.seo.description && seoTwitterDescription) {
      seoTwitterDescription.setAttribute('content', content.seo.description)
    }

    if (content.seo.image && seoTwitterImage) {
      seoTwitterImage.setAttribute('content', content.seo.image)
    }

    if (seoStructuredData) {
      seoStructuredData.textContent = createStructuredData({
        ...content.seo,
        sameAs: Array.isArray(content.seo.sameAs) ? content.seo.sameAs : [],
      })
    }
  }

  if (content.navigation?.brand?.href && navBrandLink) {
    navBrandLink.href = content.navigation.brand.href
  }

  if (content.navigation?.brand?.label && navBrandLabel) {
    navBrandLabel.textContent = content.navigation.brand.label
  }

  if (content.navigation?.cta?.href && navCtaLink) {
    navCtaLink.href = content.navigation.cta.href
  }

  if (content.navigation?.cta?.label && navCtaLabel) {
    navCtaLabel.textContent = content.navigation.cta.label
  }

  if (Array.isArray(content.navigation?.items) && content.navigation.items.length && mobileNavLinks) {
    mobileNavLinks.innerHTML = content.navigation.items
      .map((item) => createNavItemMarkup(item))
      .join('')
  }

  if (content.hero?.title && heroTitle) {
    heroTitle.textContent = content.hero.title
  }

  if (content.hero?.intro && heroIntro) {
    heroIntro.textContent = content.hero.intro
  }

  if (content.hero?.primaryAction?.label && heroPrimaryActionLabel) {
    heroPrimaryActionLabel.textContent = content.hero.primaryAction.label
  }

  if (content.hero?.primaryAction?.href) {
    const myWorkLink = document.getElementById('my-work-link')
    if (myWorkLink) {
      myWorkLink.href = content.hero.primaryAction.href
    }
  }

  if (content.hero?.secondaryAction?.href && heroSecondaryActionLink) {
    heroSecondaryActionLink.href = content.hero.secondaryAction.href
  }

  if (content.hero?.secondaryAction?.download && heroSecondaryActionLink) {
    heroSecondaryActionLink.download = content.hero.secondaryAction.download
  }

  if (content.hero?.secondaryAction?.label && heroSecondaryActionLabel) {
    heroSecondaryActionLabel.textContent = content.hero.secondaryAction.label
  }

  if (Array.isArray(content.hero?.socialLinks) && content.hero.socialLinks.length && heroSocialLinks) {
    heroSocialLinks.innerHTML = content.hero.socialLinks
      .map((item) => createHeroSocialMarkup(item))
      .join('')
  }

  if (Array.isArray(content.hero?.badges) && content.hero.badges.length && heroBadgeLinks) {
    heroBadgeLinks.innerHTML = content.hero.badges
      .map((item) => createHeroBadgeMarkup(item))
      .join('')
  }

  if (content.stats?.heading && statsHeading) {
    statsHeading.textContent = content.stats.heading
  }

  if (Array.isArray(content.stats?.items) && content.stats.items.length && statsDiagram) {
    const groups = []

    for (let index = 0; index < content.stats.items.length; index += 4) {
      groups.push(content.stats.items.slice(index, index + 4))
    }

    statsDiagram.innerHTML = groups
      .map((group, index) => createStatsRow(group, index > 0))
      .join('')
  }

  if (content.about?.title && aboutTitle) {
    aboutTitle.textContent = content.about.title
  }

  if (content.about?.lookingLabel && aboutLookingLabel) {
    aboutLookingLabel.textContent = content.about.lookingLabel
  }

  if (Array.isArray(content.about?.roles) && aboutRoleList) {
    aboutRoleList.replaceChildren(
      ...content.about.roles.map((role) => {
        const chip = document.createElement('span')
        chip.className = 'about-story-chip'
        chip.textContent = role
        return chip
      })
    )
  }

  if (content.about?.intro && aboutIntro) {
    aboutIntro.textContent = content.about.intro
  }

  if (Array.isArray(content.about?.points) && aboutPoints) {
    aboutPoints.replaceChildren(
      ...content.about.points.map((point) => {
        const item = document.createElement('li')
        item.textContent = point
        return item
      })
    )
  }

  if (content.skills?.title && skillsTitle) {
    skillsTitle.textContent = content.skills.title
  }

  if (Array.isArray(content.skills?.filters) && content.skills.filters.length && skillsFilterList) {
    skillsFilterList.innerHTML = content.skills.filters
      .map((filter, index) => createSkillFilterMarkup(filter, index === 0))
      .join('')
  }

  if (Array.isArray(content.skills?.pages) && content.skills.pages.length && skillsPageList) {
    skillsPageList.innerHTML = content.skills.pages
      .map((page, index) => createSkillPageMarkup(page, index === 0))
      .join('')
  }

  if (content.certificates?.title && certificatesTitle) {
    certificatesTitle.textContent = content.certificates.title
  }

  if (Array.isArray(content.certificates?.items) && content.certificates.items.length && certificateList) {
    certificateList.innerHTML = content.certificates.items
      .map((item) => createCertificateMarkup(item))
      .join('')
  }

  if (content.projects?.heading && projectsHeading) {
    projectsHeading.textContent = content.projects.heading
  }

  if (Array.isArray(content.projects?.filters) && content.projects.filters.length && projectFilterList) {
    projectFilterList.innerHTML = content.projects.filters
      .map((filter, index) => `<button class="filter-button${index === 0 ? ' is-active' : ''}" type="button" data-filter="${filter.id}">${filter.label}</button>`)
      .join('')
  }

  if (Array.isArray(content.projects?.items) && content.projects.items.length && projectsContainer) {
    projectsContainer.innerHTML = content.projects.items
      .map((item) => createProjectMarkup(item))
      .join('')
  }

  if (content.blogPreview?.heading && blogPreviewHeading) {
    blogPreviewHeading.textContent = content.blogPreview.heading
  }

  if (content.blogPreview?.intro && blogPreviewIntro) {
    blogPreviewIntro.textContent = content.blogPreview.intro
  }

  if (content.blogPreview?.viewAllHref && blogPreviewViewAll) {
    blogPreviewViewAll.href = content.blogPreview.viewAllHref
  }

  if (content.blogPreview?.viewAllLabel && blogPreviewViewAllLabel) {
    blogPreviewViewAllLabel.textContent = content.blogPreview.viewAllLabel
  }

  if (Array.isArray(content.blogPreview?.items) && content.blogPreview.items.length && blogPreviewGrid) {
    blogPreviewGrid.innerHTML = content.blogPreview.items
      .map((item) => createBlogPreviewMarkup(item))
      .join('')
  }

  if (content.footer?.copy && footerCopy) {
    footerCopy.textContent = content.footer.copy
  }

  if (Array.isArray(content.footer?.links) && content.footer.links.length && footerLinkList) {
    footerLinkList.innerHTML = content.footer.links
      .map((item) => createFooterLinkMarkup(item))
      .join('')
  }
}

const initializeNavMenu = () => {
  const navMenuToggle = document.querySelector('.nav-menu-toggle')
  const navIconBox = document.querySelector('.nav-icon-box')

  if (!navMenuToggle || !navIconBox || navMenuToggle.dataset.initialized === 'true') {
    return
  }

  const navIconLinks = document.querySelectorAll('.nav-icon-box .nav-icon-link')

  navMenuToggle.addEventListener('click', () => {
    const isOpen = navMenuToggle.getAttribute('aria-expanded') === 'true'
    navMenuToggle.setAttribute('aria-expanded', String(!isOpen))
    navIconBox.classList.toggle('is-open', !isOpen)
  })

  navIconLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 800) {
        navMenuToggle.setAttribute('aria-expanded', 'false')
        navIconBox.classList.remove('is-open')
      }
    })
  })

  navMenuToggle.dataset.initialized = 'true'
}

const initializeProjectFilters = () => {
  const filterButtons = document.querySelectorAll('.filter-button')
  const projectCards = document.querySelectorAll('.project-card[data-category]')

  if (!filterButtons.length || !projectCards.length) {
    return
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter

      filterButtons.forEach((item) => {
        item.classList.toggle('is-active', item === button)
      })

      projectCards.forEach((card) => {
        const matches = selectedFilter === 'all' || card.dataset.category === selectedFilter
        card.classList.toggle('is-hidden', !matches)
      })
    })
  })
}

const initializeSkillFilters = () => {
  const aboutSkillFilters = document.querySelectorAll('.about-skill-filter')
  const aboutSkillPages = document.querySelectorAll('.about-skill-page')

  if (!aboutSkillFilters.length || !aboutSkillPages.length) {
    return
  }

  aboutSkillFilters.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.skillFilter

      aboutSkillFilters.forEach((item) => {
        item.classList.toggle('is-active', item === button)
      })

      aboutSkillPages.forEach((page) => {
        page.classList.toggle('is-active', page.dataset.skillPage === selectedFilter)
      })
    })
  })
}

const initializeCertificateCarousels = () => {
  const certificateCarousels = document.querySelectorAll('.about-certificate-carousel')

  if (!certificateCarousels.length) {
    return
  }

  certificateCarousels.forEach((carousel) => {
    if (carousel.dataset.initialized === 'true') {
      return
    }

    const viewport = carousel.querySelector('.about-certificate-viewport')
    const nextButton = carousel.querySelector('[data-certificate-nav="next"]')
    const prevButton = carousel.querySelector('[data-certificate-nav="prev"]')
    let autoSlideId = null

    if (!viewport || !nextButton || !prevButton) {
      return
    }

    const scrollByCard = (direction) => {
      const card = viewport.querySelector('.about-certificate-item')
      if (!card) {
        return
      }

      const gap = 14
      viewport.scrollBy({
        left: direction * (card.clientWidth + gap),
        behavior: 'smooth'
      })
    }

    const advanceCarousel = () => {
      const card = viewport.querySelector('.about-certificate-item')
      if (!card) {
        return
      }

      const gap = 14
      const step = card.clientWidth + gap
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      const nextScrollLeft = viewport.scrollLeft + step

      if (nextScrollLeft >= maxScrollLeft - 4) {
        viewport.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }

      viewport.scrollBy({ left: step, behavior: 'smooth' })
    }

    const stopAutoSlide = () => {
      if (autoSlideId !== null) {
        window.clearInterval(autoSlideId)
        autoSlideId = null
      }
    }

    const startAutoSlide = () => {
      stopAutoSlide()
      autoSlideId = window.setInterval(advanceCarousel, 4000)
    }

    prevButton.addEventListener('click', () => scrollByCard(-1))
    nextButton.addEventListener('click', () => scrollByCard(1))

    carousel.addEventListener('mouseenter', stopAutoSlide)
    carousel.addEventListener('mouseleave', startAutoSlide)
    carousel.addEventListener('focusin', stopAutoSlide)
    carousel.addEventListener('focusout', startAutoSlide)
    carousel.addEventListener('touchstart', stopAutoSlide, { passive: true })
    carousel.addEventListener('touchend', startAutoSlide, { passive: true })

    startAutoSlide()
    carousel.dataset.initialized = 'true'
  })
}

const initializeScrollReveal = () => {
  const revealElements = document.querySelectorAll([
    '#portfolio-header-visual',
    '#portfolio-header-text-container',
    '#stats-heading',
    '.stat-node',
    '#about-section > .subheader-text',
    '.about-card',
    '#projects-heading',
    '.project-filters',
    '.project-card',
    '.blog-preview-header',
    '.blog-preview-card',
    '#footer'
  ].join(','))

  if (!revealElements.length) {
    return
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  revealElements.forEach((element, index) => {
    element.dataset.scrollReveal = 'true'
    element.style.setProperty('--scroll-reveal-delay', `${Math.min(index % 4, 3) * 70}ms`)

    if (prefersReducedMotion) {
      element.classList.add('is-scroll-visible')
    }
  })

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    revealElements.forEach((element) => element.classList.add('is-scroll-visible'))
    return
  }

  const pendingElements = new Set(revealElements)
  let revealTimeout = null
  let revealInterval = null

  const revealElement = (element) => {
    element.classList.add('is-scroll-visible')
    pendingElements.delete(element)
  }

  const revealVisibleElements = () => {
    pendingElements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight * 0.88 && rect.bottom > 0

      if (isVisible) {
        revealElement(element)
      }
    })

    if (!pendingElements.size) {
      window.removeEventListener('scroll', scheduleRevealCheck)
      window.removeEventListener('resize', scheduleRevealCheck)

      if (revealInterval !== null) {
        window.clearInterval(revealInterval)
        revealInterval = null
      }
    }
  }

  const scheduleRevealCheck = () => {
    if (revealTimeout !== null) {
      return
    }

    revealTimeout = window.setTimeout(() => {
      revealTimeout = null
      revealVisibleElements()
    }, 16)
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      revealElement(entry.target)
      observer.unobserve(entry.target)
    })
  }, {
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.12
  })

  revealElements.forEach((element) => revealObserver.observe(element))
  window.addEventListener('scroll', scheduleRevealCheck, { passive: true })
  window.addEventListener('resize', scheduleRevealCheck)
  revealInterval = window.setInterval(revealVisibleElements, 180)
  scheduleRevealCheck()
}

const initializePointerEffect = () => {
  const supportsPointerEffect = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!supportsPointerEffect || prefersReducedMotion || document.querySelector('.pointer-effect')) {
    return
  }

  const pointerEffect = document.createElement('div')
  const hoverSelector = [
    'a',
    'button',
    '.project-card',
    '.stat-node',
    '.about-card',
    '.blog-preview-card',
    '.about-skill-filter',
    '.about-certificate-nav',
    '.filter-button'
  ].join(',')

  pointerEffect.className = 'pointer-effect'
  pointerEffect.setAttribute('aria-hidden', 'true')
  document.body.append(pointerEffect)

  let lastParticleTime = 0
  let lastParticleX = 0
  let lastParticleY = 0

  const createParticle = (event) => {
    const hoveredElement = document.elementFromPoint(event.clientX, event.clientY)
    const isHoveringInteractive = Boolean(hoveredElement?.closest(hoverSelector))
    const particle = document.createElement('span')
    const particleSize = isHoveringInteractive ? 8 : 6
    const driftAngle = Math.random() * Math.PI * 2
    const driftDistance = isHoveringInteractive ? 22 : 16
    const driftX = Math.cos(driftAngle) * driftDistance
    const driftY = Math.sin(driftAngle) * driftDistance

    particle.className = `pointer-particle${isHoveringInteractive ? ' pointer-particle-strong' : ''}`
    particle.style.setProperty('--particle-x', `${event.clientX}px`)
    particle.style.setProperty('--particle-y', `${event.clientY}px`)
    particle.style.setProperty('--particle-size', `${particleSize}px`)
    particle.style.setProperty('--particle-drift-x', `${driftX}px`)
    particle.style.setProperty('--particle-drift-y', `${driftY}px`)

    pointerEffect.append(particle)

    window.setTimeout(() => {
      particle.remove()
    }, 900)

    particle.addEventListener('animationend', () => {
      particle.remove()
    }, { once: true })
  }

  const updatePointerPosition = (event) => {
    const now = window.performance.now()
    const distanceFromLastParticle = Math.hypot(
      event.clientX - lastParticleX,
      event.clientY - lastParticleY
    )

    if (now - lastParticleTime < 18 || distanceFromLastParticle < 7) {
      return
    }

    pointerEffect.classList.add('is-visible')
    createParticle(event)
    lastParticleTime = now
    lastParticleX = event.clientX
    lastParticleY = event.clientY
  }

  window.addEventListener('pointermove', updatePointerPosition, { passive: true })
  window.addEventListener('pointerleave', () => {
    pointerEffect.classList.remove('is-visible')
  })
}

const initializeIcons = () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
}

const initializeInteractiveSections = () => {
  initializeSmoothScroll()
  initializeNavMenu()
  initializeProjectFilters()
  initializeSkillFilters()
  initializeCertificateCarousels()
  initializeScrollReveal()
  initializePointerEffect()
  initializeIcons()
}

const initializeProjectPage = async () => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  if (!projectId) return;

  try {
    const response = await fetch(`../content/projects/${projectId}.json`);
    if (!response.ok) throw new Error('Project not found');
    const data = await response.json();

    document.title = `${data.title} | zx10r`;
    document.getElementById('project-title-tag').textContent = data.title;
    document.getElementById('project-meta-desc').setAttribute('content', data.description);
    document.getElementById('project-main-title').textContent = data.title;
    document.getElementById('project-main-desc').textContent = data.description;
    document.getElementById('project-header-image').src = data.headerImage;
    document.getElementById('project-header-image').alt = data.title;

    const detailsContainer = document.getElementById('project-details-container');
    if (detailsContainer && data.sections) {
      detailsContainer.innerHTML = data.sections.map(section => `
        <div id="project-details">
          <div class="subheader-text">${section.title}</div>
          <div class="project-details-content">
            ${section.content.map(para => `<div class="body-text">${para}</div>`).join('')}
          </div>
        </div>
      `).join('');
    }

    const galleryGrid = document.getElementById('project-gallery-grid');
    if (galleryGrid && data.gallery) {
      galleryGrid.innerHTML = data.gallery.map(item => `
        <div class="gallery-image-container ${item.width === 'half' ? 'half-width' : ''}">
          <img src="${item.image}" class="gallery-image" alt="${item.caption}">
          <span class="image-caption">${item.caption}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading project page:', e);
  }
}

const portfolioContentFiles = [
  './content/site/seo.json',
  './content/site/navigation.json',
  './content/site/hero.json',
  './content/site/stats.json',
  './content/site/about.json',
  './content/site/skills.json',
  './content/site/certificates.json',
  './content/site/projects.json',
  './content/site/blog-preview.json',
  './content/site/footer.json'
]

Promise.all(
  portfolioContentFiles.map((filePath) =>
    fetch(filePath).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load portfolio content file ${filePath}: ${response.status}`)
      }

      return response.json()
    })
  )
)
  .then((contentSections) => {
    const mergedContent = Object.assign({}, ...contentSections)
    applyPortfolioContent(mergedContent)
    initializeInteractiveSections()
    completePageLoadAnimation()
  })
  .catch(() => {
    // Keep the inline HTML as the fallback when content loading is unavailable.
    initializeInteractiveSections()
    completePageLoadAnimation()
  })

if (window.location.pathname.includes('project.html')) {
  initializeProjectPage();
}

