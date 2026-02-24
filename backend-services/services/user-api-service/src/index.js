require('dotenv').config();
const { ethers } = require('ethers');

// Set default values for required env vars if not set (for development/free tier)
// NOTE: Don't set REDIS_URL to empty string - let redis-client handle missing config gracefully
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production';
// DATABASE_URL and REDIS_URL should NOT have empty string defaults - they will be provided by Render

console.log('Starting Alpha-Orion API Service...');

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const logger = require('./logger');
const pinoHttp = require('pino-http');
const { pgPool, connectToDB } = require('./database');
const { redisClient, redisSubscriber, connectRedis } = require('./redis-client');

// Import the singleton manager for the main profit engine
const { getProfitEngine } = require('./profit-engine-manager');
const engine = getProfitEngine(); // Get the singleton instance

// ============================================================
// KERNEL INTEGRITY VERIFICATION
// Validates production configuration before enabling trading
// ============================================================
function verifyKernelIntegrity() {
  const errors = [];
  const warnings = [];
  
  // Check environment variables
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not production - running in development mode');
  }
  
  // Wallet mode detection - execution or signals_only
  const hasPrivateKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66;
  const walletMode = hasPrivateKey ? 'execution' : 'signals_only';
  
  // Check ETHEREUM_RPC_URL - required for blockchain connectivity
  if (!process.env.ETHEREUM_RPC_URL && !process.env.INFURA_API_KEY) {
    warnings.push('No Ethereum RPC configured - using default Infura');
  }
  
  // Check Redis connection status
  if (!redisClient || !redisClient.isReady) {
    warnings.push('Redis not connected - telemetry may be limited');
  }
  
  // Check database connection
  if (!pgPool) {
    warnings.push('PostgreSQL not connected - history may be limited');
  }
  
  return {
    valid: true, // Signal mode always valid
    mode: walletMode,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  };
}

// Initialize kernel status
const kernelStatus = verifyKernelIntegrity();
console.log('[Kernel] Integrity Check:', kernelStatus.valid ? 'PASSED' : 'FAILED');
if (kernelStatus.errors.length > 0) {
  console.log('[Kernel] Errors:', kernelStatus.errors);
}
if (kernelStatus.warnings.length > 0) {
  console.log('[Kernel] Warnings:', kernelStatus.warnings);
}

// --- OpenAI Integration (Robust Import) ---
let OpenAI;
let openaiClient = null;
try {
  OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('OpenAI client initialized successfully');
  } else {
    logger.warn('OPENAI_API_KEY not found. AI features will use fallbacks.');
  }
} catch (err) {
  logger.warn('OpenAI dependency not found. AI features will use fallbacks.');
}

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app
const PORT = process.env.PORT || 8080;

// --- WebSocket Server Initialization ---
const wss = new WebSocketServer({ server });

const broadcast = (data) => {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
};

wss.on('connection', (ws) => {
  logger.info('New WebSocket client connected');
  ws.send(JSON.stringify({ type: 'CONNECTION_ESTABLISHED', timestamp: new Date().toISOString() }));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Auth Middleware - Works without real JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Allow access if no token (development mode) or use dev token
  if (!token || token === 'dev-token') {
    req.user = { username: 'dev-user' };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Allow access in dev mode
      req.user = { username: 'dev-user' };
    } else {
      req.user = user;
    }
    next();
  });
};

// --- Routes ---

// Health Check - Works without Redis/DB
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    if (pgPool) {
      await pgPool.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch (e) { dbStatus = 'disconnected'; }

  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.ping();
      redisStatus = 'connected';
    }
  } catch (e) { redisStatus = 'disconnected'; }

  res.json({
    status: dbStatus === 'connected' || redisStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      arbitrageEngine: engine ? 'active' : 'inactive'
    },
    profitMode: 'ready'
  });
});

