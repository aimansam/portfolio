# Aiman Sam Portfolio

Live at **[portfolio.aimansam.my](https://portfolio.aimansam.my)**, with the blog at **[pwn.aimansam.my](https://pwn.aimansam.my)** and a link hub at **[aimansam.my](https://aimansam.my)** — a penetration tester and web developer portfolio with security writeups, offensive security labs, and a Decap CMS-powered blog.

[![Live Site](https://img.shields.io/badge/Live-portfolio.aimansam.my-0055CC?logo=world-wide-web)](https://portfolio.aimansam.my)
[![nginx](https://img.shields.io/badge/nginx-alpine-009639?logo=nginx)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-2499ED?logo=docker)](https://docker.com/)
[![Decap CMS](https://img.shields.io/badge/Decap-CMS-29b6e8?logo=decap)](https://decapcms.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What It Is

A deployable portfolio site for a penetration tester focused on red team work. The site showcases security writeups, lab case studies, certifications, and skills — all driven by JSON content files that you edit directly or through Decap CMS.

**Built for:** security professionals who want a portfolio that looks credible and is easy to maintain — edit a JSON file, run a build script, push, and the site updates.

**Not a template.** This is a real portfolio with real content (writeups, labs, certifications). Fork it, replace the content, and ship your own.

---

## Live Site

| Section | What's there |
|---------|-------------|
| **Home** | Hero, about, certifications, skills, stats, gallery |
| **Projects** | 6 featured security projects with case study pages (8 case studies in `content/projects/`) |
| **Blog** | 4 technical writeups (CTF solves, lab notes, exploitation workflow) |
| **Gallery** | Image gallery |
| **Admin** | Decap CMS at `/admin` — edit content via GitHub OAuth |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  nginx:alpine                 │
│  index.html  about.html  projects.html       │
│  gallery.html  blog/ (redirects)  admin/     │
│  assets/                                     │
│  content/  project-pages/  css/  js/         │
│  sitemap.xml  robots.txt (generated/static)  │
└───────────────────┬─────────────────────────┘
                    │
          docker-compose.yml (port 5200→80)
                    │
          Dockerfile (multi-stage: node build → nginx)
```

**Content-driven.** All site content lives in JSON files under `content/`. The build scripts compile blog posts from JSON into static HTML, update the blog preview, inject SEO meta tags into `index.html`, and generate `sitemap.xml`.

**CMS.** Decap CMS runs at `/admin`, authenticates via GitHub OAuth through a Cloudflare Workers proxy (`cms-auth-portfolio.aimansam.my`), and writes back to the `main` branch.

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

See [docs/deployment.md](docs/deployment.md) for the GitHub Pages and self-host details, including recommended response headers.

**Docker:**

```bash
docker compose up -d
```

The `docker-compose.yml` exposes port 5200 → container port 80. The `CNAME` file sets `portfolio.aimansam.my`.

**Manual nginx:** Copy the built files to any nginx web root. The `Dockerfile` shows exactly what gets copied.

**CMS auth:** The Decap CMS backend requires a Cloudflare Workers auth proxy at `https://cms-auth-portfolio.aimansam.my`. Without it, `/admin` will not authenticate. See `admin/config.yml` for the endpoint configuration.

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
├── index.html              # Homepage (SEO-injected)
├── about.html              # About page
├── projects.html           # Projects listing
├── gallery.html            # Gallery page
├── CNAME                   # Custom domain
├── Dockerfile              # Multi-stage: node build → nginx:alpine
├── docker-compose.yml      # Port 5200 → 80
├── package.json            # Build scripts (npm run build)
├── .dockerignore
├── .gitignore
├── admin/
│   ├── index.html          # Decap CMS frontend
│   └── config.yml          # CMS config: collections, auth, repo
├── assets/
│   ├── icons/              # SVG/PNG icons
│   ├── images/             # Hero, certificates, gallery, projects (WebP)
│   └── resume/             # Resume.pdf
├── css/
│   ├── layout/             # Page styles, loaded in order (base → about-story)
│   ├── typography.css
│   ├── utilities.css
│   └── blog.css
├── js/
│   ├── main.js             # Entry point: fetch JSON, render, start UI
│   ├── blog.js             # Blog client
│   └── modules/            # utils, markup, apply (render), content (loader), ui, blog-render
├── blog/
│   ├── index.html          # Blog listing
│   ├── posts/              # Generated post shells (+ committed post images)
│   └── categories/ tags/   # Generated shells
├── content/                # ALL editable content (JSON)
├── project-pages/
│   └── project.html        # Project case study template (copied to projects/<id>/)
└── scripts/
    ├── build-blog.js       # Builds the blog site (dist/blog) and redirect pages
    ├── build-card.js       # Builds the aimansam.my link hub (dist/card)
    ├── update-blog-preview.js  # Update blog-preview.json
    ├── inject-seo.js       # Inject SEO meta into index.html
    ├── build-sitemap.js    # Generate sitemap.xml
    ├── build-projects.js   # Generate projects/<id>/index.html
    ├── check-site.js       # CI integrity check
    ├── prerender.js        # Build-time prerender (pages, projects, blog)
    ├── new-post.js         # Scaffold a draft post
    ├── preview.js          # Local blog preview with drafts and live rebuild
    └── lib/posts.js        # Post loader (Markdown/JSON, defaults, drafts, scheduling)
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

