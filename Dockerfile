# Base image optimized for Python
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies required for compilation (if any)
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application context
COPY . .

# Expose the API port defined in dashboard-api-enhanced.py
EXPOSE 8000

# Start the Enterprise Dashboard API
CMD ["python", "dashboard-api-enhanced.py"]