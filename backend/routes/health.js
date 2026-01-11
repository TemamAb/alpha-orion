import express from 'express';
import logger from '../config/logger.js';

const router = express.Router();

// Store service start time
const startTime = Date.now();

// Health check endpoint
router.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    version: '4.2.0',
    services: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
      server: 'running',
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    },
    environment: process.env.NODE_ENV || 'development'
  };

  logger.info('Health check requested', { ip: req.ip });
  res.json(healthStatus);
});

// Readiness check endpoint (for Kubernetes/container orchestration)
router.get('/ready', (req, res) => {
  // Check if critical services are ready
  const isReady = process.env.GEMINI_API_KEY ? true : false;
  
  if (isReady) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Missing required configuration',
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check endpoint (for Kubernetes/container orchestration)
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
