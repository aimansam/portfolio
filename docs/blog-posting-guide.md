# Blog Posting Guide

How to write, preview, and publish posts for `Pwn Diary`.

A post is a Markdown file with a short header. Everything else (summary, cover, tags, URLs, social tags, sitemap, related posts) is generated.

## Quick Path

```sh
npm run new-post -- "My Post Title" --category Writeups   # Writeups | Labs | Notes
# edit content/blog/posts/my-post-title/index.md
npm run preview                                           # http://localhost:4000/
```

When it reads well, set `draft: false` in the header (or delete the line), then:

```sh
git add content && git commit -m "Publish: My Post Title" && git push origin main
```

CI builds, checks, prerenders and deploys. You can also write posts in the `/admin` CMS, which edits the same files.

## Post Layout

Each post is a folder with the Markdown and its images side by side:

```text
content/blog/posts/my-post-title/
  index.md
  login.png
  dashboard.png
```

(`content/blog/posts/<slug>.md` also works for a post with no images, and legacy `<slug>.json` posts still build.)

Reference images by file name; the build rewrites the path: `![Login page](login.png)`.

## The Header

```yaml
---
title: "My Post Title"               # required
date: "2026-05-11T14:30:00+08:00"    # required; a future date schedules the post
draft: true                          # drafts are never published
tags: [ctf, web]                     # lowercased automatically
categories: [Writeups]               # defaults to Notes
summary: "One sentence."             # optional: defaults to the first paragraph
cover: login.png                     # optional: defaults to the first image
updated: "2026-05-20T09:00:00+08:00" # optional: shows "Updated ..." on the post
---
```

Only `title` and `date` are required. Mistakes (missing title, bad YAML, duplicate slug) stop the build with a message naming the file.

## Drafts And Scheduling

- `draft: true` posts are never published.
- A post dated in the future is hidden until that time. A daily CI run (01:00 Malaysia time) and any push rebuild the site, so it goes live on the first build after its date.
- `npm run preview` shows drafts and scheduled posts with a "DRAFT" / "SCHEDULED" badge, and rebuilds when you save a file.

## Supported Markdown

| Syntax | Result |
|---|---|
| `## Heading`, `### Heading`, `#### Heading` | Headings. Each gets an anchor link, and posts with 3+ headings get a table of contents |
| `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` | Inline formatting |
| `[text](https://...)` | Links (external links open in a new tab; `javascript:` links are dropped) |
| `- item` / `1. item`, indented 2 spaces to nest | Bullet and numbered lists |
| `> quote` | Blockquote |
| `\| a \| b \|` rows with a `\|---\|---\|` divider | Tables |
| `![alt text](file.png)` | Image on its own line; click to zoom, so give it real alt text |
| ```` ```bash ```` ... ```` ``` ```` | Code block with a copy button |

Syntax highlighting is applied for `bash` (also `sh`, `shell`, `console`), `python`, `js` (also `json`, `ts`), `php` and `sql`. A fence with no language stays plain, which is best for tool output such as nmap results. Bash highlighting colours flags, strings, variables and comments, but not numbers, so pasted output stays readable.

### Callouts

Start a quote with one of `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. The rest can contain paragraphs, lists and code:

```md
> [!WARNING]
> Only run this against systems you are authorised to test.
```

### Spoilers

Hide flags and solutions until the reader clicks:

```md
::: spoiler Root flag
The flag is `HTB{example}`.
:::
```

## What Is Generated (Never Commit)

`/dist/`, `/blog/`, `/projects/`, `sitemap.xml`, `content/blog/posts.json` and `content/site/blog-preview.json` are git-ignored and rebuilt by `npm run build` (locally by `npm run preview`) and in CI. CI runs build, `npm run check`, then `npm run prerender`, so each post is published as static HTML with its own title, description, canonical URL, social image and `BlogPosting` data, and is added to `sitemap.xml`.

The blog also has a light/dark toggle, an `/blog/archive/` page grouped by year, and on each post: reading time, tag links, newer/older links, related posts (by shared tags), and a reading progress bar.

## Live Verification

```sh
curl -s -o /dev/null -w '%{http_code}\n' 'https://portfolio.aimansam.my/blog/posts/<slug>/'
curl -s 'https://portfolio.aimansam.my/blog/posts/<slug>/' | grep -o '<title>[^<]*'
```

## Quality Checklist

- Title is clear and specific.
- The first paragraph works as a summary (it is the meta description and the summary shown in lists) unless you set `summary`.
- Tags and category match the topic; shared tags drive "Related posts".
- Images have useful alt text.
- Commands are in fenced code blocks with a language (`bash`, `python`, ...); raw tool output has none.
- Flags and solutions are inside spoilers.
- The post ends with lessons learned or a clear takeaway.
