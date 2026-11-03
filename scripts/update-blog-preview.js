const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, '../content/blog/posts.json');
const PREVIEW_FILE = path.join(__dirname, '../content/site/blog-preview.json');

// Use the calendar date as written in the post so the build timezone cannot shift it.
function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
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
