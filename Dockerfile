FROM node:22-alpine AS build

WORKDIR /workspace

COPY ./package.json ./package.json
COPY ./scripts ./scripts
COPY ./content ./content
COPY ./blog ./blog
COPY ./index.html ./index.html

# Generates blog pages, the blog preview, homepage SEO, and sitemap.xml.
RUN npm run build

FROM nginx:alpine

# Copy only public portfolio assets into the nginx web root.
COPY ./CNAME /usr/share/nginx/html/CNAME
COPY ./robots.txt /usr/share/nginx/html/robots.txt
COPY --from=build /workspace/index.html /usr/share/nginx/html/index.html
COPY --from=build /workspace/sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY --from=build /workspace/blog /usr/share/nginx/html/blog
COPY --from=build /workspace/content /usr/share/nginx/html/content
COPY ./about.html /usr/share/nginx/html/about.html
COPY ./projects.html /usr/share/nginx/html/projects.html
COPY ./gallery.html /usr/share/nginx/html/gallery.html
COPY ./assets /usr/share/nginx/html/assets
COPY ./css /usr/share/nginx/html/css
COPY ./js /usr/share/nginx/html/js
COPY ./admin /usr/share/nginx/html/admin
COPY ./project-pages /usr/share/nginx/html/project-pages

EXPOSE 80
