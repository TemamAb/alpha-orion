# Alpha-Orion Main Dockerfile
# Serves as entry point for Render deployment
# Supports both backend API and dashboard from same repository

ARG SERVICE=api
ARG NODE_VERSION=18

# Build stage for backend
FROM node:${NODE_VERSION}-alpine AS api-builder

WORKDIR /app

# Copy backend package files
COPY backend-services/services/user-api-service/package*.json ./backend-services/services/user-api-service/
COPY backend-services/services/user-api-service/package-lock.json* ./backend-services/services/user-api-service/

# Install backend dependencies
RUN cd backend-services/services/user-api-service && npm install --omit=dev

# Copy backend source
COPY backend-services/services/user-api-service/ ./backend-services/services/user-api-service/

# Copy strategies directory
COPY backend-services/services/user-api-service/src/strategies/ ./backend-services/services/user-api-service/src/strategies/

# Build stage for dashboard  
FROM node:${NODE_VERSION}-alpine AS dashboard-builder

WORKDIR /app

# Copy dashboard package files
COPY dashboard/package*.json ./dashboard/
COPY dashboard/package-lock.json* ./dashboard/

# Install dashboard dependencies
RUN cd dashboard && npm install --legacy-peer-deps

# Copy dashboard source
COPY dashboard/ ./dashboard/

# Build dashboard
RUN cd dashboard && npm run build

# Production stage - API
FROM node:${NODE_VERSION}-alpine AS production-api

WORKDIR /app

# Copy from api-builder
COPY --from=api-builder /app/backend-services/services/user-api-service/ ./

EXPOSE 8080

CMD ["npm", "start"]

# Production stage - Dashboard
FROM node:${NODE_VERSION}-alpine AS production-dashboard

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy from dashboard-builder
COPY --from=dashboard-builder /app/dashboard/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
