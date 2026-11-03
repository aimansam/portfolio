/**
 * Writes a static page per project at projects/<id>/index.html from the
 * project-pages/project.html template. Each page loads its own content/projects/<id>.json
 * in the browser, and scripts/prerender.js fills it in at build time.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'project-pages/project.html');
const PROJECTS_DIR = path.join(ROOT, 'content/projects');
const OUT_DIR = path.join(ROOT, 'projects');

// The template lives one level deep (../css); the generated pages live two deep.
const template = fs.readFileSync(TEMPLATE, 'utf8').replace(/(href|src)="\.\.\//g, '$1="../../');

fs.rmSync(OUT_DIR, { recursive: true, force: true });

const ids = fs.readdirSync(PROJECTS_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''));

ids.forEach((id) => {
  const dir = path.join(OUT_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), template);
});

console.log(`Built ${ids.length} project pages.`);
