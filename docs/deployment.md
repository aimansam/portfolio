# Deployment

One repo builds **three sites**:

| Site | Address | Source | Hosted on |
|---|---|---|---|
| Link hub | `aimansam.my` | `card/` → `dist/card` | Cloudflare Pages |
| Portfolio | `portfolio.aimansam.my` | repo root | GitHub Pages (`CNAME`) |
| Blog (Pwn Diary) | `pwn.aimansam.my` | `content/blog/` → `dist/blog` | Cloudflare Pages |

The three addresses live in `content/site/sites.json`. `npm run build` produces all of them;
the host for each site just publishes its own folder.

## Portfolio: GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`:
`npm ci` → `npm run build` → `npm run check` → `npm run prerender` → publish.
The published folder leaves out `dist/`, `card/` and `blog-site/`. It still contains `blog/`,
which is only small redirect pages: `portfolio.aimansam.my/blog/...` sends visitors and search
engines to `pwn.aimansam.my/...` (GitHub Pages cannot do real 301s, so these use
`<meta refresh>` plus a canonical link).

## Blog and link hub: Cloudflare Pages (one-time setup)

Create two Pages projects from this same GitHub repo (Workers & Pages → Create → Pages → Connect to Git).

| | Blog | Link hub |
|---|---|---|
| Production branch | `main` | `main` |
| Build command | `npm ci && npm run build && npm run prerender` | `npm ci && npm run build` |
| Build output directory | `dist/blog` | `dist/card` |
| Environment variable | `NODE_VERSION` = `22` | `NODE_VERSION` = `22` |
| Custom domain | `pwn.aimansam.my` | `aimansam.my` (and `www.aimansam.my`) |

Because the DNS is on Cloudflare, adding the custom domain in the project creates the DNS record
and the HTTPS certificate for you. Then:

- **`www.aimansam.my`**: add it as a second custom domain on the link-hub project, or a Redirect Rule to `https://aimansam.my/`.
- **Old links**: the redirect pages above cover them. For real 301s, add a Redirect Rule on `portfolio.aimansam.my`: when the path starts with `/blog`, redirect to `https://pwn.aimansam.my/` + the rest of the path.
- **Headers and caching**: `dist/blog/_headers` and `dist/card/_headers` (sources: `blog-site/_headers`, `scripts/build-card.js`) are applied by Cloudflare Pages automatically.

### Scheduled posts

A post dated in the future is left out of the build, so the blog must rebuild when the date arrives.
The daily GitHub Actions run does this by calling Cloudflare deploy hooks:

1. In each Pages project: Settings → Builds → Deploy hooks → add one for `main`.
2. In GitHub: Settings → Secrets and variables → Actions → add `CF_BLOG_DEPLOY_HOOK` and `CF_CARD_DEPLOY_HOOK` with those URLs.

Without the secrets the step is skipped, and the blog only updates when you push.

### Search Console

Add `pwn.aimansam.my` and `aimansam.my` (or one Domain property for `aimansam.my`) and submit
`https://pwn.aimansam.my/sitemap.xml`. The portfolio's sitemap no longer lists blog posts.

## Headers on the portfolio

GitHub Pages cannot set custom response headers. If the domain is proxied through
Cloudflare, add them there (Rules → Transform Rules → Modify Response Header):

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000` (only once HTTPS is final) |

Optionally add a cache rule for `/assets/*` (for example 7 days). Assets are not
content-hashed, so avoid `immutable`.

## Docker / nginx (self-host)

```bash
docker compose up -d
# portfolio  http://localhost:5200
# blog       http://localhost:5201
# link hub   http://localhost:5202
```

The multi-stage `Dockerfile` runs the same build and prerender once, then has one nginx target per
site (`portfolio` is the default; `blog` and `card` are built with `--target`). The portfolio uses
`nginx.conf`, which also 301-redirects `/blog/...` to `pwn.aimansam.my`; the other two use
`nginx-static.conf`. All add the 404 page, gzip, the security headers above and a 7-day cache on assets.
