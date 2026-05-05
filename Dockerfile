FROM nginx:alpine

# Copy your main HTML portfolio to the root of the server
COPY . /usr/share/nginx/html/

# Copy your generated Hugo blog into a subfolder named 'blog'
COPY ./blog-source/public /usr/share/nginx/html/blog/

EXPOSE 80