/** Pure HTML renderers for the blog, shared by js/blog.js and scripts/prerender.js. */

import { escapeHtml, slugify, renderMarkdown } from './markdown.js';

export { escapeHtml, slugify };

const blogRoot = '/blog/';
export const dataUrl = '/content/blog/posts.json';

// Posts carry the author's local date (for example 2026-05-11T00:00:00+08:00). Use that
// calendar date as written so the build server's timezone never shifts it by a day.
const calendarDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : new Date(value);
};

export const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(calendarDate(value));

export const postYear = (post) => calendarDate(post.date).getUTCFullYear();

export const readMinutes = (body = '') => Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 220));

export const postHref = (post) => `${blogRoot}posts/${post.slug}/`;
export const categoryHref = (category) => `${blogRoot}categories/${slugify(category)}/`;
export const tagHref = (tag) => `${blogRoot}tags/${slugify(tag)}/`;

export const postMeta = (post) => `${formatDate(post.date)} · ${readMinutes(post.body)} min read`;

export const postCard = (post, { feature = false } = {}) => `
  <article class="blog-card${feature ? ' blog-card-feature' : ''}">
    ${post.cover?.image ? `<a class="blog-card-cover" href="${postHref(post)}"><img src="${escapeHtml(post.cover.image)}" alt="${escapeHtml(post.cover.alt || post.title)}" loading="lazy"></a>` : ''}
    <div class="blog-card-body">
      ${post.status ? `<span class="blog-status">${escapeHtml(post.status)}</span>` : ''}
      <div class="blog-card-tags">
        ${(post.categories || []).map((category) => `<a class="project-tag" href="${categoryHref(category)}">${escapeHtml(category)}</a>`).join('')}
      </div>
      <h2><a href="${postHref(post)}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.summary)}</p>
      <div class="blog-card-meta">${escapeHtml(postMeta(post))}</div>
      <a class="blog-button${feature ? ' blog-button-primary' : ''}" href="${postHref(post)}">
        <span>${feature ? 'Read latest' : 'Read post'}</span>
        <img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon">
      </a>
    </div>
  </article>
`;

export const hero = (latest) => `
  <section class="blog-hero">
    <div class="blog-hero-copy">
      <span class="blog-kicker">Security Notes</span>
      <h1>Security notes from the lab.</h1>
      <p>Hands-on security writeups covering CTFs, Active Directory labs, web exploitation, privilege escalation, and defensive lessons from offensive practice.</p>
      <div class="blog-actions">
        <a class="blog-button blog-button-primary" href="/blog/posts/"><span>Start reading</span><img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
        <a class="blog-button" href="/blog/categories/writeups/"><span>Browse writeups</span><img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
      </div>
      <div class="blog-socials">
        <a class="icon-link" href="https://github.com/aimansam" aria-label="GitHub"><img src="/assets/icons/github.svg" alt="" class="footer-icon"></a>
        <a class="icon-link" href="https://www.linkedin.com/in/aimansam" aria-label="LinkedIn"><img src="/assets/icons/linkedin.svg" alt="" class="footer-icon"></a>
      </div>
    </div>
    ${latest ? `
      <a class="blog-latest" href="${postHref(latest)}">
        <span class="blog-kicker">Latest Writeup</span>
        <strong>${escapeHtml(latest.title)}</strong>
        <span>${escapeHtml(latest.summary)}</span>
        <small>${escapeHtml(postMeta(latest))}</small>
        <span class="blog-latest-action">Read latest <img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></span>
      </a>
    ` : ''}
  </section>
`;

export const archiveHeader = (title, intro = '') => `
  <header class="blog-page-header">
    <span class="blog-kicker">Security Notes</span>
    <h1>${escapeHtml(title)}</h1>
    ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
  </header>
`;

export const renderHome = (posts) => `
  ${hero(posts[0])}
  <section class="blog-list" aria-label="Recent posts">
    ${posts.slice(1).map((post) => postCard(post)).join('')}
  </section>
`;

export const renderList = (title, posts, intro = '') => `
  ${archiveHeader(title, intro)}
  <section class="blog-list">${posts.map((post) => postCard(post)).join('')}</section>
`;

