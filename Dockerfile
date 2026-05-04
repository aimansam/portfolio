# Use the lightweight Nginx image based on Alpine Linux
FROM nginx:alpine

# Copy all your portfolio files from your computer into the container's web directory
COPY . /usr/share/nginx/html

# Tell Docker that this container will listen on port 80 (the standard HTTP port)
EXPOSE 80

# Nginx starts automatically, so we don't need a CMD instruction