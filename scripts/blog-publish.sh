#!/bin/sh
set -eu

slug="${1:-}"

node scripts/build-blog.js

if [ -n "$slug" ] && [ ! -f "blog/posts/$slug/index.html" ]; then
  echo "Generated post not found: blog/posts/$slug/index.html" >&2
  exit 1
fi

echo "Built JSON blog${slug:+ post: $slug}"
echo
git status --short content/blog content/site/blog-preview.json blog
