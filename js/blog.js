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

// Light/dark theme. The initial value is set by an inline script in <head> to avoid a flash.
const themeToggle = document.querySelector('[data-theme-toggle]');
const syncThemeToggle = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle?.setAttribute('aria-pressed', String(dark));
  themeToggle?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
};
themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
  syncThemeToggle();
});
syncThemeToggle();

// Portfolio menu on small screens (same behaviour as the other pages).
const menuToggle = document.querySelector('.blog-menu-toggle');
const menu = document.getElementById('blog-menu');
const setMenu = (open) => {
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  menu?.classList.toggle('is-open', open);
};
menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.blog-menu-toggle, #blog-menu')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

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
