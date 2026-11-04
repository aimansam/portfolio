/**
 * Static integrity check for CI: content JSON parses, every local asset a page,
 * stylesheet or content file references exists, and generated routes are present.
 * Run `npm run check` after `npm run build`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'cms-auth', 'docs', 'scripts', 'dist']);
const problems = [];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (SKIP_DIRS.has(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const files = walk(ROOT);
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const exists = (file) => fs.existsSync(file);

// 1. JSON validity
files.filter((f) => f.endsWith('.json') && rel(f).startsWith('content/')).forEach((file) => {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    problems.push(`${rel(file)}: invalid JSON (${error.message})`);
  }
});

// 2. Referenced local assets
const ASSET_REF = /["'(]((?:\.{0,2}\/)?assets\/[^"'()?#\s]+)/g;
files.filter((f) => /\.(html|json|css)$/.test(f)).forEach((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const isContent = rel(file).startsWith('content/');
  for (const match of source.matchAll(ASSET_REF)) {
    const ref = match[1];
    const stripped = ref.replace(/^(?:\.{1,2}\/)+/, '').replace(/^\//, '');
    // Content JSON is resolved from the site root; pages and CSS from their own folder.
    const candidates = isContent || ref.startsWith('/')
      ? [path.join(ROOT, stripped)]
      : [path.resolve(path.dirname(file), ref), path.join(ROOT, stripped)];
    if (!candidates.some(exists)) problems.push(`${rel(file)}: missing asset ${ref}`);
  }
});

// 3. Generated routes
const projectIds = fs.readdirSync(path.join(ROOT, 'content/projects'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''));
projectIds.forEach((id) => {
  if (!exists(path.join(ROOT, 'projects', id, 'index.html'))) problems.push(`projects/${id}/index.html missing (run npm run build)`);
});
const { posts } = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/blog/posts.json'), 'utf8'));
posts.forEach((post) => {
  if (!exists(path.join(ROOT, 'dist/blog/posts', post.slug, 'index.html'))) problems.push(`dist/blog/posts/${post.slug}/index.html missing (run npm run build)`);
  // The old portfolio.aimansam.my/blog/... address keeps a redirect page.
  if (!exists(path.join(ROOT, 'blog/posts', post.slug, 'index.html'))) problems.push(`blog/posts/${post.slug}/index.html (redirect page) missing (run npm run build)`);
});
['index.html', 'sitemap.xml', 'robots.txt', '404.html', '_headers', 'css/blog.css', 'js/blog.js', 'content/blog/posts.json', 'assets/icons/arrow-right.svg'].forEach((name) => {
  if (!exists(path.join(ROOT, 'dist/blog', name))) problems.push(`dist/blog/${name} missing (run npm run build)`);
});
['index.html', 'sitemap.xml'].forEach((name) => {
  if (!exists(path.join(ROOT, 'dist/card', name))) problems.push(`dist/card/${name} missing (run npm run build)`);
});
['sitemap.xml', 'robots.txt', '404.html'].forEach((name) => {
  if (!exists(path.join(ROOT, name))) problems.push(`${name} missing`);
});

if (problems.length) {
  console.error(`Site check failed with ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}
console.log(`Site check passed (${files.length} files scanned).`);
