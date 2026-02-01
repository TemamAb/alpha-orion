# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy all files from current directory
COPY . .

# Install dependencies (requests is commonly used in helper scripts)
RUN pip install --no-cache-dir requests

# Expose port 8080 and set environment variable
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
EXPOSE 8080

# Run the dashboard script
CMD [ "python", "serve-live-dashboard.py" ]