# Use official Nginx alpine image for a lightweight production container
FROM nginx:alpine

# Set working directory to Nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default Nginx static assets
RUN rm -rf ./*

# Copy the enterprise dashboard HTML file and rename to index.html
COPY enterprise-dashboard.html index.html

# Configure Nginx to listen on port 8080 (required for Cloud Run)
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]