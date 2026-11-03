const fs = require('fs');
const path = require('path');
const { loadPosts, slugify } = require('./lib/posts');

const ROOT = path.join(__dirname, '..');
const BLOG_DATA = path.join(ROOT, 'content/blog/posts.json');
const BLOG_DIR = path.join(ROOT, 'blog');
const PREVIEW_FILE = path.join(ROOT, 'content/site/blog-preview.json');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The side nav comes from content/site/navigation.json so it matches every other page.
// Paths there are relative to the site root ("./about.html"); blog pages need absolute ones.
const toAbsolute = (href) => (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) ? href : `/${href.replace(/^\.\//, '').replace(/index\.html$/, '')}`);

const PORTFOLIO_NAV_ITEMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/navigation.json'), 'utf8'))
  .navigation.items
  .map((item) => {
    const href = toAbsolute(item.href);
    const active = href === '/blog/';
    return `        <a class="nav-icon-link${active ? ' is-active' : ''}" href="${escapeHtml(href)}" aria-label="${escapeHtml(item.ariaLabel || item.label)}"${active ? ' aria-current="page"' : ''}>
          <img src="${escapeHtml(toAbsolute(item.icon))}" alt="" class="nav-icon">
          <span class="nav-icon-label">${escapeHtml(item.label)}</span>
        </a>`;
  })
  .join('\n');

const BLOG_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>zx10r Security Notes</title>
    <meta name="description" content="Security writeups, lab notes, CTF workflows, and lessons from practical offensive and defensive security work.">
    <link rel="icon" href="/assets/images/zx10r/favicon-64.png" type="image/png">
    <script>try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}</script>
    <link rel="stylesheet" href="/css/typography.css">
    <link rel="stylesheet" href="/css/utilities.css">
    <link rel="stylesheet" href="/css/blog.css">
  </head>
  <body>
    <header class="blog-header">
      <button class="nav-menu-toggle blog-menu-toggle" type="button" aria-expanded="false" aria-controls="blog-menu" aria-label="Open navigation menu">
        <span class="nav-menu-toggle-bar"></span>
        <span class="nav-menu-toggle-bar"></span>
        <span class="nav-menu-toggle-bar"></span>
      </button>
      <a class="nav-title-link blog-brand" href="/blog/"><span class="nav-title">zx10r</span></a>
      <nav class="blog-top-nav" aria-label="Blog navigation">
        <a href="/blog/categories/writeups/" data-blog-nav="writeups">Writeups</a>
        <a href="/blog/categories/labs/" data-blog-nav="labs">Labs</a>
        <a href="/blog/categories/notes/" data-blog-nav="notes">Notes</a>
        <a href="/blog/tags/" data-blog-nav="tags">Tags</a>
        <a href="/blog/archive/" data-blog-nav="archive">Archive</a>
      </nav>
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </header>

    <nav class="blog-portfolio-nav" aria-label="Portfolio navigation">
      <div class="nav-icon-box" id="blog-menu">
${PORTFOLIO_NAV_ITEMS}
      </div>
    </nav>

    <main class="blog-main" id="blog-app" aria-live="polite">
      <section class="blog-loading">
        <span class="blog-kicker">Security Notes</span>
        <h1>Loading blog...</h1>
      </section>
    </main>

    <script type="module" src="/js/blog.js"></script>
  </body>
</html>
`;

// Use the calendar date as written in the post so the build timezone cannot shift it.
function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : new Date(value);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const DRAFTS = process.argv.includes('--drafts');

function readPosts() {
  const posts = loadPosts({ drafts: DRAFTS });
  fs.writeFileSync(BLOG_DATA, `${JSON.stringify({ posts }, null, 2)}\n`);
  return posts;
}

function writeShell(route) {
  const target = path.join(BLOG_DIR, route, 'index.html');
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, BLOG_SHELL);
}

function updatePreview(posts) {
  const items = posts.slice(0, 3).map((post, index) => ({
    title: post.title,
    description: post.summary,
    date: formatDate(post.date),
    tags: (post.tags || []).slice(0, 2),
    url: `./blog/posts/${post.slug}/`,
    accent: index === 0
  }));

  fs.writeFileSync(PREVIEW_FILE, `${JSON.stringify({
    blogPreview: {
      heading: 'Writeups / Blog',
      intro: 'Technical writeups covering CTF solves, lab work, exploitation paths, and security lessons pulled from hands-on practice.',
      viewAllHref: './blog/',
      viewAllLabel: 'View all posts',
      items
    }
  }, null, 2)}\n`);
}

const posts = readPosts();
ensureDir(BLOG_DIR);
fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), BLOG_SHELL);
writeShell('posts');
writeShell('tags');
writeShell('archive');
writeShell('about');

const categories = new Set();
const tags = new Set();

posts.forEach((post) => {
  writeShell(`posts/${post.slug}`);
  (post.categories || []).forEach((category) => categories.add(slugify(category)));
  (post.tags || []).forEach((tag) => tags.add(slugify(tag)));
});

categories.forEach((category) => writeShell(`categories/${category}`));
tags.forEach((tag) => writeShell(`tags/${tag}`));
updatePreview(posts);

console.log(`Built blog with ${posts.length} posts${DRAFTS ? ' (including drafts)' : ''}.`);
