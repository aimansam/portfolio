# Blog Posting Guide

This guide explains how to add, preview, publish, and verify posts for `zx10r Security Notes`.

The blog source lives in one JSON file per post under `content/blog/posts/`. The combined frontend feed is generated at `content/blog/posts.json`, and route shells are generated into `blog/` by `scripts/build-blog.js`.

## Quick Path

1. Open `/admin/`.
2. Choose `Blog Posts`.
3. Click `New Blog Post`.
3. Put images for the post under `blog/posts/<slug>/`.
4. Reference images with absolute paths such as `/blog/posts/<slug>/<image>.png`.
5. Run:

```sh
npm run build
docker compose up -d --build
```

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

The native renderer supports:

- Paragraphs
- `##` and `###` headings
- Bullet and numbered lists
- Blockquotes
- Fenced code blocks
- Inline code
- Links
- Images

## Publish A Post

Run the helper after editing JSON:

```sh
./scripts/blog-publish.sh <slug>
```

Then review:

```sh
git diff --stat
```

Commit the JSON source, generated route files, and images:

```sh
git add content/blog/posts content/blog/posts.json content/site/blog-preview.json blog
git commit -m "Publish <post title>"
git push origin main
```

## Live Verification

After pushing, check the live post:

```sh
curl -L -s -o /tmp/post.html -w '%{http_code}\n' \
  'https://portfolio.aimansam.my/blog/posts/<slug>/?check=1'
```

RSS is intentionally disabled:

```sh
curl -L -s -o /tmp/rss.xml -w '%{http_code}\n' \
  'https://portfolio.aimansam.my/blog/index.xml?check=1'
```

Expected RSS status: `404`.

## Quality Checklist

- Title is clear and specific.
- Summary explains the value of the post.
- Tags and category match the topic.
- Images have useful alt text.
- The post starts with a short intro.
- Commands are in fenced code blocks.
- The post ends with lessons learned or a clear takeaway.