export const renderArchive = (posts) => {
  const byYear = new Map();
  posts.forEach((post) => {
    const year = postYear(post);
    byYear.set(year, [...(byYear.get(year) || []), post]);
  });
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return `
  ${archiveHeader('Archive', 'Every post, grouped by year.')}
  ${years.length > 1 ? `<nav class="blog-archive-years" aria-label="Jump to year">${years.map((year) => `<a class="project-tag" href="#year-${year}">${year}</a>`).join('')}</nav>` : ''}
  <div class="blog-archive">
    ${years.map((year) => `
      <section class="blog-archive-year" aria-labelledby="year-${year}">
        <h2 id="year-${year}">${year}<small>${byYear.get(year).length} post${byYear.get(year).length === 1 ? '' : 's'}</small></h2>
        <ul class="blog-archive-list">
          ${byYear.get(year).map((post) => `
            <li class="blog-archive-item">
              <a href="${postHref(post)}">
                <span class="blog-archive-date">${escapeHtml(formatDate(post.date, { month: 'short', day: 'numeric' }))}</span>
                <span class="blog-archive-title">${escapeHtml(post.title)}</span>
                <span class="blog-archive-meta">${escapeHtml((post.categories || [])[0] || '')} · ${readMinutes(post.body)} min</span>
              </a>
            </li>`).join('')}
        </ul>
      </section>`).join('')}
  </div>
`;
};

export const renderTerms = (title, terms, hrefFor) => `
  ${archiveHeader(title, 'Browse the writing by topic and lab context.')}
  <section class="blog-term-grid">
    ${terms.map(([term, count]) => `<a class="blog-term" href="${hrefFor(term)}"><span>${escapeHtml(term)}</span><strong>${count}</strong></a>`).join('')}
  </section>
`;

const postNav = (label, post) => post ? `
  <a class="blog-post-nav-link" href="${postHref(post)}">
    <span class="blog-kicker">${label}</span>
    <strong>${escapeHtml(post.title)}</strong>
  </a>` : '<span></span>';

// Posts sharing the most tags with this one (excluding itself), best match first.
const relatedPosts = (post, posts, limit = 2) => posts
  .filter((other) => other.slug !== post.slug)
  .map((other) => ({ other, shared: (other.tags || []).filter((tag) => (post.tags || []).includes(tag)).length }))
  .filter((entry) => entry.shared > 0)
  .sort((a, b) => b.shared - a.shared)
  .slice(0, limit)
  .map((entry) => entry.other);

const tableOfContents = (headings) => headings.length < 3 ? '' : `
  <nav class="blog-toc" aria-label="Table of contents">
    <details open>
      <summary>On this page</summary>
      <ol>
        ${headings.map((heading) => `<li class="blog-toc-level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}
      </ol>
    </details>
  </nav>
`;

export const renderPost = (post, posts = []) => {
  const { html, headings } = renderMarkdown(post.body);
  const index = posts.findIndex((other) => other.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index >= 0 ? posts[index + 1] : null;
  const related = relatedPosts(post, posts);

  return `
  <div class="blog-progress" aria-hidden="true"><span></span></div>
  <article class="blog-post">
    <header class="blog-post-header">
      ${post.status ? `<span class="blog-status">${escapeHtml(post.status)} · not public</span>` : ''}
      <div class="blog-card-tags">
        ${(post.categories || []).map((category) => `<a class="project-tag" href="${categoryHref(category)}">${escapeHtml(category)}</a>`).join('')}
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.summary)}</p>
      <div class="blog-card-meta">${escapeHtml(postMeta(post))}${post.updated ? escapeHtml(` · Updated ${formatDate(post.updated)}`) : ''}</div>
      <div class="blog-card-tags blog-post-tags">
        ${(post.tags || []).map((tag) => `<a class="project-tag" href="${tagHref(tag)}">${escapeHtml(tag)}</a>`).join('')}
      </div>
    </header>
    ${post.cover?.image ? `<figure class="blog-post-cover"><img src="${escapeHtml(post.cover.image)}" alt="${escapeHtml(post.cover.alt || post.title)}" data-lightbox="${escapeHtml(post.cover.image)}" data-lightbox-title="${escapeHtml(post.cover.alt || post.title)}" role="button" tabindex="0"></figure>` : ''}
    ${tableOfContents(headings)}
    <div class="blog-post-content">${html}</div>
    <footer class="blog-post-footer">
      ${newer || older ? `<nav class="blog-post-nav" aria-label="More posts">${postNav('Newer', newer)}${postNav('Older', older)}</nav>` : ''}
      ${related.length ? `
        <section class="blog-related" aria-label="Related posts">
          <h2>Related posts</h2>
          <div class="blog-list">${related.map((other) => postCard(other)).join('')}</div>
        </section>` : ''}
      <a class="blog-button" href="/blog/posts/"><span>All posts</span><img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
    </footer>
  </article>
