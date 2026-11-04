import { renderRoute, routeParts, setActiveNav } from './modules/blog-render.js';
import { initLightbox, initBackToTop } from './modules/ui.js';
import { initReveal, initTocSpy, animateDetails, prefersReducedMotion } from './modules/motion.js';

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
        button.classList.add('is-copied');
      } catch {
        button.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('is-copied');
      }, 1800);
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

// Everything a rendered page needs on top of its markup. Used both after a client-side render
// and on pages that were prerendered at build time.
const enhance = (app) => {
  setActiveNav(document, window.location.pathname);
  addCopyButtons(app);
  initProgress(app);
  initTocSpy(app.querySelector('.blog-toc'));
  app.querySelectorAll('.spoiler').forEach((details) => animateDetails(details, '.spoiler-body'));
  initReveal([
    { selector: '.blog-row' },
    { selector: '.blog-archive-year' },
    { selector: '.blog-post-nav-link' },
    { selector: '.blog-related h2', variant: 'fade' }
  ]);
  if (window.location.hash) document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
};

const render = (posts) => {
  const app = document.getElementById('blog-app');
  app.innerHTML = renderRoute(posts, routeParts(window.location.pathname));
  enhance(app);
};

// Light/dark theme. The initial value is set by an inline script in <head> to avoid a flash.
const themeToggle = document.querySelector('[data-theme-toggle]');
const syncThemeToggle = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle?.setAttribute('aria-pressed', String(dark));
  themeToggle?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
};
themeToggle?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
    syncThemeToggle();
  };
  if (!prefersReducedMotion()) {
    themeToggle.classList.add('is-spinning');
    themeToggle.addEventListener('animationend', () => themeToggle.classList.remove('is-spinning'), { once: true });
  }
  // Crossfade the whole page where the browser supports view transitions.
  if (document.startViewTransition && !prefersReducedMotion()) {
    root.classList.add('theme-switching');
    document.startViewTransition(apply).finished.finally(() => root.classList.remove('theme-switching'));
  } else {
    apply();
  }
});
syncThemeToggle();

// Fade a background in behind the fixed header once the page scrolls, so text never collides with it.
const header = document.querySelector('.blog-header');
const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

initLightbox();
initBackToTop();

const app = document.getElementById('blog-app');
if (app.hasAttribute('data-prerendered')) {
  // The server already sent the finished page, so there is nothing to fetch or re-render.
  enhance(app);
} else {
  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load posts: ${response.status}`);
      return response.json();
    })
    .then((data) => render((data.posts || []).filter((post) => !post.draft).sort((a, b) => new Date(b.date) - new Date(a.date))))
    .catch((error) => {
      app.innerHTML = `<section class="blog-loading"><span class="blog-kicker">Error</span><h1>Blog could not load.</h1><p>${String(error.message).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</p></section>`;
    });
}
