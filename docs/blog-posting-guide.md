# Blog Posting Guide

This guide explains how to add, preview, publish, and verify posts for `zx10r Security Notes`.

The blog source lives in one JSON file per post under `content/blog/posts/`. The combined frontend feed is generated at `content/blog/posts.json`, and route shells are generated into `blog/` by `scripts/build-blog.js` (git-ignored) and prerendered in CI.

## Quick Path

1. Open `/admin/`.
2. Choose `Blog Posts`.
3. Click `New Blog Post`.
3. Put images for the post under `blog/posts/<slug>/`.
4. Reference images with absolute paths such as `/blog/posts/<slug>/<image>.png`.
5. Run `npm run build` to preview, then follow "Publish A Post" below.

## Post Shape

Each post is stored as:

```text
content/blog/posts/<slug>.json
```

Use this structure:

```json
{
  "slug": "blue-team-lab",
  "title": "Example Lab Writeup",
  "date": "2026-05-11T00:00:00+08:00",
  "draft": true,
  "summary": "Short summary of the target, attack path, and main lesson.",
  "tags": ["ctf", "web", "privilege-escalation"],
  "categories": ["Writeups"],
  "cover": {
    "image": "/blog/posts/blue-team-lab/blue-team-lab-00.png",
    "alt": "Short description of the cover image"
  },
  "body": "Write Markdown here."
}
```

Use `draft: false` only when the post is ready to publish. Draft posts are ignored by the blog renderer and homepage preview.

## Supported Markdown

| Syntax | Result |
|---|---|
| `## Heading`, `### Heading`, `#### Heading` | Headings. Each gets an anchor link, and posts with 3+ headings get a table of contents |
| `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` | Inline formatting |
| `[text](https://...)` | Links (external links open in a new tab; `javascript:` links are dropped) |
| `- item` / `1. item`, indented 2 spaces to nest | Bullet and numbered lists |
| `> quote` | Blockquote |
| `\| a \| b \|` rows with a `\|---\|---\|` divider | Tables |
| `![alt text](/blog/posts/<slug>/image.png)` | Image on its own line; click to zoom, so give it real alt text |
| ```` ```bash ```` ... ```` ``` ```` | Code block with a copy button |

Syntax highlighting is applied for `bash` (also `sh`, `shell`, `console`), `python`, `js` (also `json`, `ts`), `php` and `sql`. A fence with no language stays plain, which is best for tool output such as nmap results. Bash highlighting colours commands' flags, strings, variables and comments, but not numbers, so output pasted into a `bash` block stays readable.

The blog has a light/dark theme toggle in the header (it follows the visitor's system setting until they choose, then remembers the choice) and an `/blog/archive/` page that groups every post by year.

Posts also get, automatically: reading time, tag links, newer/older links, related posts (by shared tags), and a reading progress bar.

## Publish A Post

1. Write the post in `/admin/` or as `content/blog/posts/<slug>.json`, with `"draft": false`.
2. Preview locally:

```sh
npm run build
python3 -m http.server 8000   # http://localhost:8000/blog/
```

3. Commit only the sources: the post JSON, `content/blog/posts.json`, `content/site/blog-preview.json` and any images under `blog/posts/<slug>/`. Generated pages (`blog/**/index.html`, `blog/feed.xml`, `sitemap.xml`, `projects/`) are git-ignored and rebuilt by CI.

```sh
git add content blog/posts
git commit -m "Publish <post title>"
git push origin main
```

CI runs build, `npm run check`, then `npm run prerender`, so each post is published as static HTML with its own title, description, canonical URL, social image and `BlogPosting` data, and is added to `sitemap.xml` and the RSS feed.

## Live Verification

```sh
curl -s -o /dev/null -w '%{http_code}\n' 'https://portfolio.aimansam.my/blog/posts/<slug>/'
curl -s 'https://portfolio.aimansam.my/blog/posts/<slug>/' | grep -o '<title>[^<]*'
curl -s 'https://portfolio.aimansam.my/blog/feed.xml' | grep -c '<item>'
```

## Quality Checklist

- Title is clear and specific.
- Summary explains the value of the post (it is the meta description and RSS summary).
- Tags and category match the topic; shared tags drive "Related posts".
- Images have useful alt text.
- The post starts with a short intro.
- Commands are in fenced code blocks with a language (`bash`, `python`, ...); raw tool output has none.
- The post ends with lessons learned or a clear takeaway.
