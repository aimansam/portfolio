/**
 * Loads blog posts from content/blog/posts.
 *
 * Supported layouts (mix freely):
 *   <slug>.md            Markdown with YAML front matter
 *   <slug>/index.md      Same, with images and other files beside it
 *   <slug>.json          Legacy format with the Markdown in a "body" string
 *
 * Defaults are filled in so a post only needs a title, a date, and a body.
 */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.join(__dirname, '../..');
const POSTS_DIR = path.join(ROOT, 'content/blog/posts');
const OUT_POSTS_DIR = path.join(ROOT, 'dist/blog/posts');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const isRemote = (url) => /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url);

const absoluteAsset = (slug, url) => (isRemote(url) ? url : `/posts/${slug}/${url.replace(/^\.\//, '')}`);

// Walks the Markdown outside fenced code blocks, applying `fn` to each line.
const mapOutsideFences = (markdown, fn) => {
  let inFence = false;
  return markdown.split('\n').map((line) => {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      return line;
    }
    return inFence ? line : fn(line);
  }).join('\n');
};

const firstImage = (markdown) => {
  let found = null;
  mapOutsideFences(markdown, (line) => {
    if (!found) {
      const match = /!\[([^\]]*)\]\(([^)\s]+)/.exec(line);
      if (match) found = { alt: match[1], image: match[2] };
    }
    return line;
  });
  return found;
};

// First real paragraph as plain text, trimmed to a sentence-ish length.
const deriveSummary = (markdown) => {
  const paragraph = [];
  let inFence = false;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(#|>|!\[|[-*]\s|\d+\.\s|\||:::)/.test(line)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(line);
  }
  const text = paragraph.join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 170) return text;
  const cut = text.slice(0, 170);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:\s]+$/, '')}…`;
};

const toIso = (value, fallback) => {
  if (value instanceof Date) return value.toISOString();
  if (value) return String(value);
  return fallback;
};

const parseFrontMatter = (source, file) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`${file}: missing front matter (--- ... ---) at the top of the file`);
  const data = YAML.parse(match[1]) || {};
  return { data, body: match[2].replace(/^\n+/, '') };
};

function readEntry(entry) {
  const full = path.join(POSTS_DIR, entry.name);
  if (entry.isFile() && entry.name.endsWith('.json')) {
    return { file: full, slug: entry.name.replace(/\.json$/, ''), raw: JSON.parse(fs.readFileSync(full, 'utf8')), dir: null };
  }
  if (entry.isFile() && entry.name.endsWith('.md')) {
    const { data, body } = parseFrontMatter(fs.readFileSync(full, 'utf8'), `content/blog/posts/${entry.name}`);
    return { file: full, slug: entry.name.replace(/\.md$/, ''), raw: { ...data, body }, dir: null };
  }
  if (entry.isDirectory() && fs.existsSync(path.join(full, 'index.md'))) {
    const file = path.join(full, 'index.md');
    const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'), `content/blog/posts/${entry.name}/index.md`);
    return { file, slug: entry.name, raw: { ...data, body }, dir: full };
  }
  return null;
}

function normalize({ file, slug: fileSlug, raw }, now) {
  const rel = path.relative(ROOT, file);
  const slug = slugify(raw.slug || fileSlug);
  const errors = [];
  if (!raw.title) errors.push(`${rel}: "title" is required`);

  const date = toIso(raw.date, fs.statSync(file).mtime.toISOString());
  const instant = new Date(date);
  if (Number.isNaN(instant.getTime())) errors.push(`${rel}: invalid date "${date}"`);

  let body = String(raw.body || '');
  body = mapOutsideFences(body, (line) => line.replace(/(!\[[^\]]*\]\()([^)\s]+)/g, (m, open, url) => `${open}${absoluteAsset(slug, url)}`));

  let cover = raw.cover;
  if (typeof cover === 'string') cover = { image: cover };
  if (cover && cover.image) {
    cover = { image: absoluteAsset(slug, cover.image), alt: cover.alt || raw.title };
  } else {
    const first = firstImage(body);
    cover = first ? { image: first.image, alt: first.alt || raw.title } : null;
  }

  const tags = [...new Set((raw.tags || []).map((tag) => slugify(tag)).filter(Boolean))];
  const categories = (raw.categories || []).length ? raw.categories : ['Notes'];

  const draft = raw.draft === true;
  const scheduled = !draft && instant > now;

  return {
    errors,
    post: {
      slug,
      title: raw.title,
      date,
      ...(raw.updated ? { updated: toIso(raw.updated) } : {}),
      summary: raw.summary || deriveSummary(body),
      tags,
      categories,
      cover,
      body,
      draft,
      scheduled
    }
  };
}

/**
 * @param {{ drafts?: boolean }} options  drafts: also include drafts and scheduled posts (preview)
 * @returns {object[]} posts, newest first
 */
function loadPosts({ drafts = false, now = new Date() } = {}) {
  const problems = [];
  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .map((entry) => {
      try {
        return readEntry(entry);
      } catch (error) {
        problems.push(error.message);
        return null;
      }
    })
    .filter(Boolean);

  const seen = new Map();
  const posts = [];

  entries.forEach((entry) => {
    const { errors, post } = normalize(entry, now);
    problems.push(...errors);
    if (seen.has(post.slug)) problems.push(`Duplicate slug "${post.slug}" (${seen.get(post.slug)} and ${path.relative(ROOT, entry.file)})`);
    seen.set(post.slug, path.relative(ROOT, entry.file));

    if (!drafts && (post.draft || post.scheduled)) return;
    if (drafts && (post.draft || post.scheduled)) post.status = post.draft ? 'draft' : 'scheduled';
    posts.push({ post, entry });
  });

  if (problems.length) {
    console.error('Blog build failed:');
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }

  posts.sort((a, b) => new Date(b.post.date) - new Date(a.post.date));

  // Copy files that sit next to bundle posts (images and so on) to posts/<slug>/ in the blog output.
  posts.forEach(({ post, entry }) => {
    if (!entry.dir) return;
    const target = path.join(OUT_POSTS_DIR, post.slug);
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(entry.dir, target, { recursive: true, filter: (src) => path.basename(src) !== 'index.md' });
  });

  return posts.map(({ post }) => post);
}

module.exports = { loadPosts, slugify, deriveSummary };
