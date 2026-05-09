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

Blog posts live in `blog-source/content/posts/` and are built by Hugo into `blog-source/public/`.

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
2. Configure a Decap-compatible GitHub OAuth flow for the deployed site.
3. Set the OAuth app callback URL to your deployed `/admin/` path.
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