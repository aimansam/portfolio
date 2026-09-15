const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, '../content/blog/posts.json');
const PREVIEW_FILE = path.join(__dirname, '../content/site/blog-preview.json');

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getPosts() {
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  return data.posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

const posts = getPosts();
const previewItems = posts.slice(0, 3).map((post, index) => ({
  title: post.title,
  description: post.summary,
  date: formatDate(post.date),
  tags: (post.tags || []).slice(0, 2),
  url: `./blog/posts/${post.slug}/`,
  accent: index === 0
}));

fs.writeFileSync(PREVIEW_FILE, `${JSON.stringify({
  blogPreview: {
    heading: 'Writeups / Blog',
    intro: 'Technical writeups covering CTF solves, lab work, exploitation paths, and security lessons pulled from hands-on practice.',
    viewAllHref: './blog/',
    viewAllLabel: 'View all posts',
    items: previewItems
  }
}, null, 2)}\n`);

console.log(`Updated ${PREVIEW_FILE} from ${POSTS_FILE}.`);
