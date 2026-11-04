FROM node:22-alpine AS build

WORKDIR /workspace

COPY ./package.json ./package-lock.json ./
RUN npm ci

COPY ./scripts ./scripts
COPY ./content ./content
COPY ./js ./js
COPY ./css ./css
COPY ./assets ./assets
COPY ./blog-site ./blog-site
COPY ./card ./card
COPY ./project-pages ./project-pages
COPY ./index.html ./about.html ./projects.html ./gallery.html ./

# Generates all three sites (portfolio, blog in dist/blog, link hub in dist/card), the
# homepage SEO and sitemaps, then prerenders the JSON-driven pages into static HTML.
ENV FETCH_BADGES=1
RUN npm run build && npm run prerender

# Blog (pwn.aimansam.my):  docker build --target blog .
FROM nginx:alpine AS blog
COPY ./nginx-static.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/blog /usr/share/nginx/html
EXPOSE 80

# Link hub (aimansam.my):  docker build --target card .
FROM nginx:alpine AS card
COPY ./nginx-static.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/card /usr/share/nginx/html
EXPOSE 80

# Portfolio (portfolio.aimansam.my): the default target.
FROM nginx:alpine AS portfolio

# Copy only public portfolio assets into the nginx web root.
COPY ./CNAME /usr/share/nginx/html/CNAME
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./robots.txt /usr/share/nginx/html/robots.txt
COPY ./404.html /usr/share/nginx/html/404.html
COPY --from=build /workspace/index.html /usr/share/nginx/html/index.html
COPY --from=build /workspace/sitemap.xml /usr/share/nginx/html/sitemap.xml
# /blog/ holds redirect pages that send old links to the blog subdomain.
COPY --from=build /workspace/blog /usr/share/nginx/html/blog
COPY --from=build /workspace/projects /usr/share/nginx/html/projects
COPY --from=build /workspace/content /usr/share/nginx/html/content
COPY --from=build /workspace/about.html /usr/share/nginx/html/about.html
COPY --from=build /workspace/projects.html /usr/share/nginx/html/projects.html
COPY --from=build /workspace/gallery.html /usr/share/nginx/html/gallery.html
COPY ./assets /usr/share/nginx/html/assets
# Badges refreshed during the build override the committed snapshot.
COPY --from=build /workspace/assets/images/badges /usr/share/nginx/html/assets/images/badges
COPY ./css /usr/share/nginx/html/css
COPY --from=build /workspace/css/site.css /usr/share/nginx/html/css/site.css
COPY ./js /usr/share/nginx/html/js
COPY ./admin /usr/share/nginx/html/admin
COPY ./project-pages /usr/share/nginx/html/project-pages

EXPOSE 80
