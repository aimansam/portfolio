/** The three public origins (no trailing slash), read from content/site/sites.json. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const { sites } = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/sites.json'), 'utf8'));

module.exports = {
  ROOT,
  CARD: sites.card.replace(/\/$/, ''),
  PORTFOLIO: sites.portfolio.replace(/\/$/, ''),
  BLOG: sites.blog.replace(/\/$/, ''),
  // The blog site is built here and served from its own root.
  BLOG_DIST: path.join(ROOT, 'dist/blog'),
  CARD_DIST: path.join(ROOT, 'dist/card')
};
