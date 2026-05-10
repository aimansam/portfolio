# Blog Posting Guide

This guide explains how to add, preview, publish, and verify posts for `zx10r Security Notes`.

The blog source lives in `blog-source/`. The generated site lives in `blog-source/public/` and is committed because the Docker image serves that folder at `/blog/`.

## Quick Path

From the repository root, create a new writeup draft:

```sh
hugo --source blog-source new content -k writeup posts/<slug>/index.md
```

Example:

```sh
hugo --source blog-source new content -k writeup posts/blue-team-lab/index.md
```

This creates:

```text
blog-source/content/posts/blue-team-lab/index.md
```

Keep `draft: true` while writing.

## Post Structure

Use a page bundle when the post has images:

```text
blog-source/content/posts/<slug>/
  index.md
  <slug>-00.png
  <slug>-01.png
```

Reference images with relative paths:

```md
![Nmap scan results](blue-team-lab-00.png)
```

Use clear alt text. Avoid leaving exported names such as `image.png` as the visible description.

## Front Matter

Each post should include front matter like this:

```yaml
---
title: "Example Lab Writeup"
date: 2026-05-11T00:00:00+08:00
draft: true
summary: "Short summary of the target, attack path, and main lesson."
tags: ["ctf", "web", "privilege-escalation"]
categories: ["Writeups"]
showToc: true
TocOpen: true
---
```

Use `draft: false` only when the post is ready to publish.

## Notion Export Flow

1. Export from Notion as Markdown with images.
2. Extract the export outside the repo first, such as under `/tmp/`.
3. Inspect the Markdown and image files before copying them into the workspace.
4. Create a page bundle under `blog-source/content/posts/<slug>/`.
5. Copy the Markdown into `index.md`.
6. Copy images into the same folder.
7. Rename images to stable names like `<slug>-00.png`, `<slug>-01.png`.
8. Update Markdown image links and alt text.
9. Keep the post as `draft: true` while editing.

## Preview Drafts

Build with drafts enabled:

```sh
hugo --source blog-source --destination public --cleanDestinationDir --buildDrafts
```

Start or refresh the local Docker preview:

```sh
docker compose up -d --build
```

Open the draft locally:

```text
http://localhost:5200/blog/posts/<slug>/
```

Before committing, rebuild without drafts unless you are publishing:

```sh
hugo --source blog-source --destination public --cleanDestinationDir
```

## Publish A Post

1. Set `draft: false` in the post front matter.
2. Run the publish helper:

```sh
./scripts/blog-publish.sh posts/<slug>
```

3. Review the diff:

```sh
git diff --stat
```

4. Stage the source post and generated output:

```sh
git add blog-source/content/posts/<slug> blog-source/public
```

5. Commit and push:

```sh
git commit -m "Publish <post title>"
git push origin main
```

## Live Verification

After pushing, check the live post:

```sh
curl -L -s -o /tmp/post.html -w '%{http_code}\n' \
  'https://portfolio.aimansam.my/blog/posts/<slug>/?check=1'
```

Check RSS:

```sh
curl -L -s 'https://portfolio.aimansam.my/blog/index.xml?check=1' | grep '<post title>'
```

GitHub Pages can take a short time to update. If the raw GitHub file is updated but the live site is stale, wait and retry with a cache-busted query string.

## Quality Checklist

- Title is clear and specific.
- Summary explains the value of the post.
- Tags and category match the topic.
- Images have useful alt text.
- The post starts with a short intro.
- Long technical posts include a table of contents.
- Commands are in fenced code blocks.
- The post ends with lessons learned or a clear takeaway.
- Draft posts are not generated into `blog-source/public/` before commit.

## Troubleshooting

- If a published post does not appear, confirm `draft: false` and rebuild Hugo.
- If images break, confirm they are in the same page bundle as `index.md` and use relative links.
- If the live site is stale, verify the file exists on GitHub raw and wait for GitHub Pages cache to refresh.
- If RSS shows raw XML in the browser, that is expected for feed readers, but this site also includes `rss.xsl` for a readable browser view.