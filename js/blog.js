import { renderRoute, routeParts, setActiveNav } from './modules/blog-render.js';
import { initLightbox, initBackToTop } from './modules/ui.js';

const dataUrl = '/content/blog/posts.json';

// Adds a copy button to every code block.
const addCopyButtons = (root) => {
  root.querySelectorAll('.blog-post-content pre').forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code').innerText);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
    pre.appendChild(button);
  });
};

// Reading progress bar for posts: fills as the article scrolls past.
let progressHandler = null;
const initProgress = (root) => {
  if (progressHandler) window.removeEventListener('scroll', progressHandler);
  const bar = root.querySelector('.blog-progress span');
  const article = root.querySelector('.blog-post');
  if (!bar || !article) return;
  progressHandler = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    bar.style.transform = `scaleX(${done})`;
  };
  window.addEventListener('scroll', progressHandler, { passive: true });
  progressHandler();
};

const render = (posts) => {
  const app = document.getElementById('blog-app');
  app.innerHTML = renderRoute(posts, routeParts(window.location.pathname));
  setActiveNav(document, window.location.pathname);
  addCopyButtons(app);
  initProgress(app);
  if (window.location.hash) document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
};

initLightbox();
initBackToTop();

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load posts: ${response.status}`);
    return response.json();
  })
  .then((data) => render((data.posts || []).filter((post) => !post.draft).sort((a, b) => new Date(b.date) - new Date(a.date))))
  .catch((error) => {
    document.getElementById('blog-app').innerHTML = `<section class="blog-loading"><span class="blog-kicker">Error</span><h1>Blog could not load.</h1><p>${String(error.message).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</p></section>`;
  });
