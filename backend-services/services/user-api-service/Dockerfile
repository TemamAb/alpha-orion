# Stage 1: Builder
# We use a full Node image to build native dependencies (like tfjs-node)
FROM node:18-bullseye AS builder

WORKDIR /app

# Install build tools required for TensorFlow and other native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (including devDependencies for build steps)
RUN npm ci

# Copy source code
COPY . .

# Build the application (if you have a build script, e.g., for TypeScript)
# RUN npm run build

# Prune dev dependencies to keep the image small
RUN npm prune --production

# Stage 2: Production Runner
# Use a slim image for the final runtime to reduce attack surface and size
FROM node:18-bullseye-slim

WORKDIR /app

# Copy built node_modules and source from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]