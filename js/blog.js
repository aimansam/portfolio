import { renderRoute, routeParts, setActiveNav } from './modules/blog-render.js';

const dataUrl = '/content/blog/posts.json';

const render = (posts) => {
  const app = document.getElementById('blog-app');
  app.innerHTML = renderRoute(posts, routeParts(window.location.pathname));
  setActiveNav(document, window.location.pathname);
};

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load posts: ${response.status}`);
    return response.json();
  })
  .then((data) => render((data.posts || []).filter((post) => !post.draft).sort((a, b) => new Date(b.date) - new Date(a.date))))
  .catch((error) => {
    document.getElementById('blog-app').innerHTML = `<section class="blog-loading"><span class="blog-kicker">Error</span><h1>Blog could not load.</h1><p>${String(error.message).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</p></section>`;
  });
