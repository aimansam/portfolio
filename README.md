# Aiman Sam Portfolio

Live at **[portfolio.aimansam.my](https://portfolio.aimansam.my)** — a penetration tester and web developer portfolio with security writeups, offensive security labs, and a Decap CMS-powered blog.

[![Live Site](https://img.shields.io/badge/Live-portfolio.aimansam.my-0055CC?logo=world-wide-web)](https://portfolio.aimansam.my)
[![nginx](https://img.shields.io/badge/nginx-alpine-009639?logo=nginx)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-2499ED?logo=docker)](https://docker.com/)
[![Decap CMS](https://img.shields.io/badge/Decap-CMS-29b6e8?logo=decap)](https://decapcms.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What It Is

A deployable portfolio site for a junior penetration tester and web developer. The site showcases security writeups, lab case studies, certifications, and skills — all driven by JSON content files that you edit directly or through Decap CMS.

**Built for:** security professionals who want a portfolio that looks credible and is easy to maintain — edit a JSON file, run a build script, push, and the site updates.

**Not a template.** This is a real portfolio with real content (writeups, labs, certifications). Fork it, replace the content, and ship your own.

---

## Live Site

| Section | What's there |
|---------|-------------|
| **Home** | Hero, about, certifications, skills, stats, gallery |
| **Projects** | 9 security projects with case study descriptions |
| **Blog** | 4 technical writeups (CTF solves, lab notes, exploitation workflow) |
| **Gallery** | Image gallery |
| **Admin** | Decap CMS at `/admin` — edit content via GitHub OAuth |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  nginx:alpine                 │
│  index.html  about.html  projects.html       │
│  gallery.html  blog/  admin/  assets/        │
│  content/  project-pages/  css/  js/         │
└───────────────────┬─────────────────────────┘
                    │
          docker-compose.yml (port 5200→80)
                    │
          Dockerfile (multi-stage: prepare → nginx)
```

**Content-driven.** All site content lives in JSON files under `content/`. The build scripts compile blog posts from JSON into static HTML, update the blog preview, and inject SEO meta tags into `index.html`.

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
│   ├── skills.json          # Skills list
│   ├── stats.json           # Stats (TryHackMe, HTB, etc.)
│   └── blog-preview.json    # Generated: recent posts preview
├── blog/
│   └── posts/               # Blog post content (one JSON per post)
│       ├── monster-corporate.json
│       ├── my-first-ctf.json
│       ├── active-directory-lab-notes.json
│       └── web-exploitation-workflow.json
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
# 1. Create the post JSON in content/blog/posts/
# 2. Run the build
npm run build

# 3. Or use the publish script (builds + shows git status)
./scripts/blog-publish.sh <slug>
```

**Adding a project:** Add a JSON file to `content/projects/` and update `content/site/projects.json`.

---

## Build Pipeline

```bash
npm run build
# Runs in sequence:
#   1. node scripts/build-blog.js     — compile blog post JSON → HTML
#   2. node scripts/update-blog-preview.js — update blog-preview.json
#   3. node scripts/inject-seo.js    — inject SEO meta into index.html
```

The `Dockerfile` runs `sync-seo.sh` during the build stage to inject SEO before the nginx image is assembled.

---

## Deployment

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
├── Dockerfile              # Multi-stage: prepare → nginx:alpine
├── docker-compose.yml      # Port 5200 → 80
├── package.json            # Build scripts (npm run build)
├── .dockerignore
├── .gitignore
├── admin/
│   ├── index.html          # Decap CMS frontend
│   └── config.yml          # CMS config: collections, auth, repo
├── assets/
│   ├── images/             # Hero, certificates, gallery, uploads
│   ├── css/                # Stylesheets
│   └── js/                 # Client-side scripts
├── blog/
│   ├── index.html          # Blog listing
│   ├── posts/              # Generated: individual post pages
│   └── categories/         # Generated: category pages
├── content/                # ALL editable content (JSON)
├── project-pages/
│   └── project.html        # Project case study template
└── scripts/
    ├── build-blog.js       # JSON → HTML for blog posts
    ├── update-blog-preview.js  # Update blog-preview.json
    ├── inject-seo.js       # Inject SEO meta into index.html
    ├── sync-seo.sh         # Shell wrapper for SEO injection
    └── blog-publish.sh     # Convenience: build + git status
```

---

## Repo Metadata

- **Topics:** `portfolio`, `pentester`, `security-writeups`, `decap-cms`, `nginx`, `docker`, `static-site`
- **Description:** Junior Pentester & Web Developer Portfolio — security writeups, offensive security labs, and case studies.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built for [portfolio.aimansam.my](https://portfolio.aimansam.my).*