`;
};

export const countTerms = (posts, key) => {
  const counts = new Map();
  posts.flatMap((post) => post[key] || []).forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
};

// Highlights the blog nav link that matches the current path.
export const setActiveNav = (root, path) => {
  root.querySelectorAll('[data-blog-nav]').forEach((link) => {
    const key = link.dataset.blogNav;
    const active = path.includes(`/blog/${key}/`) ||
      (key === 'posts' && path.includes('/blog/posts/')) ||
      (key === 'tags' && path.includes('/blog/tags/')) ||
      (['writeups', 'labs', 'notes'].includes(key) && path.includes(`/blog/categories/${key}/`));
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
};

const SITE_NAME = 'zx10r Security Notes';

// Splits /blog/<a>/<b>/ into ['<a>', '<b>'].
export const routeParts = (pathname) => pathname
  .replace(/\/index\.html$/u, '/')
  .replace(/^\/blog\/?/u, '')
  .split('/')
  .filter(Boolean);

const findPost = (posts, parts) => (parts[0] === 'posts' && parts[1] ? posts.find((item) => item.slug === parts[1]) : null);

export const renderRoute = (posts, parts) => {
  if (!parts.length) return renderHome(posts);
  if (parts[0] === 'posts' && parts[1]) {
    const post = findPost(posts, parts);
    return post ? renderPost(post, posts) : renderList('Post not found', posts, 'That post does not exist yet.');
  }
  if (parts[0] === 'archive') return renderArchive(posts);
  if (parts[0] === 'posts') return renderList('All posts', posts, 'Every writeup, lab note, and security workflow in one place.');
  if (parts[0] === 'categories' && parts[1]) {
    const filtered = posts.filter((post) => (post.categories || []).some((category) => slugify(category) === parts[1]));
    return renderList(parts[1].replace(/-/g, ' '), filtered);
  }
  if (parts[0] === 'tags' && parts[1]) {
    const filtered = posts.filter((post) => (post.tags || []).some((tag) => slugify(tag) === parts[1]));
    return renderList(parts[1].replace(/-/g, ' '), filtered);
  }
  if (parts[0] === 'tags') return renderTerms('Tags', countTerms(posts, 'tags'), tagHref);
  if (parts[0] === 'about') {
    return `${archiveHeader('About this blog', 'Security notes, lab writeups, and practical lessons from offensive security practice.')}<section class="blog-note"><p>This space keeps the deeper technical writing separate from the portfolio while using the same design system and navigation.</p></section>`;
  }
  return renderHome(posts);
};

// Per-page <title>, description, and social image for a route.
export const routeMeta = (posts, parts) => {
  const fallback = 'Security writeups, lab notes, CTF workflows, and lessons from practical offensive and defensive security work.';
  const post = findPost(posts, parts);
  if (post) {
    return { title: `${post.title} | ${SITE_NAME}`, description: post.summary || fallback, image: post.cover?.image || '', type: 'article', post };
  }
  const label = parts[1] ? parts[1].replace(/-/g, ' ') : parts[0];
  const titles = { posts: 'All posts', archive: 'Archive', tags: 'Tags', about: 'About this blog' };
  const title = parts[0] === 'categories' || (parts[0] === 'tags' && parts[1])
    ? `${label} | ${SITE_NAME}`
    : (titles[parts[0]] ? `${titles[parts[0]]} | ${SITE_NAME}` : SITE_NAME);
  return { title, description: fallback, image: '', type: 'website', post: null };
};
