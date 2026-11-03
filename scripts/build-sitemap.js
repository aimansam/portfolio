const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/seo.json'), 'utf8')).seo.canonicalUrl.replace(/\/$/, '');
const PROJECTS_DIR = path.join(ROOT, 'content/projects');
const POSTS_FILE = path.join(ROOT, 'content/blog/posts.json');

const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = [
  { loc: `${SITE}/` },
  { loc: `${SITE}/about.html` },
  { loc: `${SITE}/projects.html` },
  { loc: `${SITE}/gallery.html` },
  { loc: `${SITE}/blog/` },
  { loc: `${SITE}/blog/archive/` }
];

fs.readdirSync(PROJECTS_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .forEach((name) => {
    urls.push({ loc: `${SITE}/projects/${encodeURIComponent(name.replace(/\.json$/, ''))}/` });
  });

const { posts } = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
posts.forEach((post) => {
  urls.push({ loc: `${SITE}/blog/posts/${post.slug}/`, lastmod: new Date(post.date).toISOString().slice(0, 10) });
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Built sitemap with ${urls.length} URLs.`);
