/**
 * Scaffolds a new blog post as a draft: npm run new-post -- "My Post Title" [--category Writeups]
 * Creates content/blog/posts/<slug>/index.md. Put images next to it and reference them
 * by file name, for example ![Login page](login.png).
 */
const fs = require('fs');
const path = require('path');
const { slugify } = require('./lib/posts');

const args = process.argv.slice(2);
const categoryFlag = args.indexOf('--category');
const category = categoryFlag >= 0 ? args.splice(categoryFlag, 2)[1] : 'Notes';
const title = args.join(' ').trim();

if (!title) {
  console.error('Usage: npm run new-post -- "Post title" [--category Writeups|Labs|Notes]');
  process.exit(1);
}

const slug = slugify(title);
const dir = path.join(__dirname, '../content/blog/posts', slug);
const file = path.join(dir, 'index.md');
if (fs.existsSync(dir) || fs.existsSync(`${dir}.md`) || fs.existsSync(`${dir}.json`)) {
  console.error(`A post with the slug "${slug}" already exists.`);
  process.exit(1);
}

// Local time with an explicit offset, e.g. 2026-05-11T14:30:00+08:00.
const now = new Date();
const pad = (value) => String(value).padStart(2, '0');
const offsetMinutes = -now.getTimezoneOffset();
const offset = `${offsetMinutes >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00${offset}`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, `---
title: ${JSON.stringify(title)}
date: ${JSON.stringify(date)}
draft: true
tags: []
categories: [${category}]
# summary: Optional. Defaults to the first paragraph.
# cover: shot.png    # Optional. Defaults to the first image in the post.
---

Start with a short intro: what this is, and what the reader will learn.

## Recon

\`\`\`bash
nmap -sC -sV 10.10.10.10
\`\`\`

> [!NOTE]
> Callouts: NOTE, TIP, IMPORTANT, WARNING, CAUTION.

::: spoiler Flag
Hide flags and solutions behind a spoiler.
:::

## Takeaways

What worked, what did not, and what to do differently next time.
`);

console.log(`Created ${path.relative(process.cwd(), file)}`);
console.log('Next: write it, then `npm run preview` to see it (drafts are shown locally).');
console.log('To publish: set `draft: false` (or remove it), commit, and push.');