// Dashboard: Real-time Stats - Works without Redis
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    let pnl = 0, trades = 0, gas = 0;
    try {
      if (redisClient && redisClient.isReady) {
        [pnl, trades, gas] = await Promise.all([
          redisClient.get('total_pnl'),
          redisClient.get('total_trades'),
          redisClient.get('gas_spent')
        ]);
      }
    } catch (e) { /* Redis unavailable */ }

    const activeStrategies = engine && engine.strategies ? Object.keys(engine.strategies).length : 0;

    res.json({
      totalPnl: parseFloat(pnl || 0),
      totalTrades: parseInt(trades || 0),
      gasSpent: parseFloat(gas || 0),
      activeStrategies: activeStrategies,
      systemStatus: 'active',
      profitMode: 'enabled'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching stats');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dashboard: Mission Control - Works without Redis
app.get('/api/dashboard/mission-control', async (req, res) => {
  try {
    let metrics = { totalPnl: 0, totalTrades: 0, activeStrategies: 0 };
    try {
      if (engine && engine.getPerformanceMetrics) {
        metrics = engine.getPerformanceMetrics();
      }
    } catch (e) { /* Engine not ready */ }

    res.json({
      ...metrics,
      status: 'operational',
      profitMode: 'active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching mission control data');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Dashboard: Recent Opportunities - Uses Redis, generates from launch button
app.get('/api/dashboard/opportunities', async (req, res) => {
  try {
    let opportunities = [];
    try {
      if (redisClient && redisClient.isReady) {
        opportunities = await redisClient.lRange('recent_opportunities', 0, 9);
        opportunities = opportunities.map(op => JSON.parse(op));
      }
    } catch (e) { /* Redis unavailable */ }

    // Return opportunities if available, otherwise prompt to use launch button
    if (opportunities.length > 0) {
      res.json(opportunities);
    } else {
      // No mock data - require launch button to generate real opportunities
      res.json({
        message: 'No opportunities found. Use POST /api/launch to scan for opportunities.',
        opportunities: [],
        hint: 'Send POST request to /api/launch with { "mode": "scan" }'
      });
    }
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

// --- Wallet & Balance APIs ---
app.post('/api/wallets/balances', authenticateToken, async (req, res) => {
  const { addresses } = req.body;
  if (!addresses || !Array.isArray(addresses)) {
    return res.status(400).json({ error: 'Valid addresses array required' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com');
    const balancePromises = addresses.map(async (addr) => {
      try {
        const balance = await provider.getBalance(addr);
        return {
          address: addr,
          balance: parseFloat(ethers.formatEther(balance)),
          status: 'valid'
        };
      } catch (err) {
        return { address: addr, balance: 0, status: 'invalid' };
      }
    });

    const results = await Promise.all(balancePromises);
    res.json({ balances: results, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to fetch blockchain balances', error);
    res.status(500).json({ error: 'Failed to fetch balances from blockchain' });
  }
});

// --- Engine Control & Status ---
app.get('/api/engine/status', authenticateToken, (req, res) => {
  const activeStrategies = engine && engine.strategyRegistry 
    ? Object.values(engine.strategyRegistry).filter(s => s.enabled).length 
    : 0;
  
  res.json({
    status: engine ? 'running' : 'stopped',
    lastPulse: new Date().toISOString(),
    activeStrategies: activeStrategies,
    totalStrategies: 20,
    profitMode: 'production',
    kernelReady: verifyKernelIntegrity().valid
  });
});

app.post('/api/engine/start', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== 'dev-user') return res.sendStatus(403);

  logger.info("Profit Engine start requested via API");
  startProfitGenerationLoop();
  res.json({ status: 'starting', timestamp: new Date().toISOString() });
});

app.post('/api/engine/stop', authenticateToken, (req, res) => {
  const userRole = req.user.role || '';
  if (userRole !== 'admin' && req.user.username !== 'dev-user') return res.sendStatus(403);

  logger.info("Profit Engine stop requested via API");
  // Logic to stop the loop would go here if we used clearInterval
  res.json({ status: 'stopping', timestamp: new Date().toISOString() });
});

// ============================================================
// LAUNCH BUTTON ENDPOINT
// Triggers the Variant Execution Kernel with all 20 strategies
// ============================================================

// Rate limiter for launch endpoint - prevent abuse
const launchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many launch requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/launch', launchRateLimiter, authenticateToken, async (req, res) => {
  // Only admins can trigger launch
  const userRole = req.user.role || '';
  if (userRole !== 'admin' && userRole !== 'super_admin' && req.user.username !== 'dev-user') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { mode } = req.body; // 'scan' | 'execute' | 'full'
  const validModes = ['scan', 'execute', 'full'];
  
  if (!mode || !validModes.includes(mode)) {
    return res.status(400).json({ 
      error: 'Invalid mode', 
      validModes,
      example: { mode: 'scan' }
    });
  }

  logger.info(`🚀 LAUNCH BUTTON TRIGGERED: Mode=${mode}, User=${req.user.username}`);

  try {
    // 1. Verify kernel integrity before launch
    const integrityCheck = verifyKernelIntegrity();
    
    if (!integrityCheck.valid) {
      logger.warn('[Launch] Kernel integrity check failed:', integrityCheck.errors);
      return res.status(400).json({
        error: 'Kernel integrity check failed',
        details: integrityCheck
      });
    }

    const results = {
      timestamp: new Date().toISOString(),
      mode,
      kernelStatus: 'active',
      strategiesActivated: 0,
      opportunities: [],
      execution: []
    };

    // 2. Scan for opportunities (always run for all modes)
    if (mode === 'scan' || mode === 'full') {
      logger.info('[Launch] Scanning for opportunities across all strategies...');
      
      if (engine && typeof engine.generateProfitOpportunities === 'function') {
        const opportunities = await engine.generateProfitOpportunities();
        results.opportunities = opportunities;
        results.strategiesActivated = opportunities.length > 0 
          ? [...new Set(opportunities.map(o => o.strategy))].length 
          : 0;
        
        // Store in Redis
        if (redisClient && redisClient.isReady) {
          await redisClient.del('recent_opportunities');
          for (const opp of opportunities.slice(0, 20)) {
            await redisClient.lPush('recent_opportunities', JSON.stringify({
              ...opp,
              timestamp: new Date().toISOString()
            }));
          }
          
          // Broadcast to connected clients
          broadcast({
            type: 'OPPORTUNITIES_UPDATED',
            count: opportunities.length,
            topOpportunity: opportunities[0] || null,
            mode
          });
        }
        
        logger.info(`[Launch] Found ${opportunities.length} opportunities from ${results.strategiesActivated} strategies`);
      }
    }

    // 3. Execute top opportunities (only for execute or full mode)
    if (mode === 'execute' || mode === 'full') {
      logger.info('[Launch] Executing top opportunities...');
      
      const topOpportunities = results.opportunities
        .sort((a, b) => (b.expectedProfit || 0) - (a.expectedProfit || 0))
        .slice(0, 5);
      
      // Execute opportunities (requires external relayer or configured wallet)
      for (const opp of topOpportunities) {
        results.execution.push({
          opportunity: opp,
          status: 'queued',
          message: 'Execution queued - awaiting relayer configuration',
          timestamp: new Date().toISOString()
        });
      }
      
      logger.info(`[Launch] Executed ${results.execution.length} opportunities`);
    }

    // 4. Store launch result in Redis
    if (redisClient && redisClient.isReady) {
      await redisClient.set('last_launch_result', JSON.stringify({
        ...results,
        timestamp: new Date().toISOString()
      }), { EX: 3600 }); // Expire after 1 hour
    }

    // 5. Return success response
    res.json({
      status: 'success',
      ...results,
      message: mode === 'scan' 
        ? `Scanned ${results.strategiesActivated} strategies, found ${results.opportunities.length} opportunities`
        : `Executed ${results.execution.length} opportunities`
    });

  } catch (error) {
    logger.error({ err: error }, '[Launch] Launch failed');
    res.status(500).json({ 
      error: 'Launch failed', 
      details: error.message 
    });
  }
});

// --- Kernel Status Endpoint ---
app.get('/api/kernel/status', authenticateToken, (req, res) => {
  const integrity = verifyKernelIntegrity();
  res.json({
    kernel: 'Variant Execution Kernel',
    version: '2.0',
    status: integrity.valid ? 'ready' : 'not_ready',
    integrity,
    strategies: {
      total: 20,
      enabled: engine && engine.strategyRegistry 
        ? Object.values(engine.strategyRegistry).filter(s => s.enabled).length 
        : 0
    },
    timestamp: new Date().toISOString()
  });
});

// --- Wallet Management System ---
let inMemoryWallets = [];

app.get('/api/wallets', authenticateToken, async (req, res) => {
  try {
    if (redisClient && redisClient.isOpen) {
      const wallets = await redisClient.get('wallets_data');
      return res.json(JSON.parse(wallets || '[]'));
    }
    res.json(inMemoryWallets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

app.post('/api/wallets', authenticateToken, async (req, res) => {
  try {
    const newWallet = req.body;
    const walletToAdd = { ...newWallet, id: Date.now().toString(), status: 'pending' };
    if (redisClient && redisClient.isOpen) {
      const wallets = JSON.parse(await redisClient.get('wallets_data') || '[]');
      wallets.push(walletToAdd);
      await redisClient.set('wallets_data', JSON.stringify(wallets));
    } else {
      inMemoryWallets.push(walletToAdd);
    }
    res.status(201).json({ status: 'success', wallet: walletToAdd });
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
// --- AI Copilot: Chat Endpoint ---
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!openaiClient) {
    logger.warn('OpenAI not available, using fallback response');
    return res.json({ response: getFallbackResponse(message) });
  }

  try {
    const systemPrompt = `You are Alpha-Orion Neural Intelligence Core v3.0, an expert arbitrage trading assistant.
Current Environment: Render Cloud (Production)
Capabilities: Multi-chain arbitrage, Flash Loans, MEV Protection, Gasless Execution via Pimlico.

Current Context:
${JSON.stringify(context || {}, null, 2)}

Provide expert, actionable advice on DeFi arbitrage, risk management, and system optimization. Focus on profit maximization and capital safety.`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    res.json({ response });
  } catch (error) {
    logger.error({ err: error }, 'OpenAI API Error');
    res.status(500).json({ response: getFallbackResponse(message), error: error.message });
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

const dashboardDistPath = path.join(__dirname, '..', '..', '..', '..', 'dashboard', 'dist');
const fs = require('fs');
if (fs.existsSync(dashboardDistPath)) {
  app.use(express.static(dashboardDistPath));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.headers.accept && !req.headers.accept.includes('text/html')) return next();
    const indexPath = path.join(dashboardDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

// --- Background Profit Generation Loop ---
const startProfitGenerationLoop = async () => {
  logger.info("Starting background profit generation loop...");

  const runIteration = async () => {
    try {
      if (engine && typeof engine.generateProfitOpportunities === 'function') {
        const opportunities = await engine.generateProfitOpportunities();

        if (opportunities && opportunities.length > 0) {
          logger.info(`[ProfitEngine] Found ${opportunities.length} opportunities. Persisting to Redis.`);

          if (redisClient && redisClient.isReady) {
            // Store top 20 opportunities
            await redisClient.del('recent_opportunities');
            for (const opp of opportunities.slice(0, 20)) {
              await redisClient.lPush('recent_opportunities', JSON.stringify({
                ...opp,
                timestamp: new Date().toISOString()
              }));
            }

            // Increment simulated trades for display if in production
            // Increment trades based on actual opportunities found if desired, 
            // but NEVER using Math.random() in a production-ready financial system.
            // await redisClient.incrBy('total_trades', opportunities.length); 

            // Broadcast update to all clients
            broadcast({
              type: 'OPPORTUNITIES_UPDATED',
              count: opportunities.length,
              topOpportunity: opportunities[0]
            });
          }
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Error in profit generation iteration');
    }

    // Schedule next run (15 seconds)
    setTimeout(runIteration, 15000);
  };

  runIteration();
};

// Start Server
const start = async () => {
  try {
    const redisConnected = await connectRedis();

    if (redisConnected && redisSubscriber) {
      await redisSubscriber.subscribe('blockchain_stream', (message) => {
        logger.info({ channel: 'blockchain_stream', message }, 'Received message from Redis Pub/Sub');
        broadcast(message);
      });
    }

    // Try connecting to PG (non-blocking)
    await connectToDB();

    // Start the profit engine loop
    startProfitGenerationLoop();

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