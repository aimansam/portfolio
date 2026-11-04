/** Pure HTML renderers for the blog, shared by js/blog.js and scripts/prerender.js. */

import { escapeHtml, slugify, renderMarkdown } from './markdown.js';

export { escapeHtml, slugify };

// The blog is served from the root of its own subdomain.
const blogRoot = '/';
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

// Categories with counts, biggest first.
const categoryCounts = (posts) => {
  const counts = new Map();
  posts.forEach((post) => (post.categories || []).forEach((name) => {
    const slug = slugify(name);
    counts.set(slug, { name, slug, count: (counts.get(slug)?.count || 0) + 1 });
  }));
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

// The small label above a page title says what kind of page it is.
export const archiveHeader = (title, intro = '', kicker = 'Pwn Diary') => `
  <header class="blog-page-header">
    <span class="blog-kicker">${escapeHtml(kicker)}</span>
    <h1>${escapeHtml(title)}</h1>
    ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
  </header>
`;

// One post as a row: date, title with a short summary, category. No images, so a long list stays quick to scan.
export const postRow = (post) => {
  const category = (post.categories || [])[0] || 'Research';
  return `
  <a class="blog-row" href="${postHref(post)}">
    <time class="blog-row-date" datetime="${escapeHtml(String(post.date).slice(0, 10))}">${escapeHtml(formatDate(post.date, { month: 'short', day: 'numeric' }))}</time>
    <span class="blog-row-main">
      ${post.status ? `<span class="blog-status">${escapeHtml(post.status)}</span>` : ''}
      <span class="blog-row-title">${escapeHtml(post.title)}</span>
      <span class="blog-row-summary">${escapeHtml(post.summary)}</span>
    </span>
    <span class="blog-row-meta"><span class="blog-row-cat">${escapeHtml(category)}</span><span>${readMinutes(post.body)} min</span></span>
  </a>
`;
};

// Rows, with a year heading above each group when the posts span more than one year.
const postRows = (posts) => {
  if (!posts.length) return '<p class="blog-empty">No posts here yet.</p>';
  const years = [...new Set(posts.map(postYear))];
  if (years.length < 2) return `<div class="blog-rows">${posts.map(postRow).join('')}</div>`;
  return years.map((year) => `
    <section class="blog-rows" aria-label="${year}">
      <h2 class="blog-rows-year">${year}</h2>
      ${posts.filter((post) => postYear(post) === year).map(postRow).join('')}
    </section>`).join('');
};

export const renderHome = (posts) => {
  const shown = posts.slice(0, POSTS_ON_HOME);
  return `
  <section class="blog-index">
    <header class="blog-index-head">
      <h1 class="blog-home-title">A diary of things I broke, fixed and learned.</h1>
      <p>Red team labs, CTF writeups and malware analysis by Aiman Sam, a final-year cybersecurity student.</p>
    </header>
    ${postRows(shown)}
    <a class="blog-more" href="${posts.length > POSTS_ON_HOME ? '/posts/' : '/archive/'}">${posts.length > POSTS_ON_HOME ? `View all ${posts.length} posts` : 'Browse the archive'} <img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
  </section>
`;
};

export const renderList = (title, posts, intro = '', kicker = 'Pwn Diary') => `
  ${archiveHeader(title, intro, kicker)}
  <div class="blog-index">${postRows(posts)}</div>
`;

export const renderArchive = (posts) => {
  const byYear = new Map();
  posts.forEach((post) => {
    const year = postYear(post);
    byYear.set(year, [...(byYear.get(year) || []), post]);
  });
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return `
  ${archiveHeader('Archive', 'Every post, grouped by year.', 'By year')}
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
  ${archiveHeader(title, 'Browse the writing by topic and lab context.', 'Topics')}
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

// Section numbers (1, 1.1, 2 ...) for h2/h3 headings, keyed by heading id.
const sectionNumbers = (headings) => {
  const numbers = new Map();
  let section = 0;
  let sub = 0;
  headings.forEach((heading) => {
    if (heading.level === 2) { section += 1; sub = 0; numbers.set(heading.id, `${section}`); }
    else if (heading.level === 3 && section) { sub += 1; numbers.set(heading.id, `${section}.${sub}`); }
  });
  return numbers;
};

// Only worth the space on longer posts: 5+ minutes, or plenty of sections.
const tableOfContents = (headings, minutes, numbers) => headings.length < 3 || (minutes < 5 && headings.length < 8) ? '' : `
  <nav class="blog-toc" aria-label="Table of contents">
    <details open>
      <summary>Contents</summary>
      <ol>
        ${headings.map((heading) => `<li class="blog-toc-level-${heading.level}"${numbers.has(heading.id) ? ` data-num="${numbers.get(heading.id)}" data-section="${numbers.get(heading.id).split('.')[0]}"` : ''}><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}
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
  const numbers = sectionNumbers(headings);
  const toc = tableOfContents(headings, readMinutes(post.body), numbers);

  return `
  <div class="blog-progress" aria-hidden="true"><span></span></div>
  <article class="blog-post${toc ? ' has-toc' : ''}">
    ${toc}
    <div class="blog-post-main">
      <nav class="blog-breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Pwn Diary</a>
        ${(post.categories || [])[0] ? `<span aria-hidden="true">/</span><a href="${categoryHref(post.categories[0])}">${escapeHtml(post.categories[0])}</a>` : ''}
        <span aria-hidden="true">/</span>
        <span class="blog-breadcrumbs-current" aria-current="page">${escapeHtml(post.title)}</span>
      </nav>
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
      ${post.cover?.image && !html.includes(post.cover.image) ? `<figure class="blog-post-cover"><img src="${escapeHtml(post.cover.image)}" alt="${escapeHtml(post.cover.alt || post.title)}" data-lightbox="${escapeHtml(post.cover.image)}" data-lightbox-title="${escapeHtml(post.cover.alt || post.title)}" role="button" tabindex="0"></figure>` : ''}
      <div class="blog-post-content">${toc ? html.replace(/<h([23]) id="([^"]+)"/gu, (match, level, id) => numbers.has(id) ? `<h${level} id="${id}" data-num="${numbers.get(id)}"` : match) : html}</div>
      <footer class="blog-post-footer">
        ${newer || older ? `<nav class="blog-post-nav" aria-label="More posts">${postNav('Newer', newer)}${postNav('Older', older)}</nav>` : ''}
        ${related.length ? `
          <section class="blog-related" aria-label="Related posts">
            <h2>Related posts</h2>
            <div class="blog-rows">${related.map(postRow).join('')}</div>
          </section>` : ''}
        <a class="blog-button" href="/posts/"><span>All posts</span><img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
      </footer>
    </div>
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
    const active = path.includes(`/${key}/`) ||
      (key === 'posts' && path.includes('/posts/')) ||
      (key === 'tags' && path.includes('/tags/')) ||
      (['research', 'ctf', 'labs'].includes(key) && path.includes(`/categories/${key}/`));
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
};

const SITE_NAME = 'Pwn Diary';

// Splits /<a>/<b>/ into ['<a>', '<b>'].
export const routeParts = (pathname) => pathname
  .replace(/\/index\.html$/u, '/')
  .replace(/^\//u, '')
  .split('/')
  .filter(Boolean);

const findPost = (posts, parts) => (parts[0] === 'posts' && parts[1] ? posts.find((item) => item.slug === parts[1]) : null);

export const renderRoute = (posts, parts) => {
  if (!parts.length) return renderHome(posts);
  if (parts[0] === 'posts' && parts[1]) {
    const post = findPost(posts, parts);
    return post ? renderPost(post, posts) : renderList('Post not found', posts, 'That post does not exist yet.', '404');
  }
  if (parts[0] === 'archive') return renderArchive(posts);
  if (parts[0] === 'posts') return renderList('All posts', posts, 'Every writeup, lab note, and security workflow in one place.', 'Index');
  if (parts[0] === 'categories' && parts[1]) {
    const filtered = posts.filter((post) => (post.categories || []).some((category) => slugify(category) === parts[1]));
    const name = categoryCounts(posts).find((entry) => entry.slug === parts[1])?.name || parts[1].replace(/-/g, ' ');
    return renderList(name, filtered, '', 'Category');
  }
  if (parts[0] === 'tags' && parts[1]) {
    const filtered = posts.filter((post) => (post.tags || []).some((tag) => slugify(tag) === parts[1]));
    return renderList(parts[1].replace(/-/g, ' '), filtered, '', 'Tag');
  }
  if (parts[0] === 'tags') return renderTerms('Tags', countTerms(posts, 'tags'), tagHref);
  if (parts[0] === 'about') {
    return `${archiveHeader('About this blog', 'A diary of things I broke, fixed and learned: lab writeups, malware analysis, and practical lessons from offensive security.', 'About')}<section class="blog-note"><p>This space keeps the deeper technical writing separate from the portfolio while using the same design system and navigation.</p></section>`;
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
