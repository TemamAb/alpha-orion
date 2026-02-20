require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const logger = require('./logger');
const pinoHttp = require('pino-http');
const { pgPool, connectToDB } = require('./database');
const { redisClient, redisSubscriber, connectRedis } = require('./redis-client');

// Import the engine that holds the advanced metrics
const MultiChainArbitrageEngine = require('./multi-chain-arbitrage-engine');
const engine = new MultiChainArbitrageEngine(); // In a real app, this would be managed more carefully

// --- OpenAI Integration (Robust Import) ---
let OpenAI;
try {
  OpenAI = require('openai');
} catch (err) {
  logger.warn('OpenAI dependency not found. AI features will use fallbacks.');
}

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Health Check
app.get('/health', async (req, res) => {
  try {
    const pgStatus = await pgPool.query('SELECT 1');
    const redisStatus = await redisClient.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: pgStatus.rowCount > 0 ? 'connected' : 'error',
        redis: redisStatus === 'PONG' ? 'connected' : 'error',
        arbitrageEngine: engine ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'One or more services are unhealthy.',
      details: {
        dbError: error.message.includes('database') ? error.message : 'OK',
        redisError: error.message.includes('redis') ? error.message : 'OK',
      }
    });
  }
});

// Dashboard: Real-time Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [pnl, trades, gas] = await Promise.all([
      redisClient.get('total_pnl'),
      redisClient.get('total_trades'),
      redisClient.get('gas_spent')
    ]);

    res.json({
      totalPnl: parseFloat(pnl || 0),
      totalTrades: parseInt(trades || 0),
      gasSpent: parseFloat(gas || 0),
      activeStrategies: 1, // Currently only Flash Loan Arbitrage
      systemStatus: 'active'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching stats');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dashboard: Mission Control (New comprehensive endpoint)
app.get('/api/dashboard/mission-control', authenticateToken, async (req, res) => {
  try {
    // This single endpoint aggregates the most critical, high-level data for the main dashboard view.
    const performanceMetrics = engine.getPerformanceMetrics();
    res.json(performanceMetrics);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching mission control data');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dashboard: Recent Opportunities
app.get('/api/dashboard/opportunities', authenticateToken, async (req, res) => {
  try {
    // Fetch latest opportunities from Redis list
    const opportunities = await redisClient.lRange('recent_opportunities', 0, 9);
    const parsed = opportunities.map(op => JSON.parse(op));
    res.json(parsed);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching opportunities');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dashboard: Trade History (from Postgres) with Pagination and Filtering
app.get('/api/history/trades', authenticateToken, async (req, res) => {
  const {
    page = 1,
    limit = 20,
    chain,
    strategy,
    status,
    startDate,
    endDate
  } = req.query;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (chain) { whereClauses.push(`chain = $${paramIndex++}`); queryParams.push(chain); }
  if (strategy) { whereClauses.push(`strategy = $${paramIndex++}`); queryParams.push(strategy); }
  if (status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(status); }
  if (startDate) { whereClauses.push(`timestamp >= $${paramIndex++}`); queryParams.push(startDate); }
  if (endDate) { whereClauses.push(`timestamp <= $${paramIndex++}`); queryParams.push(endDate); }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    // Query for total count
    const countQuery = `SELECT COUNT(*) FROM trades ${whereString}`;
    const totalResult = await pgPool.query(countQuery, queryParams);
    const totalRecords = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / parseInt(limit, 10));

    // Query for paginated data
    const dataParams = [...queryParams, parseInt(limit, 10), offset];
    const dataQuery = `
      SELECT * FROM trades 
      ${whereString} 
      ORDER BY timestamp DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataResult = await pgPool.query(dataQuery, dataParams);

    res.json({
      data: dataResult.rows,
      pagination: { currentPage: parseInt(page, 10), totalPages, totalRecords, limit: parseInt(limit, 10) }
    });
  } catch (error) {
    logger.error({ err: error }, 'DB Error fetching trade history');
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

// Configuration: Get System Config
app.get('/api/config', authenticateToken, async (req, res) => {
  try {
    const config = await redisClient.get('system_config');
    res.json(JSON.parse(config || '{}'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Configuration: Update System Config (Admin only)
app.post('/api/config', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

  try {
    await redisClient.set('system_config', JSON.stringify(req.body));
    // Publish config update event
    await redisClient.publish('config_updates', JSON.stringify(req.body));
    res.json({ status: 'updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// --- Wallet Management System ---
app.get('/api/wallets', authenticateToken, async (req, res) => {
  try {
    const wallets = await redisClient.get('wallets_data');
    res.json(JSON.parse(wallets || '[]'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

app.post('/api/wallets', authenticateToken, async (req, res) => {
  try {
    const newWallet = req.body;
    // In a real app, validate address format and check balance on-chain here
    const wallets = JSON.parse(await redisClient.get('wallets_data') || '[]');
    wallets.push({ ...newWallet, id: Date.now().toString(), status: 'valid' });
    await redisClient.set('wallets_data', JSON.stringify(wallets));
    res.json({ status: 'success', wallet: newWallet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add wallet' });
  }
});

// --- Strategy & Benchmarking Metrics ---
app.get('/api/dashboard/strategies', authenticateToken, async (req, res) => {
  try {
    const [strategies, topPairs] = await Promise.all([
      redisClient.get('strategy_metrics'),
      redisClient.get('top_pairs_metrics')
    ]);

    // In production, we do not hardcode shares.
    // If Redis is empty, we return empty arrays or a "Scanning" state.
    res.json({
      strategies: JSON.parse(strategies || '[]'),
      topPairs: JSON.parse(topPairs || '[]'),
      chains: [], // Populated by real analytics
      dexes: []   // Populated by real analytics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategy metrics' });
  }
});

// ... (skip down to getFallbackResponse) ...

// Fallback responses for when OpenAI is not available
function getFallbackResponse(userInput) {
  const input = userInput.toLowerCase();

  if (input.includes('opportunity') || input.includes('arbitrage') || input.includes('profit')) {
    return `**System Status: ONLINE**\n\nReal-time market scanning is active. Please refer to the "Opportunities" dashboard for live, verified arbitrage data. I am ready to execute confirmed strategies.`;
  }

  if (input.includes('performance') || input.includes('metric') || input.includes('stat')) {
    return `**Performance Metrics**\n\nLive performance data is available in the "Mission Control" panel.`;
  }

  if (input.includes('wallet') || input.includes('balance')) {
    return `**Wallet Security**\n\nWallet balances are synced with the blockchain. Please verify exact amounts in the "Wallet Management" section.`;
  }

  if (input.includes('strategy')) {
    return `**Strategy Engine**\n\nActive strategies are being orchestrated by the V08 Execution Kernel. Check the "Active Strategies" logs for real-time execution details.`;
  }

  if (input.includes('help')) {
    return `**Alpha-Orion Assistant**\n\nI am connected to the live production environment. I can assist with system navigation and status checks.`;
  }

  return `System is running in **LIVE PRODUCTION MODE**. How can I assist you with the active deployment?`;
}

// Start Server
const start = async () => {
  try {
    await connectRedis();

    await redisSubscriber.subscribe('blockchain_stream', (message) => {
      logger.info({ channel: 'blockchain_stream', message }, 'Received message from Redis Pub/Sub');
      broadcast(message); // Forward message to all connected WebSocket clients
    });

    // Try connecting to PG (non-blocking)
    await connectToDB();

    server.listen(PORT, () => {
      logger.info(`🚀 User API Service with WebSocket server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;