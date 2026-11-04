const fs = require('fs');
const path = require('path');
const { loadPosts, slugify } = require('./lib/posts');
const { ROOT, PORTFOLIO, BLOG, BLOG_DIST } = require('./lib/sites');

/**
 * Builds the blog as its own site: everything pwn.aimansam.my serves lands in dist/blog,
 * with routes at the root (/posts/<slug>/). It also writes small redirect pages to
 * blog/ in the portfolio so the old portfolio.aimansam.my/blog/ links still land on the new home.
 */
const BLOG_DATA = path.join(ROOT, 'content/blog/posts.json');
const BLOG_DIR = BLOG_DIST;
const OLD_BLOG_DIR = path.join(ROOT, 'blog');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BLOG_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pwn Diary | zx10r</title>
    <meta name="description" content="Pwn Diary: writeups, lab notes, and malware analysis from red team and penetration testing practice.">
    <link rel="icon" href="/assets/images/zx10r/favicon-64.png" type="image/png">
    <script>try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}</script>
    <link rel="stylesheet" href="/css/typography.css">
    <link rel="stylesheet" href="/css/utilities.css">
    <link rel="stylesheet" href="/css/blog.css">
  </head>
  <body>
    <a class="skip-to-content" href="#blog-app">Skip to main content</a>
    <header class="blog-header">
      <a class="nav-title-link blog-brand" href="/" aria-label="Pwn Diary, blog home"><span class="nav-title">zx10r</span><span class="blog-brand-label">Pwn Diary</span></a>
      <nav class="blog-top-nav" aria-label="Blog navigation">
        <a href="/categories/research/" data-blog-nav="research">Research</a>
        <a href="/categories/ctf/" data-blog-nav="ctf">CTF</a>
        <a href="/categories/labs/" data-blog-nav="labs">Labs</a>
        <a href="/tags/" data-blog-nav="tags">Tags</a>
        <a href="/archive/" data-blog-nav="archive">Archive</a>
      </nav>
      <div class="blog-header-actions">
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">
          <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>
      </div>
    </header>

    <main class="blog-main" id="blog-app" aria-live="polite">
      <section class="blog-loading">
        <span class="blog-kicker">Pwn Diary</span>
        <h1>Loading blog...</h1>
      </section>
    </main>

    <footer class="blog-footer">
      <div class="blog-footer-inner">
        <span>&copy; Aiman Sam &middot; <a href="/">Pwn Diary</a></span>
        <nav aria-label="Elsewhere">
          <a href="${PORTFOLIO}/">Portfolio</a>
          <a href="https://github.com/aimansam" rel="me noopener">GitHub</a>
          <a href="https://www.linkedin.com/in/aimansam" rel="me noopener">LinkedIn</a>
          <a href="mailto:aimansammrsm@gmail.com">Email</a>
        </nav>
      </div>
    </footer>

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

fs.rmSync(OLD_BLOG_DIR, { recursive: true, force: true });
fs.rmSync(BLOG_DIR, { recursive: true, force: true });
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

// Everything else the blog site needs to stand on its own.
const copy = (from, to) => {
  ensureDir(path.dirname(path.join(BLOG_DIR, to)));
  fs.cpSync(path.join(ROOT, from), path.join(BLOG_DIR, to), { recursive: true });
};
['typography.css', 'utilities.css', 'blog.css'].forEach((name) => copy(`css/${name}`, `css/${name}`));
copy('js', 'js');
copy('assets/icons', 'assets/icons');
copy('assets/images/zx10r/favicon-64.png', 'assets/images/zx10r/favicon-64.png');
ensureDir(path.join(BLOG_DIR, 'content/blog'));
fs.copyFileSync(BLOG_DATA, path.join(BLOG_DIR, 'content/blog/posts.json'));
fs.readdirSync(path.join(ROOT, 'blog-site')).forEach((name) => copy(`blog-site/${name}`, name));

// Old portfolio.aimansam.my/blog/... addresses: a page that sends visitors (and search engines) to the new home.
const stub = (route, to = route) => {
  const target = `${BLOG}/${to}${to ? '/' : ''}`;
  const dir = path.join(OLD_BLOG_DIR, route);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Moved to Pwn Diary</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="${target}">
    <meta http-equiv="refresh" content="0; url=${target}">
    <script>location.replace(${JSON.stringify(target)} + location.hash)</script>
  </head>
  <body>
    <p>Pwn Diary has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`);
};
['', 'posts', 'tags', 'archive', 'about'].forEach(stub);
posts.forEach((post) => stub(`posts/${post.slug}`));
categories.forEach((category) => stub(`categories/${category}`));
tags.forEach((tag) => stub(`tags/${tag}`));
// Categories that were renamed keep their old address (see blog-site/_redirects for the blog itself).
Object.entries({ writeups: 'ctf', notes: 'research' }).forEach(([from, to]) => stub(`categories/${from}`, `categories/${to}`));

console.log(`Built blog with ${posts.length} posts${DRAFTS ? ' (including drafts)' : ''}.`);
