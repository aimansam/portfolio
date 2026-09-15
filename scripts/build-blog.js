const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DATA = path.join(ROOT, 'content/blog/posts.json');
const BLOG_DIR = path.join(ROOT, 'blog');
const PREVIEW_FILE = path.join(ROOT, 'content/site/blog-preview.json');

const BLOG_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>zx10r Security Notes</title>
    <meta name="description" content="Security writeups, lab notes, CTF workflows, and lessons from practical offensive and defensive security work.">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/css/typography.css">
    <link rel="stylesheet" href="/css/utilities.css">
    <link rel="stylesheet" href="/css/blog.css">
  </head>
  <body>
    <header class="blog-header">
      <a class="nav-title-link blog-brand" href="/blog/"><span class="nav-title">zx10r</span></a>
      <nav class="blog-top-nav" aria-label="Blog navigation">
        <a href="/blog/posts/" data-blog-nav="posts">Posts</a>
        <a href="/blog/categories/writeups/" data-blog-nav="writeups">Writeups</a>
        <a href="/blog/categories/labs/" data-blog-nav="labs">Labs</a>
        <a href="/blog/categories/notes/" data-blog-nav="notes">Notes</a>
        <a href="/blog/tags/" data-blog-nav="tags">Tags</a>
        <a href="/blog/about/" data-blog-nav="about">About</a>
      </nav>
    </header>

    <nav class="blog-portfolio-nav" aria-label="Portfolio navigation">
      <div class="nav-icon-box">
        <a class="nav-icon-link" href="/" aria-label="Go to home">
          <img src="/assets/icons/home.svg" alt="" class="nav-icon">
          <span class="nav-icon-label">Home</span>
        </a>
        <a class="nav-icon-link" href="/about.html" aria-label="Go to about page">
          <img src="/assets/icons/user.svg" alt="" class="nav-icon">
          <span class="nav-icon-label">About</span>
        </a>
        <a class="nav-icon-link" href="/projects.html" aria-label="Go to projects page">
          <img src="/assets/icons/briefcase.svg" alt="" class="nav-icon">
          <span class="nav-icon-label">Projects</span>
        </a>
        <a class="nav-icon-link is-active" href="/blog/" aria-label="Go to blog" aria-current="page">
          <img src="/assets/icons/article.svg" alt="" class="nav-icon">
          <span class="nav-icon-label">Blog</span>
        </a>
        <a class="nav-icon-link" href="mailto:zx10r8443@gmail.com" aria-label="Email contact">
          <img src="/assets/icons/mail.svg" alt="" class="nav-icon">
          <span class="nav-icon-label">Email</span>
        </a>
      </div>
    </nav>

    <main class="blog-main" id="blog-app" aria-live="polite">
      <section class="blog-loading">
        <span class="blog-kicker">Security Notes</span>
        <h1>Loading blog...</h1>
      </section>
    </main>

    <script src="/js/blog.js" defer></script>
  </body>
</html>
`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readPosts() {
  return JSON.parse(fs.readFileSync(BLOG_DATA, 'utf8')).posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
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
    date: new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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

console.log(`Built JSON blog with ${posts.length} posts.`);
