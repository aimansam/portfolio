/** HTML string builders for repeated content blocks. */
import { escapeHtml, resolvePortfolioUrl, isNavItemActive } from './utils.js'

export const createNavItemMarkup = (item) => {
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
