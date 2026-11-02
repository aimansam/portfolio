/**
 * Prerenders the JSON-driven pages into static HTML so crawlers and slow
 * connections see real content before js/main.js runs. It reuses the browser's
 * own render modules inside jsdom. Rewrites the pages in place, so run it only
 * in the build (Docker / CI), never on your working copy: `npm run prerender`.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'about.html', 'projects.html', 'gallery.html'];
const ORIGIN = 'http://prerender.invalid/';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch {
    return null;
  }
};

async function main() {
  // Must be set before the modules load; it is read once at import time.
  globalThis.__PORTFOLIO_ROOT__ = ORIGIN;
  const load = (file) => import(pathToFileURL(path.join(ROOT, 'js/modules', file)).href);
  const { applyPortfolioContent } = await load('apply.js');
  const { loadPageContent } = await load('content.js');

  for (const page of PAGES) {
    const file = path.join(ROOT, page);
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { url: `${ORIGIN}${page}` });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;

    const content = await loadPageContent(async (p) => readJson(p), `/${page}`);
    applyPortfolioContent(content);
    // The certificate pager renders after a short fade timeout.
    await sleep(300);

    const output = dom.serialize().split(ORIGIN).join('./');
    fs.writeFileSync(file, output);
    console.log(`Prerendered ${page}`);
    dom.window.close();
  }
}

main().catch((error) => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
