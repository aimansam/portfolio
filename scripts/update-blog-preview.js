const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../blog-source/content/posts');
const PREVIEW_FILE = path.join(__dirname, '../content/site/blog-preview.json');

function parseFrontMatter(content) {
  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return null;
  
  const yamlText = match[1];
  // Simple YAML parser for the specific fields we need since js-yaml might not be installed
  const data = {};
  const lines = yamlText.split('\n');
  
  lines.forEach(line => {
    const [key, ...valParts] = line.split(':');
    if (key && valParts.length) {
      let value = valParts.join(':').trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Handle arrays [ "a", "b" ]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      }
      data[key.trim()] = value;
    }
  });
  
  return data;
}

function getPosts() {
  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const posts = [];

  entries.forEach(entry => {
    if (entry.name === '_index.md') return;

    let filePath;
    let title, date, summary, tags, categories;

    if (entry.isDirectory()) {
      filePath = path.join(POSTS_DIR, entry.name, 'index.md');
    } else if (entry.name.endsWith('.md')) {
      filePath = path.join(POSTS_DIR, entry.name);
    } else {
      return;
    }

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fm = parseFrontMatter(content);
      if (fm && fm.draft !== 'true') {
        const slug = entry.isDirectory() ? entry.name : entry.name.replace('.md', '');
        posts.push({
          title: fm.title,
          date: fm.date,
          summary: fm.summary,
          tags: fm.tags || [],
          categories: fm.categories || [],
          slug: slug,
          href: `./blog/posts/${slug}/`
        });
      }
    }
  });

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

function updatePreview() {
  console.log('Updating blog previews...');
  const posts = getPosts();
  
  // We only want a few for the preview grid (e.g., top 3)
  const previewItems = posts.slice(0, 3).map((post, index) => ({
    title: post.title,
    description: post.summary,
    date: new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    tags: Array.isArray(post.tags) ? post.tags.slice(0, 2) : [],
    url: post.href,
    accent: index === 0 // First post is accent
  }));

  const result = {
    blogPreview: {
      heading: "Writeups / Blog",
      intro: "Technical writeups covering CTF solves, lab work, exploitation paths, and security lessons pulled from hands-on practice.",
      viewAllHref: "./blog/index.html",
      viewAllLabel: "View all posts",
      items: previewItems
    }
  };

  fs.writeFileSync(PREVIEW_FILE, JSON.stringify(result, null, 2));
  console.log(`Successfully updated ${PREVIEW_FILE} with ${previewItems.length} posts.`);
}

updatePreview();