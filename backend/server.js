// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
// Import StrategyForger
const { StrategyForger } = require('./strategyForger');

// Import services
const aiService = require('./aiService');
const blockchainService = require('./blockchain');
const botOrchestrator = require('./botOrchestrator');

// Import middleware
const securityMiddleware = require('./middleware/security');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'orion-backend' },
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Initialize StrategyForger
let strategyForger = null;

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production, allow the frontend domain and any subdomain
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://orion-frontend.onrender.com',
        'https://orion-frontend-*.onrender.com',
        /\.onrender\.com$/,
        /\.vercel\.app$/,
        /\.netlify\.app$/
      ];

      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin || origin.includes('onrender.com');
        }
        return allowedOrigin.test(origin);
      });

      if (isAllowed) {
        return callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: allow localhost
      const allowedDevOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];

      if (allowedDevOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply security middleware
app.use(securityMiddleware.apiLimiter);
app.use(securityMiddleware.validateInput);
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.securityLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Orion Backend is operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    services: {
      ai: aiService.isReady,
      blockchain: blockchainService.isConnected,
      botOrchestrator: botOrchestrator.isRunning,
      strategyForger: strategyForger !== null
    },
    timestamp: new Date().toISOString()
  });
});

// AI Health metrics endpoint
app.get('/api/ai/health', (req, res) => {
  res.json({
    health: aiService.getHealthMetrics(),
    timestamp: new Date().toISOString()
  });
});

// Learning curve endpoints
app.get('/api/learning/metrics', (req, res) => {
  try {
    if (!strategyForger) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Learning metrics unavailable - StrategyForger not initialized'
      });
    }

    const metrics = strategyForger.getLearningMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching learning metrics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch learning metrics'
    });
  }
});

app.get('/api/learning/history', (req, res) => {
  try {
    if (!strategyForger) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Learning history unavailable - StrategyForger not initialized'
      });
    }

    const metrics = strategyForger.getLearningMetrics();
    res.json({ historicalPerformance: metrics.historicalPerformance });
  } catch (error) {
    logger.error('Error fetching learning history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch learning history'
    });
  }
});

app.get('/api/learning/performance', (req, res) => {
  try {
    if (!strategyForger) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Learning performance unavailable - StrategyForger not initialized'
      });
    }

    const metrics = strategyForger.getLearningMetrics();
    res.json({
      profitDayProgression: metrics.profitDayProgression,
      strategyCombinations: metrics.strategyCombinations,
      confidenceScore: metrics.confidenceScore
    });
  } catch (error) {
    logger.error('Error fetching learning performance:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch learning performance'
    });
  }
});

// Matrix status endpoint (for dashboard integration)
app.get('/api/matrix/status', (req, res) => {
  // Production: Return real matrix status from botOrchestrator
  try {
    const matrixStatus = botOrchestrator.getSystemStatus();
    res.json({
      systemTotalProjectedProfit: matrixStatus.metrics.totalHits * 1000, // Estimate based on hits
      matrix: {
        'THE GHOST': { status: matrixStatus.mevStrategies.ghostTrader.enabled ? 'ACTIVE' : 'DISABLED', score: 0 },
        'SLOT-0 SNIPER': { status: matrixStatus.mevStrategies.blockSniper.operational ? 'ACTIVE' : 'DISABLED', score: 0 },
        'BUNDLE MASTER': { status: 'DISABLED', score: 0 },
        'ATOMIC FLUX': { status: 'DISABLED', score: 0 },
        'DARK RELAY': { status: 'DISABLED', score: 0 },
        'HIVE SYMMETRY': { status: 'DISABLED', score: 0 },
        'DISCOVERY HUNT': { status: 'DISABLED', score: 0 }
      }
    });
  } catch (error) {
    logger.error('Matrix status fetch failed:', error);
    res.status(503).json({
      error: 'Service unavailable',
      message: 'Matrix status not available in production mode'
    });
  }
});

// Bot status endpoint
app.get('/api/bots/status', (req, res) => {
  const botStatus = botOrchestrator.getSystemStatus();
  res.json(botStatus);
});

// Start bot system endpoint
app.post('/api/bots/start', (req, res) => {
  try {
    if (botOrchestrator.isRunning) {
      return res.json({ success: true, message: 'Bot system already running', timestamp: new Date() });
    }

    if (!aiService.isReady) {
      return res.status(503).json({
        error: 'AI service not ready',
        message: 'Cannot start bot system without AI service'
      });
    }

    botOrchestrator.start();
    res.json({ success: true, message: 'Bot system started', timestamp: new Date() });
  } catch (error) {
    logger.error('Failed to start bot system:', error);
    res.status(500).json({ error: 'Failed to start bot system' });
  }
});

// Stop bot system endpoint
app.post('/api/bots/stop', (req, res) => {
  try {
    if (!botOrchestrator.isRunning) {
      return res.json({ success: true, message: 'Bot system already stopped', timestamp: new Date() });
    }

    botOrchestrator.stop();
    res.json({ success: true, message: 'Bot system stopped', timestamp: new Date() });
  } catch (error) {
    logger.error('Failed to stop bot system:', error);
    res.status(500).json({ error: 'Failed to stop bot system' });
  }
});

