#!/bin/sh
set -eu

post_path="${1:-}"

if [ -z "$post_path" ]; then
  echo "Usage: ./scripts/blog-publish.sh posts/<slug>" >&2
  exit 1
fi

case "$post_path" in
  posts/*) ;;
  *)
    echo "Post path must look like posts/<slug>" >&2
    exit 1
    ;;
esac

source_file="blog-source/content/$post_path/index.md"
public_file="blog-source/public/$post_path/index.html"

if [ ! -f "$source_file" ]; then
  echo "Source post not found: $source_file" >&2
  exit 1
fi

if grep -Eq '^draft:[[:space:]]*true' "$source_file"; then
  echo "Post is still marked draft: true in $source_file" >&2
  exit 1
fi

hugo --source blog-source --destination public --cleanDestinationDir

if [ ! -f "$public_file" ]; then
  echo "Generated post not found: $public_file" >&2
  exit 1
fi

title="$(grep -m 1 '^title:' "$source_file" | sed 's/^title:[[:space:]]*//; s/^"//; s/"$//')"

if [ -n "$title" ] && ! grep -Fq "$title" "$public_file"; then
  echo "Generated page does not contain expected title: $title" >&2
  exit 1
fi

echo "Built published post: $post_path"
echo
git status --short blog-source/content blog-source/public
echo
git diff --stat -- blog-source/content blog-source/public