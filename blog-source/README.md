# zx10r Security Notes

Hugo source for the blog at `https://portfolio.aimansam.my/blog/`.

## Edit

- Site config: `config.toml`
- Pages: `content/*.md`
- Posts: `content/posts/*.md`
- Writeup template: `archetypes/writeup.md`
- Tags/categories metadata: `content/tags/**/_index.md` and `content/categories/**/_index.md`
- PaperMod overrides: `layouts/` and `assets/css/extended/custom.css`
- Static files: `static/`

## New Writeup

Create a draft from the writeup template:

```sh
hugo --source blog-source new content -k writeup posts/<slug>/index.md
```

This creates a page bundle source file at `blog-source/content/posts/<slug>/index.md`. Put post images in the same folder and reference them with relative paths such as `![Alt text](<slug>-00.png)`.

## Build

Run from the repository root:

```sh
hugo --source blog-source --destination public --cleanDestinationDir
```

The generated files in `blog-source/public/` are committed because the Docker image copies that directory into `/blog/`.

You can also run the release helper from the repository root:

```sh
./scripts/blog-publish.sh posts/monster-corporate
```

The helper checks that the post exists, is not marked as a draft, rebuilds Hugo, verifies the generated page, and prints the files that changed.

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

## Notion Export Workflow

1. Export the Notion draft as Markdown with images.
2. Extract it outside the repo first, such as under `/tmp/`, and inspect the files before copying anything into the workspace.
3. Create a page bundle under `content/posts/<slug>/` with `index.md` and the post images.
4. Rename exported images to stable names such as `<slug>-00.png`, then update Markdown image references and alt text.
5. Add front matter with `draft: true` while editing.
6. Preview with drafts enabled:

```sh
hugo --source blog-source --destination public --cleanDestinationDir --buildDrafts
docker compose up -d --build
```

7. When ready to publish, set `draft: false` and run:

```sh
./scripts/blog-publish.sh posts/<slug>
```

8. Review `git diff --stat`, commit the source and generated output, push, then verify the live URL and RSS feed.
