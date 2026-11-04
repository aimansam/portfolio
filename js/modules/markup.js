/** HTML string builders for repeated content blocks. */
import { escapeHtml, resolvePortfolioUrl, isNavItemActive } from './utils.js'

export const createNavItemMarkup = (item) => {
  const isActive = isNavItemActive(item)
  const targetAttributes = item.target
    ? ` target="${escapeHtml(item.target)}" rel="noopener noreferrer"`
    : ''
  // A link to another site (the blog) says so with an arrow; the visible text is the accessible name.
  const arrow = item.external ? '<span class="site-nav-arrow" aria-hidden="true"> &nearr;</span>' : ''

  return `<a class="site-nav-link${isActive ? ' is-active' : ''}" href="${resolvePortfolioUrl(item.href)}"${isActive ? ' aria-current="page"' : ''}${targetAttributes}>${escapeHtml(item.label)}${arrow}</a>`
}

export const createFooterLinkMarkup = (item) => {
  const label = escapeHtml(item.label)
  const ariaLabel = escapeHtml(item.ariaLabel || item.label)
  const targetAttr = item.target ? `target="${escapeHtml(item.target)}" rel="noopener noreferrer"` : ''
  return `
  <a class="icon-link" href="${resolvePortfolioUrl(item.href)}" ${targetAttr} aria-label="${ariaLabel}">
    <img src="${resolvePortfolioUrl(item.icon)}" class="footer-icon" alt="${label}"/>
  </a>
`
};

export const createHeroSocialMarkup = (item) => `
  <a class="hero-social-link" href="${escapeHtml(item.href)}" ${item.target ? `target="${escapeHtml(item.target)}" rel="noopener noreferrer"` : ''} aria-label="${escapeHtml(item.label)}">
    <img src="${escapeHtml(item.icon)}" class="hero-social-icon" alt="">
  </a>
`;

export const createHeroBadgeMarkup = (item) => `
  <a class="hero-badge-link ${escapeHtml(item.className)}" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.label)}">
    <img src="${escapeHtml(item.image)}" class="hero-badge-image" alt="${escapeHtml(item.label)}">
  </a>
`;

export const createStatsRow = (items, isCompact) => `
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

export const createCareerTimelineMarkup = (items) => `
  <div class="career-timeline">
    ${items.map((item, index) => `
      <div class="career-timeline-item">
        <span class="career-timeline-step">${escapeHtml(item.step)}</span>
        <div class="career-timeline-marker" aria-hidden="true"></div>
        <div class="career-timeline-copy">
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.label)}</span>
          <small>${escapeHtml(item.note)}</small>
        </div>
      </div>
    `).join('')}
  </div>
`;

export const createSkillFilterMarkup = (filter, isActive) => `
  <button class="about-skill-filter${isActive ? ' is-active' : ''}" type="button" data-skill-filter="${filter.id}">${filter.label}</button>
`;

export const createSkillPageMarkup = (page, isActive) => `
  <section class="about-skill-page${isActive ? ' is-active' : ''}" data-skill-page="${page.id}">
    <div class="about-pill-list">
      ${page.skills.map((skill, index) => `
        <span class="about-pill" style="--i:${index}"><i data-lucide="${skill.icon}"></i>${skill.name}</span>
      `).join('')}
    </div>
  </section>
`;

export const createCertificateMarkup = (cert) => `
  <li class="about-certificate-item">
    <div class="about-certificate-image-wrapper">
      <img src="${cert.image || './assets/images/me/aimansamformal.webp'}" alt="${cert.name}" class="about-certificate-image">
    </div>
    <div class="about-certificate-body">
      <span class="about-certificate-name">${cert.name}</span>
      <span class="about-certificate-note">${cert.note}</span>
    </div>
  </li>
