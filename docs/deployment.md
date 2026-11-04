# Deployment

One repo builds **three sites**:

| Site | Address | Source | Hosted on |
|---|---|---|---|
| Link hub | `aimansam.my` | `card/` → `dist/card` | Cloudflare (static assets) |
| Portfolio | `portfolio.aimansam.my` | repo root | GitHub Pages (`CNAME`) |
| Blog (Pwn Diary) | `pwn.aimansam.my` | `content/blog/` → `dist/blog` | Cloudflare (static assets) |

The three addresses live in `content/site/sites.json`. `npm run build` produces all of them;
the host for each site just publishes its own folder.

## Portfolio: GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`:
`npm ci` → `npm run build` → `npm run check` → `npm run prerender` → publish.
The published folder leaves out `dist/`, `card/` and `blog-site/`. It still contains `blog/`,
which is only small redirect pages: `portfolio.aimansam.my/blog/...` sends visitors and search
engines to `pwn.aimansam.my/...` (GitHub Pages cannot do real 301s, so these use
`<meta refresh>` plus a canonical link).

## Blog and link hub: Cloudflare Workers static assets (one-time setup)

Cloudflare's "Create an app" flow (Workers & Pages → Create application → Import a repository)
builds a Worker that serves a folder of static files. Each site has a config file in the repo root
that says which folder to serve (`wrangler.blog.jsonc`, `wrangler.card.jsonc`). Create two apps from
this same GitHub repo:

| | Blog | Link hub |
|---|---|---|
| Project name | `pwn-diary` | `aimansam-card` |
| Build command | `npm run build && npm run prerender` | `npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.blog.jsonc` | `npx wrangler deploy --config wrangler.card.jsonc` |
| Preview command | `npx wrangler versions upload --config wrangler.blog.jsonc` | `npx wrangler versions upload --config wrangler.card.jsonc` |
| Variable | `NODE_VERSION` = `22` | `NODE_VERSION` = `22` |
| Production branch | `main` | `main` |
| Custom domain | `pwn.aimansam.my` | `aimansam.my` (and `www.aimansam.my`) |

The project name must match `name` in its config file. Add the custom domain under the app's
Settings → Domains & Routes; because the DNS is on Cloudflare, the record and HTTPS certificate are created for you.
The production branch is under Settings → Builds → Branch control.

- **`www.aimansam.my`**: add it as a second custom domain on the link-hub app, or a Redirect Rule to `https://aimansam.my/`.
- **Old links**: the redirect pages above cover them. For real 301s, add a Redirect Rule on `portfolio.aimansam.my`: when the path starts with `/blog`, redirect to `https://pwn.aimansam.my/` + the rest of the path.
- **Headers and caching**: `dist/blog/_headers` and `dist/card/_headers` (sources: `blog-site/_headers`, `scripts/build-card.js`) are applied automatically, and `404-page` serves each site's own 404.html.

### Deploying from GitHub Actions (recommended)

Cloudflare's own Git integration can stop receiving pushes (it did during the first setup). The
`deploy-subdomains` job in `.github/workflows/deploy.yml` avoids that: on every push to `main`, on the
daily schedule and on manual runs it builds the site and runs `wrangler deploy` for both apps.
Scheduled posts go live through this daily run. To enable it:

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → use the **Edit Cloudflare Workers** template
   (limit it to your account) and copy the token.
2. Copy your Account ID (Workers & Pages → Overview, right-hand side).
3. GitHub repo → Settings → Secrets and variables → Actions → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. In both Cloudflare apps, Settings → Builds → turn on **Disable builds**, so the same site is not built twice.

Until the secrets exist the job is skipped and the apps only update when you rebuild them in the dashboard.

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

## Contact email and visitor analytics

Both are switched on with a single value, and stay inert until then.

### A custom email address (for example hello@aimansam.my)

1. Cloudflare dashboard → `aimansam.my` → Email → Email Routing → enable it and add the address `hello` as a
   custom address that forwards to your inbox. Confirm the verification email Cloudflare sends.
2. Send yourself a test message to the new address.
3. Run `node scripts/set-email.js hello@aimansam.my` (add `--dry-run` first to see which files change),
   then `npm run build`, commit and push. It replaces the address in the Hire Me button, hero, footer, home page
   contact panel, link hub, search data and 404 pages.
4. Update the email inside `assets/resume/Resume.pdf` by hand, since that is a separate file.

### Cloudflare Web Analytics (free, no cookies, no banner)

1. Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site. Do it once for each of
   `portfolio.aimansam.my`, `pwn.aimansam.my` and `aimansam.my`, choosing the manual (JavaScript snippet) option.
2. Copy the token from each snippet (the long value after `"token":`).
3. Paste them into `content/site/sites.json` under `analytics.cloudflareWebAnalytics` as `portfolio`, `blog` and `card`.
4. Commit and push. The build adds the beacon to every page of that site (home, project pages, blog posts). Leaving a token empty adds nothing for that site.
