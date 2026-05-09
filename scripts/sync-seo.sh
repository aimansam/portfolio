#!/bin/sh
set -eu

seo_file="${1:-content/site/seo.json}"
index_file="${2:-index.html}"

if [ ! -f "$seo_file" ]; then
  echo "SEO file not found: $seo_file" >&2
  exit 1
fi

if [ ! -f "$index_file" ]; then
  echo "Index file not found: $index_file" >&2
  exit 1
fi

escape_html() {
  jq -rn --arg value "$1" '$value | @html'
}

title="$(jq -r '.seo.title' "$seo_file")"
description="$(jq -r '.seo.description' "$seo_file")"
site_name="$(jq -r '.seo.siteName' "$seo_file")"
canonical_url="$(jq -r '.seo.canonicalUrl' "$seo_file")"
image_url="$(jq -r '.seo.image' "$seo_file")"
image_alt="$(jq -r '.seo.imageAlt' "$seo_file")"
person_name="$(jq -r '.seo.personName' "$seo_file")"
alternate_name="$(jq -r '.seo.alternateName // empty' "$seo_file")"
job_title="$(jq -r '.seo.jobTitle' "$seo_file")"
email="$(jq -r '.seo.email' "$seo_file")"
same_as_json="$(jq -c '.seo.sameAs // []' "$seo_file")"

title_html="$(escape_html "$title")"
description_html="$(escape_html "$description")"
site_name_html="$(escape_html "$site_name")"
canonical_url_html="$(escape_html "$canonical_url")"
image_url_html="$(escape_html "$image_url")"
image_alt_html="$(escape_html "$image_alt")"

structured_data="$(jq -n \
  --arg canonicalUrl "$canonical_url" \
  --arg personName "$person_name" \
  --arg alternateName "$alternate_name" \
  --arg image "$image_url" \
  --arg jobTitle "$job_title" \
  --arg description "$description" \
  --arg email "$email" \
  --arg siteName "$site_name" \
  --argjson sameAs "$same_as_json" \
  '{
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": ($canonicalUrl + "#aiman-sam"),
        "name": $personName,
        "alternateName": $alternateName,
        "url": $canonicalUrl,
        "image": $image,
        "jobTitle": $jobTitle,
        "description": $description,
        "email": $email,
        "sameAs": $sameAs
      },
      {
        "@type": "WebSite",
        "@id": ($canonicalUrl + "#website"),
        "url": $canonicalUrl,
        "name": $siteName,
        "description": $description,
        "publisher": {
          "@id": ($canonicalUrl + "#aiman-sam")
        }
      }
    ]
  }')"

seo_block_file="$(mktemp)"
output_file="$(mktemp)"
trap 'rm -f "$seo_block_file" "$output_file"' EXIT

cat > "$seo_block_file" <<EOF
    <title id="seo-title">$title_html</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" id="seo-description" content="$description_html" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Aiman Sam" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="canonical" id="seo-canonical" href="$canonical_url_html" />

    <meta property="og:type" content="website" />
    <meta property="og:title" id="seo-og-title" content="$title_html" />
    <meta property="og:description" id="seo-og-description" content="$description_html" />
    <meta property="og:url" id="seo-og-url" content="$canonical_url_html" />
    <meta property="og:site_name" id="seo-og-site-name" content="$site_name_html" />
    <meta property="og:image" id="seo-og-image" content="$image_url_html" />
    <meta property="og:image:alt" id="seo-og-image-alt" content="$image_alt_html" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" id="seo-twitter-title" content="$title_html" />
    <meta name="twitter:description" id="seo-twitter-description" content="$description_html" />
    <meta name="twitter:image" id="seo-twitter-image" content="$image_url_html" />
    <script type="application/ld+json" id="seo-structured-data">
$structured_data
    </script>
EOF

awk -v seo_block_file="$seo_block_file" '
  BEGIN {
    while ((getline line < seo_block_file) > 0) {
      block = block line ORS
    }
    close(seo_block_file)
  }
  /<!-- SEO:START -->/ {
    print
    printf "%s", block
    in_seo = 1
    next
  }
  /<!-- SEO:END -->/ {
    in_seo = 0
    print
    next
  }
  !in_seo { print }
' "$index_file" > "$output_file"

mv "$output_file" "$index_file"
chmod 644 "$index_file"