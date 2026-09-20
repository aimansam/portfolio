# Portfolio

Personal portfolio homepage with a JSON-driven blog, served from nginx and backed by editable content files.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-100000?logo=github)](https://pages.github.com/)
[![nginx](https://img.shields.io/badge/nginx-009639?logo=nginx)](https://nginx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What It Is

A static portfolio site with a CMS-like blog engine — content lives in JSON files, the frontend renders from them, and nginx serves the whole thing. No database, no build step, no framework lock-in.

## Quickstart



## Structure

- **Static homepage** — portfolio content, about, projects.
- **JSON-driven blog** — write posts as JSON, rendered at request time.
- **nginx** — serves static assets + proxies the blog API.
- **CMS admin** — login with GitHub OAuth, edit content in the browser.

## Local Development



## Deployment

The repo is set up for GitHub Pages or any nginx host. See deploy/ for the nginx config and docker compose file.

## License

MIT — see [LICENSE](LICENSE).
