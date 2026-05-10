# zx10r Security Notes

Hugo source for the blog at `https://portfolio.aimansam.my/blog/`.

## Edit

- Site config: `config.toml`
- Pages: `content/*.md`
- Posts: `content/posts/*.md`
- Tags/categories metadata: `content/tags/**/_index.md` and `content/categories/**/_index.md`
- PaperMod overrides: `layouts/` and `assets/css/extended/custom.css`
- Static files: `static/`

## Build

Run from the repository root:

```sh
hugo --source blog-source --destination public --cleanDestinationDir
```

The generated files in `blog-source/public/` are committed because the Docker image copies that directory into `/blog/`.

## Local Preview

Run from the repository root:

```sh
docker compose up -d --build
```

Preview the blog at `http://localhost:5200/blog/`.

## Publish Checklist

1. Edit source files under `blog-source/`.
2. Rebuild Hugo.
3. Preview locally with Docker when layout or generated output changes.
4. Commit both source files and regenerated `blog-source/public/` output.
5. Push and wait for GitHub Pages to serve the new files.
