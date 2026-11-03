# Deployment

The site ships two ways from the same build.

## GitHub Pages (live: portfolio.aimansam.my)

Pushing to `main` runs `.github/workflows/deploy.yml`:
`npm ci` → `npm run build` → `npm run check` → `npm run prerender` → publish.

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
docker compose up -d   # http://localhost:5200
```

The multi-stage `Dockerfile` runs the same build and prerender, then serves the
result with `nginx.conf`, which adds the 404 page, gzip, the security headers
above, and a 7-day cache on `/assets/`.
