/**
 * Builds aimansam.my, the one-screen link hub, into dist/card. The page itself lives in
 * card/index.html; this copies the few assets it uses and adds robots, sitemap, headers and a 404.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, CARD, CARD_DIST } = require('./lib/sites');

const copy = (from, to = from) => {
  const target = path.join(CARD_DIST, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(path.join(ROOT, from), target, { recursive: true });
};

fs.rmSync(CARD_DIST, { recursive: true, force: true });
fs.mkdirSync(CARD_DIST, { recursive: true });

copy('card/index.html', 'index.html');
copy('card/404.html', '404.html');
['briefcase', 'article', 'arrow-right', 'github', 'linkedin', 'tryhackme', 'hackthebox', 'mail']
  .forEach((name) => copy(`assets/icons/${name}.svg`));
['assets/images/me/aimansamwinner-720.webp', 'assets/images/me/og-image.jpg', 'assets/images/zx10r/favicon-64.png'].forEach((file) => copy(file));

fs.writeFileSync(path.join(CARD_DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${CARD}/sitemap.xml\n`);
fs.writeFileSync(path.join(CARD_DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${CARD}/</loc>
  </url>
</urlset>
`);
fs.writeFileSync(path.join(CARD_DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=604800
`);

console.log('Built the link hub.');
