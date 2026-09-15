const blogRoot = '/blog/';
const dataUrl = '/content/blog/posts.json';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(value));

const readMinutes = (body = '') => Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 220));

const inlineMarkdown = (text) => escapeHtml(text)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const renderMarkdown = (markdown = '') => {
  const lines = markdown.split('\n');
  const html = [];
  let paragraph = [];
  let list = [];
  let orderedList = [];
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  const flushOrderedList = () => {
    if (!orderedList.length) return;
    html.push(`<ol>${orderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
    orderedList = [];
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        flushOrderedList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushOrderedList();
      return;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      flushList();
      flushOrderedList();
      html.push(`<figure><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}" loading="lazy"></figure>`);
      return;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      flushOrderedList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      flushOrderedList();
      list.push(bullet[1]);
      return;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushList();
      orderedList.push(ordered[1]);
      return;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      flushOrderedList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushOrderedList();
  if (inCode) html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return html.join('\n');
};

const postHref = (post) => `${blogRoot}posts/${post.slug}/`;
const categoryHref = (category) => `${blogRoot}categories/${slugify(category)}/`;
const tagHref = (tag) => `${blogRoot}tags/${slugify(tag)}/`;

const postMeta = (post) => `${formatDate(post.date)} · ${readMinutes(post.body)} min · zx10r`;

const postCard = (post, { feature = false } = {}) => `
  <article class="blog-card${feature ? ' blog-card-feature' : ''}">
    ${post.cover?.image ? `<a class="blog-card-cover" href="${postHref(post)}"><img src="${escapeHtml(post.cover.image)}" alt="${escapeHtml(post.cover.alt || post.title)}" loading="lazy"></a>` : ''}
    <div class="blog-card-body">
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

const hero = (latest) => `
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

const archiveHeader = (title, intro = '') => `
  <header class="blog-page-header">
    <span class="blog-kicker">Security Notes</span>
    <h1>${escapeHtml(title)}</h1>
    ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
  </header>
`;

const renderHome = (posts) => `
  ${hero(posts[0])}
  <section class="blog-list" aria-label="Recent posts">
    ${posts.slice(1).map((post) => postCard(post)).join('')}
  </section>
`;

const renderList = (title, posts, intro = '') => `
  ${archiveHeader(title, intro)}
  <section class="blog-list">${posts.map((post) => postCard(post)).join('')}</section>
`;

const renderTerms = (title, terms, hrefFor) => `
  ${archiveHeader(title, 'Browse the writing by topic and lab context.')}
  <section class="blog-term-grid">
    ${terms.map(([term, count]) => `<a class="blog-term" href="${hrefFor(term)}"><span>${escapeHtml(term)}</span><strong>${count}</strong></a>`).join('')}
  </section>
`;

const renderPost = (post) => `
  <article class="blog-post">
    <header class="blog-post-header">
      <div class="blog-card-tags">
        ${(post.categories || []).map((category) => `<a class="project-tag" href="${categoryHref(category)}">${escapeHtml(category)}</a>`).join('')}
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.summary)}</p>
      <div class="blog-card-meta">${escapeHtml(postMeta(post))}</div>
    </header>
    ${post.cover?.image ? `<figure class="blog-post-cover"><img src="${escapeHtml(post.cover.image)}" alt="${escapeHtml(post.cover.alt || post.title)}"></figure>` : ''}
    <div class="blog-post-content">${renderMarkdown(post.body)}</div>
    <footer class="blog-post-footer">
      <a class="blog-button" href="/blog/posts/"><span>All posts</span><img src="/assets/icons/arrow-right.svg" alt="" class="right-arrow-icon"></a>
    </footer>
  </article>
`;

const countTerms = (posts, key) => {
  const counts = new Map();
  posts.flatMap((post) => post[key] || []).forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
};

const setActiveNav = () => {
  const path = window.location.pathname;
  document.querySelectorAll('[data-blog-nav]').forEach((link) => {
    const key = link.dataset.blogNav;
    const active = path.includes(`/blog/${key}/`) ||
      (key === 'posts' && path.includes('/blog/posts/')) ||
      (key === 'tags' && path.includes('/blog/tags/')) ||
      (['writeups', 'labs', 'notes'].includes(key) && path.includes(`/blog/categories/${key}/`));
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
};

const render = (posts) => {
  const app = document.getElementById('blog-app');
  const path = window.location.pathname.replace(/\/index\.html$/u, '/');
  const parts = path.replace(/^\/blog\/?/u, '').split('/').filter(Boolean);

  let html;
  if (!parts.length) {
    html = renderHome(posts);
  } else if (parts[0] === 'posts' && parts[1]) {
    const post = posts.find((item) => item.slug === parts[1]);
    html = post ? renderPost(post) : renderList('Post not found', posts, 'That post does not exist yet.');
  } else if (parts[0] === 'posts') {
    html = renderList('All posts', posts, 'Every writeup, lab note, and security workflow in one place.');
  } else if (parts[0] === 'categories' && parts[1]) {
    const filtered = posts.filter((post) => (post.categories || []).some((category) => slugify(category) === parts[1]));
    html = renderList(parts[1].replace(/-/g, ' '), filtered);
  } else if (parts[0] === 'tags' && parts[1]) {
    const filtered = posts.filter((post) => (post.tags || []).some((tag) => slugify(tag) === parts[1]));
    html = renderList(parts[1].replace(/-/g, ' '), filtered);
  } else if (parts[0] === 'tags') {
    html = renderTerms('Tags', countTerms(posts, 'tags'), tagHref);
  } else if (parts[0] === 'about') {
    html = `${archiveHeader('About this blog', 'Security notes, lab writeups, and practical lessons from offensive security practice.')}<section class="blog-note"><p>This space keeps the deeper technical writing separate from the portfolio while using the same design system and navigation.</p></section>`;
  } else {
    html = renderHome(posts);
  }

  app.innerHTML = html;
  setActiveNav();
};

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load posts: ${response.status}`);
    return response.json();
  })
  .then((data) => render((data.posts || []).filter((post) => !post.draft).sort((a, b) => new Date(b.date) - new Date(a.date))))
  .catch((error) => {
    document.getElementById('blog-app').innerHTML = `<section class="blog-loading"><span class="blog-kicker">Error</span><h1>Blog could not load.</h1><p>${escapeHtml(error.message)}</p></section>`;
  });
