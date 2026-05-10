# Portfolio

Static portfolio homepage plus a Hugo blog, served from nginx and backed by editable content files for the homepage sections.

## Local Development

Run the site with Docker:

```bash
docker compose up -d --build
```

Open these routes locally:

- `/` for the portfolio homepage
- `/blog/` for the Hugo blog output
- `/admin/` for the Decap CMS editor

## Content Structure

Homepage content is split into JSON files under `content/site/`.

- `navigation.json`
- `hero.json`
- `stats.json`
- `about.json`
- `skills.json`
- `certificates.json`
- `projects.json`
- `blog-preview.json`
- `footer.json`

The homepage fetches those files client-side in `js/script.js` and renders them into `index.html`.

Blog posts live in [blog-source/content/posts](blog-source/content/posts) and are built by Hugo into [blog-source/public](blog-source/public). The quick blog workflow is documented in [blog-source/README.md](blog-source/README.md), and the full posting guide is in [docs/blog-posting-guide.md](docs/blog-posting-guide.md).

Project cards live in [content/site/projects.json](content/site/projects.json), with detail pages under [project-pages](project-pages). The full project workflow is documented in [docs/project-guide.md](docs/project-guide.md).

## CMS Editing

The repo includes Decap CMS at `/admin/` with schema in `admin/config.yml`.

Local editing flow:

1. Start the site with `docker compose up -d --build`.
2. Start the Decap local proxy from the repo root with `npx decap-server` or `npm run cms:proxy`.
3. Open `/admin/`.
4. Edit homepage JSON and blog posts against the local repository.

Local proxy notes:

- The default Decap proxy port is `8081`.
- If you need a different proxy port, set `PORT=8082 npx decap-server` and update `local_backend.url` in `admin/config.yml`.
- The admin page automatically disables `publish_mode` on `localhost` so local proxy editing does not conflict with `editorial_workflow`.

Production save flow:

1. Keep `backend.name: github` in `admin/config.yml`.
2. Deploy a Decap-compatible OAuth service and set `backend.base_url` plus `backend.auth_endpoint` in `admin/config.yml`.
3. Create a GitHub OAuth app for the deployed auth service.
4. Ensure the authenticated GitHub user has write access to `aimansam/portfolio`.

Without GitHub OAuth, the CMS UI can load but cannot complete browser-based saves in production.

This workspace does not currently include Node.js or npm, so the local proxy command must be run in an environment where those tools are installed.

## Deployment Notes

Production domain:

- Portfolio: `https://portfolio.aimansam.my/`
- Blog: `https://portfolio.aimansam.my/blog/`

GitHub Pages custom domain:

- The root [CNAME](/DATA/Storage/docker/portfolio/CNAME) file sets the Pages custom domain to `portfolio.aimansam.my`.
- The Hugo blog `baseURL` is set to `https://portfolio.aimansam.my/blog/` in [blog-source/config.toml](/DATA/Storage/docker/portfolio/blog-source/config.toml).
- In your DNS provider, point `portfolio.aimansam.my` to GitHub Pages using the record type your DNS host supports for subdomains.
- In the GitHub Pages repository settings, set the custom domain to `portfolio.aimansam.my` and enable HTTPS after DNS resolves.

The nginx image now copies only public site assets into the web root.

Served paths include:

- `index.html`
- `assets/`
- `css/`
- `js/`
- `content/`
- `admin/`
- `project-pages/`
- `blog/`

Repository-only files such as `docker-compose.yml` and `blog-source/config.toml` are intentionally not published by the container.

## Production CMS Auth

For production Decap editing on `https://portfolio.aimansam.my/admin/`, you need a server-side GitHub OAuth exchange. GitHub Pages cannot do that exchange by itself.

Recommended setup with Cloudflare:

1. Create a small OAuth service on Cloudflare Workers or Pages Functions.
2. Expose it on a subdomain such as `https://cms-auth.portfolio.aimansam.my`.
3. Configure the Decap backend with:

```yml
backend:
  name: github
  repo: aimansam/portfolio
  branch: main
  base_url: https://cms-auth.portfolio.aimansam.my
  auth_endpoint: auth
```

4. Create a GitHub OAuth App with:
	- Homepage URL: `https://portfolio.aimansam.my`
	- Authorization callback URL: `https://cms-auth.portfolio.aimansam.my/callback`
5. Store the GitHub client ID and client secret in Cloudflare Worker secrets.
6. Let the worker handle these routes:
	- `/auth`: redirect the CMS login popup to GitHub OAuth
	- `/callback`: exchange the GitHub code for an access token and post it back to the Decap popup opener

This repo now includes a starter worker in `cms-auth/`:

- `cms-auth/src/index.js`
- `cms-auth/wrangler.toml`
- `cms-auth/.dev.vars.example`

Suggested deployment flow:

1. Copy `cms-auth/.dev.vars.example` to `.dev.vars` for local worker testing.
2. Install Wrangler in an environment with Node.js available.
3. Run `npm run cms:auth:dev` to test locally.
4. Create the production Worker secrets with:
  - `npx wrangler secret put GITHUB_CLIENT_ID --config cms-auth/wrangler.toml`
  - `npx wrangler secret put GITHUB_CLIENT_SECRET --config cms-auth/wrangler.toml`
  - `npx wrangler secret put OAUTH_STATE_SECRET --config cms-auth/wrangler.toml`
5. Deploy with `npm run cms:auth:deploy`.
6. Bind `cms-auth.portfolio.aimansam.my` to the Worker route in Cloudflare.
7. Deploy the worker on `cms-auth.portfolio.aimansam.my`. The admin bootstrap injects `base_url` and `auth_endpoint` automatically in production.

Suggested Cloudflare secrets/config:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `ALLOWED_ORIGIN=https://portfolio.aimansam.my`

Suggested DNS:

- `cms-auth.portfolio` as a Cloudflare-managed subdomain for the worker route

GitHub token scope:

- Use `public_repo` if the repository stays public.
- Use `repo` only if the repository becomes private.

Validation checklist after deployment:

1. Open `https://portfolio.aimansam.my/admin/`.
2. Click `Login with GitHub`.
3. Confirm the popup uses your Cloudflare auth domain.
4. Confirm login returns to the CMS instead of stopping on the GitHub approval page.
5. Edit one JSON section or draft post and verify a commit or editorial entry appears in `aimansam/portfolio`.