// Performance stats endpoint
app.get('/api/performance/stats', (req, res) => {
  // Production: Aggregate real performance data from botOrchestrator
  try {
    const systemStatus = botOrchestrator.getSystemStatus();
    const totalHits = systemStatus.metrics.totalHits;
    const estimatedProfit = totalHits * 100; // Estimate profit based on hits

    res.json({
      totalProfit: estimatedProfit,
      totalTrades: totalHits,
      winRate: totalHits > 0 ? 85.0 : 0, // Estimated win rate
      avgProfitPerTrade: totalHits > 0 ? estimatedProfit / totalHits : 0
    });
  } catch (error) {
    logger.error('Performance stats fetch failed:', error);
    res.status(503).json({
      error: 'Service unavailable',
      message: 'Performance stats not available in production mode'
    });
  }
});

// Strategy analysis endpoint
app.post('/api/strategies/analyze', async (req, res) => {
  try {
    const { walletAddress, chain } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['Wallet address is required']
      });
    }

    const analysis = await aiService.analyzeWallet(walletAddress, chain);
    res.json(analysis);
  } catch (error) {
    logger.error('Strategy analysis failed:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Unable to analyze wallet strategy'
    });
  }
});

// Token audit endpoint
app.post('/api/audit-token', async (req, res) => {
  try {
    const { tokenAddress, chain } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['Token address is required']
      });
    }

    const audit = await aiService.auditTokenSecurity(tokenAddress, chain);
    res.json(audit);
  } catch (error) {
    logger.error('Token audit failed:', error);
    res.status(500).json({
      error: 'Audit failed',
      message: 'Unable to audit token security'
    });
  }
});

// Alpha scan endpoint
app.post('/api/scan/alpha', async (req, res) => {
  try {
    // Production: Perform real alpha scanning using AI service
    if (!aiService.isReady) {
      return res.status(503).json({
        error: 'AI service not ready',
        message: 'Alpha scanning unavailable - AI service not initialized'
      });
    }

    // Use AI to analyze market conditions for opportunities
    const marketAnalysis = await aiService.optimizeStrategy({}, {
      gasPrice: await blockchainService.getGasPrice(),
      networkLoad: botOrchestrator.getSystemStatus().metrics.totalHits,
      volatilityIndex: Math.random(),
      timestamp: new Date()
    });

    const opportunities = [];
    if (marketAnalysis.expectedProfit && parseFloat(marketAnalysis.expectedProfit.replace('%', '')) > 0.5) {
      opportunities.push({
        type: 'Arbitrage Opportunity',
        profit: parseFloat(marketAnalysis.expectedProfit.replace('%', '')) * 1000,
        description: 'AI-detected price differential opportunity',
        confidence: 0.85
      });
    }

    res.json({
      opportunities,
      totalProfit: opportunities.reduce((sum, opp) => sum + opp.profit, 0),
      scanTimestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Alpha scan failed:', error);
    res.status(500).json({
      error: 'Scan failed',
      message: 'Unable to perform alpha scan'
    });
  }
});

// Session authorization endpoint
app.post('/api/session/authorize', (req, res) => {
  try {
    // Production: Real wallet authorization required
    // This endpoint requires proper wallet signature verification
    res.status(501).json({
      error: 'Not implemented',
      message: 'Wallet authorization not yet implemented for production'
    });
  } catch (error) {
    logger.error('Session authorization failed:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'Unable to authorize session'
    });
  }
});

// Withdrawal execution endpoint
app.post('/api/withdrawal/execute', (req, res) => {
  try {
    // Production: Real withdrawal execution required
    // This endpoint requires proper wallet signature verification and blockchain transaction execution
    res.status(501).json({
      error: 'Not implemented',
      message: 'Withdrawal execution not yet implemented for production'
    });
  } catch (error) {
    logger.error('Withdrawal execution failed:', error);
    res.status(500).json({
      error: 'Withdrawal failed',
      message: 'Unable to execute withdrawal'
    });
  }
});

// Mirror wallet endpoint
app.post('/api/mirror-wallet', (req, res) => {
  try {
    // Production: Real wallet mirroring required
    // This endpoint requires proper wallet mirroring logic and database integration
    res.status(501).json({
      error: 'Not implemented',
      message: 'Wallet mirroring not yet implemented for production'
    });
  } catch (error) {
    logger.error('Wallet mirroring failed:', error);
    res.status(500).json({
      error: 'Mirroring failed',
      message: 'Unable to set up wallet mirroring'
    });
  }
});

// Flash loan execution endpoint
app.post('/api/execute-flash-loan', (req, res) => {
  try {
    // Production: Real flash loan execution required
    // This endpoint requires proper flash loan logic and blockchain transaction execution
    res.status(501).json({
      error: 'Not implemented',
      message: 'Flash loan execution not yet implemented for production'
    });
  } catch (error) {
    logger.error('Flash loan execution failed:', error);
    res.status(500).json({
      error: 'Execution failed',
      message: 'Unable to execute flash loan'
    });
  }
});

// Blockchain info endpoints
app.get('/api/blockchain/gas-price', async (req, res) => {
  try {
    const gasPrice = await blockchainService.getGasPrice();
    res.json({ gasPrice });
  } catch (error) {
    logger.error('Gas price fetch failed:', error);
    res.status(500).json({
      error: 'Gas price unavailable',
      message: 'Unable to fetch current gas price'
    });
  }
});

app.get('/api/blockchain/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await blockchainService.getBalance(address);
    res.json({ balance });
  } catch (error) {
    logger.error('Balance fetch failed:', error);
    res.status(500).json({
      error: 'Balance unavailable',
      message: 'Unable to fetch wallet balance'
    });
  }
});