`;

export const projectToolIconMap = {
  windows: 'monitor',
  linux: 'terminal',
  'active directory': 'network',
  siem: 'radar',
  'endpoint monitoring': 'shield-check',
  'bad usb': 'usb',
  'wi-fi auditing': 'wifi',
  'packet capture': 'radio',
  'rogue ap simulation': 'router',
  proxmox: 'server-cog',
  docker: 'container',
  grafana: 'chart-no-axes-combined',
  python: 'code-2',
  crawler: 'search-code',
  reporting: 'file-chart-column',
  cli: 'square-terminal',
  detection: 'scan-search',
  javascript: 'braces',
  'cloudflare pages': 'cloud',
  'threat modeling': 'triangle-alert',
  telemetry: 'activity'
}

export const getProjectToolIcon = (tool) => projectToolIconMap[tool.toLowerCase()] || 'cpu'

export const createProjectMarkup = (project) => `
  <div class="project-card" data-category="${escapeHtml(project.category)}">
    <img src="${escapeHtml(project.image)}" class="project-image" loading="lazy" alt="${escapeHtml(project.title)} project image">
    <div class="project-card-text-container">
      <div class="project-card-tags">
        ${project.tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="subheader-text project-title">${escapeHtml(project.title)}</div>
      <div class="body-text project-card-text">${escapeHtml(project.summary || project.description)}</div>
      ${Array.isArray(project.tools) && project.tools.length ? `<div class="project-card-tools" aria-label="Technology stack">${project.tools.map(tool => `<span class="project-tool-chip"><i data-lucide="${getProjectToolIcon(tool)}" aria-hidden="true"></i><span>${escapeHtml(tool)}</span></span>`).join('')}</div>` : ''}
    </div>
    <div class="project-card-actions">
      <a class="button" href="${project.href || './projects/' + project.id + '/'}" aria-label="View case study: ${escapeHtml(project.title)}">
        <span class="button-text">View case study</span>
        <img src="./assets/icons/arrow-right.svg" class="right-arrow-icon" alt="">
      </a>
      ${project.githubUrl ? `<a class="project-github-link" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escapeHtml(project.title)} on GitHub"><img src="./assets/icons/github.svg" alt=""></a>` : ''}
    </div>
  </div>
`;

export const createBlogPreviewMarkup = (post) => `
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

export const createStructuredData = (seo) => JSON.stringify({
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

// --- Home page sections ---

export const createProofMarkup = (item) => `
  <div class="home-proof-item">
    <div class="stat-value">${escapeHtml(item.value)}</div>
    <div class="home-proof-label">${escapeHtml(item.label)}</div>
  </div>
`

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '')

export const createHomeProjectMarkup = (project) => {
  const external = isAbsoluteUrl(project.href)
  const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `
  <a class="home-card" href="${escapeHtml(resolvePortfolioUrl(project.href))}"${attrs}>
    <span class="home-card-tags">${escapeHtml((project.tags || []).slice(0, 2).join(' · '))}</span>
    <span class="home-card-title">${escapeHtml(project.title)}</span>
    <span class="home-card-text">${escapeHtml(project.summary)}</span>
    <span class="home-card-tools">${escapeHtml((project.tools || []).join(' · '))}</span>
    <span class="home-card-more">${external ? 'Visit project &nearr;' : 'View case study &rarr;'}</span>
  </a>
`
}

export const createHomePostMarkup = (post) => `
  <a class="home-row" href="${escapeHtml(post.url)}">
    <span class="home-row-date">${escapeHtml(String(post.date).replace(/^([A-Za-z]{3})[A-Za-z]*/, '$1'))}</span>
    <span class="home-row-main">
      <span class="home-row-title">${escapeHtml(post.title)}</span>
      <span class="home-row-summary">${escapeHtml(post.description)}</span>
    </span>
    <span class="home-row-tag">${escapeHtml((post.tags || [])[0] || '')}</span>
  </a>
`

export const createFeaturedResearchMarkup = (item) => `
  <div class="home-research-text">
    <span class="home-research-label">${escapeHtml(item.label)}</span>
    <h2 class="home-research-title" id="home-research-title">${escapeHtml(item.title)}</h2>
    <p class="home-research-summary">${escapeHtml(item.summary)}</p>
    <ul class="home-research-tags">${(item.tags || []).map((tag) => `<li class="project-tag">${escapeHtml(tag)}</li>`).join('')}</ul>
    <div class="home-research-actions">
      <a class="button button-contrast" href="${escapeHtml(item.href)}"><span class="button-text">${escapeHtml(item.hrefLabel)}</span><img src="${resolvePortfolioUrl('./assets/icons/arrow-right.svg')}" class="right-arrow-icon button-contrast-icon" alt=""/></a>
      ${item.secondaryHref ? `<a class="home-section-link" href="${escapeHtml(item.secondaryHref)}">${escapeHtml(item.secondaryLabel)} &rarr;</a>` : ''}
    </div>
  </div>
  <a class="home-research-media" href="${escapeHtml(item.href)}" tabindex="-1" aria-hidden="true">
    <img src="${escapeHtml(resolvePortfolioUrl(item.image))}" alt="" loading="lazy" decoding="async">
  </a>
`

export const createContactMarkup = (contact) => `
  <div class="home-contact-text">
    <h2 class="home-contact-title" id="home-contact-title">${escapeHtml(contact.title)}</h2>
    <p class="home-contact-lead">${escapeHtml(contact.text)}</p>
    ${contact.email ? `<p class="home-contact-email">${escapeHtml(contact.email)}</p>` : ''}
  </div>
  <div class="home-contact-actions">
    ${(contact.actions || []).map((action) => `<a class="home-contact-button${action.primary ? ' is-primary' : ''}" href="${escapeHtml(resolvePortfolioUrl(action.href))}"${action.external ? ' target="_blank" rel="noopener noreferrer"' : ''}${action.download ? ` download="${escapeHtml(action.download)}"` : ''}>${escapeHtml(action.label)}</a>`).join('')}
  </div>
`
