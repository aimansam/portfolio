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

const POSTS_ON_HOME = 10;
const TAGS_ON_HOME = 10;

// Categories with counts, biggest first.
const categoryCounts = (posts) => {
  const counts = new Map();
  posts.forEach((post) => (post.categories || []).forEach((name) => {
    const slug = slugify(name);
    counts.set(slug, { name, slug, count: (counts.get(slug)?.count || 0) + 1 });
  }));
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

export const archiveHeader = (title, intro = '') => `
  <header class="blog-page-header">
    <span class="blog-kicker">Security Notes</span>
    <h1>${escapeHtml(title)}</h1>
    ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
  </header>
`;

// Horizontal card: cover (or a patterned fallback showing the category) beside the text.
export const postCard = (post) => {
  const category = (post.categories || [])[0] || 'Notes';
  return `
  <a class="blog-post-card" href="${postHref(post)}">
    <span class="blog-post-card-media${post.cover?.image ? '' : ' is-fallback'}">
      ${post.cover?.image ? `<img src="${escapeHtml(post.cover.image)}" alt="" loading="lazy">` : `<span>${escapeHtml(category)}</span>`}
    </span>
    <span class="blog-post-card-body">
      ${post.status ? `<span class="blog-status">${escapeHtml(post.status)}</span>` : ''}
      <span class="blog-post-card-meta">${escapeHtml(category)} · ${escapeHtml(formatDate(post.date))} · ${readMinutes(post.body)} min</span>
      <span class="blog-post-card-title">${escapeHtml(post.title)}</span>
      <span class="blog-post-card-summary">${escapeHtml(post.summary)}</span>
    </span>
  </a>
`;
};

const postCards = (posts) => (posts.length
  ? `<div class="blog-post-cards">${posts.map(postCard).join('')}</div>`
  : '<p class="blog-empty">No posts here yet.</p>');

const sidebar = (posts, activeCategory = '') => {
  const categories = categoryCounts(posts);
  const topTags = countTerms(posts, 'tags')
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TAGS_ON_HOME);
  return `
  <aside class="blog-sidebar" aria-label="Blog sidebar">
    <section class="blog-side-card">
      <h2 class="blog-section-title">About</h2>
      <p><strong>Aiman Sam</strong> is a final-year cybersecurity student and penetration tester. These notes are written up from red team labs and CTFs.</p>
      <div class="blog-socials">
        <a class="icon-link" href="https://github.com/aimansam" aria-label="GitHub"><img src="/assets/icons/github.svg" alt="" class="footer-icon"></a>
        <a class="icon-link" href="https://www.linkedin.com/in/aimansam" aria-label="LinkedIn"><img src="/assets/icons/linkedin.svg" alt="" class="footer-icon"></a>
      </div>
    </section>
    ${categories.length ? `
    <section class="blog-side-card">
      <h2 class="blog-section-title">Categories</h2>
      <ul class="blog-side-list">
        ${categories.map(({ name, slug, count }) => `<li><a href="${categoryHref(name)}"${slug === activeCategory ? ' class="is-active" aria-current="page"' : ''}><span>${escapeHtml(name)}</span><strong>${count}</strong></a></li>`).join('')}
      </ul>
    </section>` : ''}
    ${topTags.length ? `
    <section class="blog-side-card">
      <h2 class="blog-section-title">Tags</h2>
      <div class="blog-tag-cloud">${topTags.map(([tag, count]) => `<a class="project-tag" href="${tagHref(tag)}">${escapeHtml(tag)} <span>${count}</span></a>`).join('')}</div>
    </section>` : ''}
    <a class="blog-more" href="/blog/archive/">Browse the archive <img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
  </aside>
`;
};

export const renderHome = (posts) => {
  const shown = posts.slice(0, POSTS_ON_HOME);
  return `
  <div class="blog-layout">
    <div class="blog-main-col">
      <h1 class="blog-home-title">Security notes from the lab.</h1>
      ${postCards(shown)}
      ${posts.length > POSTS_ON_HOME ? `<a class="blog-more" href="/blog/posts/">View all ${posts.length} posts <img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>` : ''}
    </div>
    ${sidebar(posts)}
  </div>
`;
};

// options.allPosts feeds the sidebar counts; options.activeCategory highlights the current category.
export const renderList = (title, posts, intro = '', options = {}) => `
  ${archiveHeader(title, intro)}
  <div class="blog-layout">
    <div class="blog-main-col">${postCards(posts)}</div>
    ${sidebar(options.allPosts || posts, options.activeCategory || '')}
  </div>
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
  <section class="blog-tag-page" aria-label="All tags">
    <div class="blog-tag-cloud blog-tag-cloud-large">
      ${[...terms].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([term, count]) => `<a class="project-tag" href="${hrefFor(term)}">${escapeHtml(term)} <span>${count}</span></a>`).join('')}
    </div>
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

// Only worth the space on longer posts: 5+ minutes, or plenty of sections.
const tableOfContents = (headings, minutes) => headings.length < 3 || (minutes < 5 && headings.length < 8) ? '' : `
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
    ${tableOfContents(headings, readMinutes(post.body))}
    <div class="blog-post-content">${html}</div>
    <footer class="blog-post-footer">
      ${newer || older ? `<nav class="blog-post-nav" aria-label="More posts">${postNav('Newer', newer)}${postNav('Older', older)}</nav>` : ''}
      ${related.length ? `
        <section class="blog-related" aria-label="Related posts">
          <h2>Related posts</h2>
          ${postCards(related)}
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
  if (parts[0] === 'posts') return renderList('All posts', posts, 'Every writeup, lab note, and security workflow in one place.', { allPosts: posts });
  if (parts[0] === 'categories' && parts[1]) {
    const filtered = posts.filter((post) => (post.categories || []).some((category) => slugify(category) === parts[1]));
    const name = categoryCounts(posts).find((entry) => entry.slug === parts[1])?.name || parts[1].replace(/-/g, ' ');
    return renderList(name, filtered, '', { allPosts: posts, activeCategory: parts[1] });
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