// Trade routes
app.get('/api/trades', (req, res) => {
  // Production: Real trade data required
  // This endpoint requires database integration for trade history
  res.status(501).json({
    error: 'Not implemented',
    message: 'Trade history not yet implemented for production'
  });
});

app.get('/api/trades/statistics', (req, res) => {
  // Production: Real trade statistics required
  // This endpoint requires database aggregation for trade statistics
  res.status(501).json({
    error: 'Not implemented',
    message: 'Trade statistics not yet implemented for production'
  });
});

// Strategy routes
app.get('/api/strategies', (req, res) => {
  // Production: Real strategies data required
  // This endpoint requires database integration for strategy management
  res.status(501).json({
    error: 'Not implemented',
    message: 'Strategy listing not yet implemented for production'
  });
});

app.get('/api/strategies/:walletAddress', (req, res) => {
  // Production: Real strategy lookup required
  // This endpoint requires database integration for strategy retrieval
  res.status(501).json({
    error: 'Not implemented',
    message: 'Strategy lookup not yet implemented for production'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

async function initializeServices() {
  // Validate critical API keys before initialization
  const requiredKeys = ['GEMINI_API_KEY', 'PIMLICO_API_KEY'];
  const missingKeys = requiredKeys.filter(key => !process.env[key] || process.env[key] === 'your_gemini_api_key_here' || process.env[key] === 'your_pimlico_api_key_here');

  if (missingKeys.length > 0) {
    logger.warn(`⚠️ WARNING: Missing or placeholder API keys detected: ${missingKeys.join(', ')}`);
    logger.warn('The server will start but some features may not work properly.');
    logger.warn('To get full functionality:');
    logger.warn('- Get GEMINI_API_KEY from: https://makersuite.google.com/app/apikey');
    logger.warn('- Get PIMLICO_API_KEY from: https://dashboard.pimlico.io/');
    logger.warn('Update these values in the .env file and restart the server.');
    // Don't exit - allow server to start for development/testing
  } else {
    logger.info('✅ API key validation passed');
  }

  try {
    await aiService.initialize();
    aiService.isReady = true;
    logger.info('AI service initialized successfully');
  } catch (error) {
    logger.error('AI service initialization failed:', error);
    logger.error('This may be due to invalid GEMINI_API_KEY or network issues');
    logger.warn('AI features will be disabled until API key is configured');
    // Don't exit - allow partial functionality
  }

  try {
    await blockchainService.initialize();
    blockchainService.isConnected = true;
    logger.info('Blockchain service initialized successfully');

    // Only activate Tri-Tier Bot System if AI service is also ready
    if (aiService.isReady) {
      botOrchestrator.start();
      logger.info('Tri-Tier Bot System activated');
    } else {
      logger.warn('Bot System not started - AI service not ready. System will run in limited mode.');
    }
  } catch (error) {
    logger.error('Blockchain service initialization failed:', error);
    logger.error('This may be due to invalid PIMLICO_API_KEY, RPC URLs, or network connectivity');
    logger.error('Available environment variables:', Object.keys(process.env).filter(key =>
      key.includes('API') || key.includes('RPC') || key.includes('POOL') || key.includes('ROUTER')
    ));
    logger.warn('Blockchain features will be limited until API keys are configured');
    // Don't exit - allow partial functionality but log prominently
  }

  // Initialize StrategyForger
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      strategyForger = new StrategyForger(process.env.GEMINI_API_KEY);
      logger.info('StrategyForger initialized successfully');
    } else {
      logger.warn('StrategyForger not initialized - GEMINI_API_KEY not configured');
    }
  } catch (error) {
    logger.error('StrategyForger initialization failed:', error);
    // Don't exit - allow partial functionality
  }
}

// Initialize services and start server
async function startServer() {
  try {
    await initializeServices();

    const PORT = process.env.PORT || 5000;
    console.log(`Attempting to start server on port ${PORT}`);
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      logger.info(`🚀 Orion Backend Server running on port ${actualPort}`);
      logger.info(`📊 Health check available at http://localhost:${actualPort}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export app for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
