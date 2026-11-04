const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { PORTFOLIO: SITE, BLOG, BLOG_DIST } = require('./lib/sites');
const PROJECTS_DIR = path.join(ROOT, 'content/projects');
const POSTS_FILE = path.join(ROOT, 'content/blog/posts.json');

const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = [
  { loc: `${SITE}/` },
  { loc: `${SITE}/about.html` },
  { loc: `${SITE}/projects.html` },
  { loc: `${SITE}/gallery.html` }
];

fs.readdirSync(PROJECTS_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .forEach((name) => {
    urls.push({ loc: `${SITE}/projects/${encodeURIComponent(name.replace(/\.json$/, ''))}/` });
  });

const { posts } = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
const blogUrls = [
  { loc: `${BLOG}/` },
  { loc: `${BLOG}/archive/` },
  ...posts.map((post) => ({ loc: `${BLOG}/posts/${post.slug}/`, lastmod: new Date(post.date).toISOString().slice(0, 10) }))
];

const toXml = (list) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), toXml(urls));
fs.mkdirSync(BLOG_DIST, { recursive: true });
fs.writeFileSync(path.join(BLOG_DIST, 'sitemap.xml'), toXml(blogUrls));
console.log(`Built sitemaps: ${urls.length} portfolio URLs, ${blogUrls.length} blog URLs.`);
