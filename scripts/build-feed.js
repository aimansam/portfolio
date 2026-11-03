const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/seo.json'), 'utf8')).seo.canonicalUrl.replace(/\/$/, '');
const { posts } = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/blog/posts.json'), 'utf8'));

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const items = posts
  .filter((post) => !post.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((post) => {
    const link = `${SITE}/blog/posts/${post.slug}/`;
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>${(post.categories || []).concat(post.tags || []).map((term) => `
      <category>${escapeXml(term)}</category>`).join('')}
    </item>`;
  });

const latest = posts.length ? new Date(Math.max(...posts.map((post) => new Date(post.date)))) : new Date();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>zx10r Security Notes</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Security writeups, lab notes, CTF workflows, and lessons from practical offensive and defensive security work.</description>
    <language>en</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;

fs.mkdirSync(path.join(ROOT, 'blog'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'blog/feed.xml'), xml);
console.log(`Built RSS feed with ${items.length} posts.`);
