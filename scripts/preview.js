/**
 * Local blog preview: builds the blog including drafts and scheduled posts, serves the
 * site, and rebuilds when a post changes. Usage: npm run preview  (PORT=4000 by default)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 4000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain'
};

const build = () => {
  try {
    execFileSync('node', ['scripts/build-blog.js', '--drafts'], { cwd: ROOT, stdio: 'inherit' });
    execFileSync('node', ['scripts/build-projects.js'], { cwd: ROOT, stdio: 'ignore' });
  } catch {
    console.error('Build failed; fix the error above and save again.');
  }
};

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.normalize(path.join(ROOT, clean));
  if (!target.startsWith(ROOT)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) return path.join(target, 'index.html');
  return target;
};

build();

http.createServer((req, res) => {
  let file = resolveFile(req.url);
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(ROOT, '404.html')));
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`\nPreview: http://localhost:${PORT}/blog/  (drafts and scheduled posts are shown)`);
});

let timer;
fs.watch(path.join(ROOT, 'content/blog/posts'), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(build, 300);
});
