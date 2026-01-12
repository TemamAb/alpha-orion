import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import middleware
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { validateRequestSize } from './middleware/validator.js';

// Import routes
import geminiRoutes from './routes/gemini.js';
import healthRoutes from './routes/health.js';

// Import logger
import logger from './config/logger.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - DISABLED CSP TO PREVENT BLACK SCREEN
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production monorepo, origin might vary or be internal
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from the frontend build - PRE-MIDDLEWARE
const distPath = join(__dirname, '../dist');
if (existsSync(distPath)) {
  // Serve assets specifically with robust static options
  app.use('/assets', express.static(join(distPath, 'assets'), {
    maxAge: '1d',
    fallthrough: false // If asset not found, 404 immediately, don't fall through to API/Index
  }));
  // Serve the rest of dist
  app.use(express.static(distPath));
  logger.info(`Serving static files from: ${distPath}`);
}

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Request size validation
app.use(validateRequestSize);

// Rate limiting for all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/', healthRoutes);
app.use('/api', geminiRoutes);

// Root/Landing redirect for API info (only if not serving frontend)
app.get('/api-info', (req, res) => {
  res.json({
    name: 'ArbiNexus Enterprise Backend API',
    version: '4.2.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      ready: '/ready',
      live: '/live',
      forgeAlpha: 'POST /api/forge-alpha'
    },
    documentation: 'https://github.com/TemamAb/alpha-orion'
  });
});

// Catch-all to serve index.html for React Router
// This must be AFTER API routes to ensure API 404s are handled correctly
if (existsSync(distPath)) {
  app.get('*', (req, res) => {
    // Don't serve index.html for API requests that missed the routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API Route not found' });
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 ArbiNexus Backend Server started`);
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✅ Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
