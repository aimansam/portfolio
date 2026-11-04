/**
 * Prerenders the JSON-driven pages into static HTML so crawlers and slow
 * connections see real content before the page scripts run. It reuses the
 * browser's own render modules inside jsdom. Rewrites pages in place, so run it
 * only in the build (Docker / CI), never on your working copy: `npm run prerender`.
 * Run `npm run build` first; it generates the blog shells and project pages.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');

const { ROOT, BLOG, BLOG_DIST } = require('./lib/sites');
const { withBeacon } = require('./lib/analytics');
const ORIGIN = 'http://prerender.invalid/';
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/seo.json'), 'utf8')).seo.canonicalUrl.replace(/\/$/, '');
const SITE_IMAGE = `${SITE}/assets/images/me/og-image.jpg`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch {
    return null;
  }
};

const walk = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  })
  : [];

// Canonical and social URLs must be absolute; everything else becomes a
// relative path from the page's depth.
const finalize = (html, relativePrefix) => html
  .replace(/(<meta[^>]*content="|<link rel="canonical"[^>]*href=")http:\/\/prerender\.invalid\//g, `$1${SITE}/`)
  .split(ORIGIN).join(relativePrefix);

const setHead = (document, selector, create) => {
  const existing = document.head.querySelector(selector);
  if (existing) existing.remove();
  document.head.appendChild(create());
};

const setMeta = (document, attr, key, content) => setHead(document, `meta[${attr}="${key}"]`, () => {
  const meta = document.createElement('meta');
  meta.setAttribute(attr, key);
  meta.setAttribute('content', content);
  return meta;
});

// Reads PNG width/height from the IHDR chunk; returns null for other formats.
const pngSize = (file) => {
  try {
    const buffer = fs.readFileSync(file);
    if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  } catch {
    return null;
  }
};

// Explicit dimensions let the browser reserve space and avoid layout shift.
const addImageDimensions = (document, root) => {
  document.querySelectorAll('#blog-app img[src^="/"]').forEach((img) => {
    if (img.hasAttribute('width')) return;
    const size = pngSize(path.join(root, img.getAttribute('src').split('?')[0]));
    if (!size) return;
    img.setAttribute('width', size.width);
    img.setAttribute('height', size.height);
  });
};

async function prerenderPage(modules, file, route, depthPrefix) {
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { url: `${ORIGIN}${route}` });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  const content = await modules.loadPageContent(async (p) => readJson(p), `/${route}`);
  modules.applyPortfolioContent(content);
  // The certificate pager renders after a short fade timeout.
  await sleep(300);

  fs.writeFileSync(file, withBeacon(finalize(dom.serialize(), depthPrefix), 'portfolio'));
  dom.window.close();
}

function prerenderBlog(blog) {
  const posts = (readJson('content/blog/posts.json')?.posts || [])
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const blogDir = BLOG_DIST;
  const shells = walk(blogDir).filter((file) => path.basename(file) === 'index.html');

  shells.forEach((file) => {
    const relative = path.relative(blogDir, path.dirname(file)).split(path.sep).join('/');
    const route = relative ? `/${relative}/` : '/';
    const parts = blog.routeParts(route);
    const meta = blog.routeMeta(posts, parts);
    const canonical = `${BLOG}${route}`;
    const image = meta.image ? new URL(meta.image, `${BLOG}/`).href : SITE_IMAGE;

    const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { url: canonical });
    const { document } = dom.window;

    const app = document.getElementById('blog-app');
    app.innerHTML = blog.renderRoute(posts, parts);
    app.setAttribute('data-prerendered', '');
    addImageDimensions(document, blogDir);
    blog.setActiveNav(document, route);
    document.title = meta.title;
    setMeta(document, 'name', 'description', meta.description);
    setHead(document, 'link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = canonical;
      return link;
    });
    setMeta(document, 'property', 'og:type', meta.type);
    setMeta(document, 'property', 'og:title', meta.title);
    setMeta(document, 'property', 'og:description', meta.description);
    setMeta(document, 'property', 'og:url', canonical);
    setMeta(document, 'property', 'og:image', image);
    setMeta(document, 'name', 'twitter:card', 'summary_large_image');
    setMeta(document, 'name', 'twitter:title', meta.title);
    setMeta(document, 'name', 'twitter:description', meta.description);
    setMeta(document, 'name', 'twitter:image', image);

    if (meta.post) {
      setHead(document, 'script[type="application/ld+json"]', () => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: meta.post.title,
          description: meta.post.summary,
          datePublished: meta.post.date,
          image,
          mainEntityOfPage: canonical,
          author: { '@type': 'Person', name: 'Aiman Sam', url: `${SITE}/` }
        }).replace(/</g, '\\u003c');
        return script;
      });
    }

    fs.writeFileSync(file, withBeacon(dom.serialize(), 'blog'));
    dom.window.close();
  });
  console.log(`Prerendered ${shells.length} blog pages`);
}

async function main() {
  // Must be set before the modules load; it is read once at import time.
  globalThis.__PORTFOLIO_ROOT__ = ORIGIN;
  const load = (file) => import(pathToFileURL(path.join(ROOT, 'js/modules', file)).href);
  const apply = await load('apply.js');
  const content = await load('content.js');
  const modules = { applyPortfolioContent: apply.applyPortfolioContent, loadPageContent: content.loadPageContent };

  for (const page of ['index.html', 'about.html', 'projects.html', 'gallery.html']) {
    await prerenderPage(modules, path.join(ROOT, page), page, './');
    console.log(`Prerendered ${page}`);
  }

  const projectsDir = path.join(ROOT, 'projects');
  const projectIds = fs.existsSync(projectsDir) ? fs.readdirSync(projectsDir) : [];
  for (const id of projectIds) {
    await prerenderPage(modules, path.join(projectsDir, id, 'index.html'), `projects/${id}/`, '../../');
  }
  console.log(`Prerendered ${projectIds.length} project pages`);

  prerenderBlog(await load('blog-render.js'));
}

main().catch((error) => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
