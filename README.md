# Aiman Sam Portfolio

Live at **[portfolio.aimansam.my](https://portfolio.aimansam.my)**, with the blog at **[pwn.aimansam.my](https://pwn.aimansam.my)** and a link hub at **[aimansam.my](https://aimansam.my)** — a penetration tester and web developer portfolio with security writeups, offensive security labs, and a Decap CMS-powered blog.

[![Live Site](https://img.shields.io/badge/Live-portfolio.aimansam.my-0055CC?logo=world-wide-web)](https://portfolio.aimansam.my)
[![nginx](https://img.shields.io/badge/nginx-alpine-009639?logo=nginx)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-2499ED?logo=docker)](https://docker.com/)
[![Decap CMS](https://img.shields.io/badge/Decap-CMS-29b6e8?logo=decap)](https://decapcms.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What It Is

The source for three small sites that share one repo, one set of content and one look: a link hub, a portfolio and a blog. Everything is driven by JSON and Markdown files that you edit directly or through Decap CMS.

**Built for:** security professionals who want a portfolio that looks credible and is easy to maintain: edit a file, push, and the sites update.

**Not a template.** This is a real portfolio with real content (writeups, labs, certifications). Fork it, replace the content, and ship your own.

---

## Live Site

| Site | Address | What's there |
|------|---------|--------------|
| **Link hub** | [aimansam.my](https://aimansam.my) | One screen: photo, one line, links to the portfolio, the blog and every profile |
| **Portfolio** | [portfolio.aimansam.my](https://portfolio.aimansam.my) | Home (proof, featured research, selected projects, latest posts), About, Projects with case studies, Gallery with filters |
| **Blog (Pwn Diary)** | [pwn.aimansam.my](https://pwn.aimansam.my) | Research, CTF and Labs writeups in Markdown, with contents list, tags and archive |

Old `portfolio.aimansam.my/blog/...` addresses redirect to the blog.

---

## Architecture

```
content/ (JSON + Markdown)  ──►  npm run build  ──►  portfolio pages      ──► GitHub Pages
                                                 ├─►  dist/blog (blog)     ──► Cloudflare (Workers static assets)
                                                 └─►  dist/card (link hub) ──► Cloudflare (Workers static assets)
                                 npm run prerender  renders the JSON-driven pages to static HTML
```

- **One build, three outputs.** `npm run build` writes the portfolio pages in place, the blog to `dist/blog` and the link hub to `dist/card`. The three addresses live in `content/site/sites.json`.
- **Deploys.** Pushing to `main` runs `.github/workflows/deploy.yml`: the portfolio goes to GitHub Pages, and the blog and link hub are deployed to Cloudflare with `wrangler` (`wrangler.blog.jsonc`, `wrangler.card.jsonc`). A daily run also publishes posts scheduled for a future date.
- **Self-hosting.** The `Dockerfile` has one nginx target per site (`portfolio`, `blog`, `card`), and `docker-compose.yml` runs all three.
- **CMS.** Decap CMS runs at `/admin` on the portfolio, authenticates via GitHub OAuth through a Cloudflare Workers proxy (`cms-auth-portfolio.aimansam.my`), and writes back to `main`. Open a new post on `pwn.aimansam.my/posts/<slug>/` once it deploys, since the CMS preview link can only point at the portfolio.

Full setup steps (Cloudflare apps, secrets, email, analytics) are in [docs/deployment.md](docs/deployment.md).

---

## Quickstart

```bash
# Clone
git clone https://github.com/aimansam/portfolio.git
cd portfolio

# Build and run
docker compose up -d

# Visit
http://localhost:5200

# Admin CMS (when deployed with auth proxy)
http://localhost:5200/admin
```

---

## Content Model

All site content is JSON. Edit the files directly or use Decap CMS.

```
content/
├── site/                    # Site-wide config
│   ├── about.json           # About section text
│   ├── certificates.json    # Certifications list
│   ├── footer.json          # Footer content
│   ├── gallery.json         # Gallery images
│   ├── hero.json            # Hero section
│   ├── index.json           # Homepage layout
│   ├── navigation.json      # Navigation links
│   ├── projects.json        # Projects section config
│   ├── seo.json             # SEO meta tags (title, description, OG)
│   ├── site.json            # Site tag (page-title suffix) and analytics ID
│   ├── skills.json          # Skills list
│   ├── stats.json           # Stats (TryHackMe, HTB, etc.)
├── blog/
│   └── posts/               # One folder per post: <slug>/index.md + its images
│       ├── monster-corporate/
│       ├── my-first-ctf/
│       ├── active-directory-lab-notes/
│       └── web-exploitation-workflow/
└── projects/                # Project case studies (one JSON per project)
    ├── enterprise-homelab.json
    ├── bad-usb-lab.json
    ├── divide-ctf-recipe.json
    ├── oxblood-drill.json
    ├── web-vuln-scanner.json
    ├── baby-c2.json
    ├── security-tooling.json
    └── wifi-audit-lab.json
```

**Adding a blog post:**

```bash
npm run new-post -- "My Post Title" --category CTF   # scaffolds a draft
npm run preview                                           # http://localhost:4000/ (shows drafts)
# set draft: false, commit, push: CI builds and deploys
```

Posts are Markdown with a short header; summary, cover, URLs and social tags are generated. See [docs/blog-posting-guide.md](docs/blog-posting-guide.md) for the header fields, callouts, spoilers and scheduling.

**Adding a project:** Add a JSON file to `content/projects/` and add a card for it in `content/site/projects.json` (link it to `./projects/<id>/`). The page itself is generated by the build.

---

## Build Pipeline

```bash
npm run build
# Runs in sequence:
#   1. node scripts/build-blog.js          — build the blog site into dist/blog (+ redirect pages in blog/)
#   2. node scripts/update-blog-preview.js — update blog-preview.json
#   3. node scripts/build-projects.js      — write projects/<id>/index.html per project
#   4. node scripts/inject-seo.js          — inject SEO meta + JSON-LD into index.html
#   5. node scripts/build-sitemap.js       — write sitemap.xml (portfolio) and dist/blog/sitemap.xml
#   6. node scripts/build-card.js          — build the aimansam.my link hub into dist/card
#
npm run check      # static integrity check: JSON, asset references, generated routes
```

`npm run prerender` (used by the Dockerfile and CI, **not** part of `build`) renders the JSON-driven pages, project pages (`/projects/<id>/`) and every blog page into static HTML with jsdom, with per-page titles, canonical and social meta. It rewrites those files in place, so don't run it on your working copy.

`dist/`, `blog/` (redirect pages), `projects/`, `sitemap.xml`, `content/blog/posts.json` and `content/site/blog-preview.json` are generated and git-ignored; never edit them by hand.

The `Dockerfile` runs `npm run build` in a Node build stage, then copies the output into nginx. GitHub Actions runs the same command before publishing to Pages, so there is a single build path.

---

## Motion

Animations share one set of timings and easings (`--ease-out`, `--dur-*`, `--stagger` in `css/utilities.css`) and are subtle by design: transform and opacity only, nothing loops, and everything is off for `prefers-reduced-motion`.

- **Scroll reveal, count-up, FLIP filtering, TOC highlight, spoilers:** `js/modules/motion.js`. Elements already on screen are never hidden, and content is visible without JS.
- **Page transitions:** `@view-transition` in `utilities.css` (Chrome, Edge, Safari; other browsers change page instantly). The nav and brand stay still.
- **Loader:** shown on a visitor's first page of a session only (`sessionStorage`, read in each page's `<head>`).
- **Adding a reveal:** add a selector to `REVEAL_GROUPS` in `js/main.js` (portfolio) or `enhance()` in `js/blog.js` (blog).

## Deployment

See [docs/deployment.md](docs/deployment.md) for the three-site setup, the GitHub secrets, the custom email address and Cloudflare Web Analytics.

**Docker:**

```bash
docker compose up -d
# portfolio  http://localhost:5200
# blog       http://localhost:5201
# link hub   http://localhost:5202
```

---

## Local Development

```bash
# Edit content JSON files in content/
# Rebuild after changes
npm run build

# Or just rebuild blog posts
node scripts/build-blog.js

# View the site
docker compose up -d
# → http://localhost:5200
```

---

## Project Structure

```
portfolio/
├── index.html, about.html, projects.html, gallery.html, 404.html   # Portfolio pages
├── project-pages/project.html  # Case-study template (copied to projects/<id>/)
├── card/                       # Link hub source (aimansam.my)
├── blog-site/                  # Blog extras: 404, robots, headers, redirects
├── content/
│   ├── site/                   # Portfolio, navigation, SEO, sites.json (the three addresses)
│   ├── projects/               # One JSON per case study
│   └── blog/posts/<slug>/      # index.md + images for each post
├── css/
│   ├── layout/                 # Page styles, loaded in order
│   ├── typography.css, utilities.css
│   ├── flat.css                # The flat look, header, home sections (portfolio)
│   └── blog.css                # Blog styles
├── js/
│   ├── main.js, blog.js        # Portfolio and blog entry points
│   └── modules/                # utils, markup, apply, content, ui, motion, markdown, blog-render
├── assets/                     # Icons, images (WebP, SVG diagrams), resume
├── admin/                      # Decap CMS
├── scripts/
│   ├── build-blog.js           # Blog site (dist/blog) and redirect pages
│   ├── build-card.js           # Link hub (dist/card)
│   ├── build-projects.js, build-sitemap.js, inject-seo.js, update-blog-preview.js
│   ├── prerender.js, check-site.js, preview.js, new-post.js
│   ├── set-email.js            # Switch the contact email everywhere
│   ├── covers/make_covers.py   # One-off: project cover cards
│   └── lib/                    # posts, sites, analytics helpers
├── wrangler.blog.jsonc, wrangler.card.jsonc   # Cloudflare deploy config
├── Dockerfile, docker-compose.yml, nginx.conf, nginx-static.conf
└── .github/workflows/deploy.yml
```

---

## Repo Metadata

- **Topics:** `portfolio`, `pentester`, `security-writeups`, `decap-cms`, `nginx`, `docker`, `static-site`
- **Description:** Penetration Tester & Red Team Portfolio — security writeups, offensive security labs, and case studies.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built for [portfolio.aimansam.my](https://portfolio.aimansam.my).*

