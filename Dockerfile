FROM alpine:3.20 AS prepare

RUN apk add --no-cache jq

WORKDIR /workspace

COPY ./index.html ./index.html
COPY ./content ./content
COPY ./scripts ./scripts

RUN chmod +x ./scripts/sync-seo.sh && ./scripts/sync-seo.sh ./content/site/seo.json ./index.html

FROM nginx:alpine

# Copy only public portfolio assets into the nginx web root.
COPY ./CNAME /usr/share/nginx/html/CNAME
COPY --from=prepare /workspace/index.html /usr/share/nginx/html/index.html
COPY ./about.html /usr/share/nginx/html/about.html
COPY ./projects.html /usr/share/nginx/html/projects.html
COPY ./gallery.html /usr/share/nginx/html/gallery.html
COPY ./assets /usr/share/nginx/html/assets
COPY ./css /usr/share/nginx/html/css
COPY ./js /usr/share/nginx/html/js
COPY ./content /usr/share/nginx/html/content
COPY ./admin /usr/share/nginx/html/admin
COPY ./project-pages /usr/share/nginx/html/project-pages

# Copy the generated Hugo blog into a subfolder named 'blog'.
COPY ./blog-source/public /usr/share/nginx/html/blog/

EXPOSE 80