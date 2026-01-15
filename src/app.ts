import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { container } from './shared/container';
import { AppConfig } from './shared/types';
import { createLogger } from './shared/utils';
import strategyRoutes from './infrastructure/api/routes/strategies';

const logger = createLogger('app');

export class Application {
  private app: express.Application;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors({
      origin: this.config.security.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting would be added here
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: express.Request, res: express.Response) => {
      const dbHealthy = container.database?.isHealthy() || false;
      const aiReady = container.ai?.isInitialized() || false;

      res.json({
        status: dbHealthy && aiReady ? 'healthy' : 'unhealthy',
        services: {
          database: dbHealthy,
          ai: aiReady,
          blockchain: true // Would check blockchain connection
        },
        timestamp: new Date()
      });
    });

    // API routes
    this.app.use('/api/strategies', strategyRoutes);

    // Matrix status endpoint for dashboard
    this.app.get('/api/matrix/status', (req: express.Request, res: express.Response) => {
      try {
        // Mock matrix data for dashboard - would be replaced with real data
        const matrixData = {
          matrix: {
            'THE GHOST': {
              status: 'ACTIVE',
              score: 99.2,
              yield: '24.5%',
              winRate: 87.3,
              gasEfficiency: 94.1,
              riskLevel: 'LOW'
            },
            'SLOT-0 SNIPER': {
              status: 'ACTIVE',
              score: 98.8,
              yield: '18.2%',
              winRate: 92.1,
              gasEfficiency: 89.7,
              riskLevel: 'MEDIUM'
            },
            'BUNDLE MASTER': {
              status: 'SCANNING',
              score: 97.5,
              yield: '15.8%',
              winRate: 85.6,
              gasEfficiency: 91.2,
              riskLevel: 'MEDIUM'
            },
            'ATOMIC FLUX': {
              status: 'ACTIVE',
              score: 96.9,
              yield: '12.3%',
              winRate: 88.4,
              gasEfficiency: 87.3,
              riskLevel: 'HIGH'
            },
            'DARK RELAY': {
              status: 'STANDBY',
              score: 95.1,
              yield: '10.7%',
              winRate: 83.9,
              gasEfficiency: 93.5,
              riskLevel: 'LOW'
            },
            'HIVE SYMMETRY': {
              status: 'ACTIVE',
              score: 94.7,
              yield: '9.4%',
              winRate: 86.2,
              gasEfficiency: 88.9,
              riskLevel: 'MEDIUM'
            },
            'DISCOVERY_HUNT': {
              status: 'SCANNING',
              score: 93.8,
              yield: '11.2%',
              winRate: 79.5,
              gasEfficiency: 85.4,
              riskLevel: 'HIGH'
            }
          },
          systemTotalProjectedProfit: 1250000, // $1.25M target
          timestamp: new Date()
        };
        res.json(matrixData);
      } catch (error) {
        res.status(500).json({ error: 'Matrix status unavailable' });
      }
    });

    // Alpha scan endpoint
    this.app.post('/api/scan/alpha', (req: express.Request, res: express.Response) => {
      try {
        // Mock alpha scan results
        const scanResults = {
          opportunities: [
            {
              type: 'Cross-DEX Arbitrage',
              profit: 2450.50,
              description: 'ETH/USDC price discrepancy between Uniswap V3 and SushiSwap',
              confidence: 0.89,
              risk: 'LOW'
            },
            {
              type: 'Triangular Arbitrage',
              profit: 1890.25,
              description: 'ETH -> USDC -> DAI -> ETH opportunity detected',
              confidence: 0.76,
              risk: 'MEDIUM'
            },
            {
              type: 'MEV Opportunity',
              profit: 3200.75,
              description: 'Front-running opportunity in pending transaction pool',
              confidence: 0.94,
              risk: 'HIGH'
            }
          ],
          totalProfit: 7541.50,
          scanTime: '2.3s',
          timestamp: new Date()
        };
        res.json(scanResults);
      } catch (error) {
        res.status(500).json({ error: 'Alpha scan failed' });
      }
    });

    // Performance stats endpoint
    this.app.get('/api/performance/stats', (req: express.Request, res: express.Response) => {
      try {
        const performanceData = {
          totalProfit: 312000,
          dailyProfit: 24500,
          weeklyProfit: 168000,
          monthlyProfit: 687000,
          winRate: 87.3,
          totalTrades: 1247,
          successfulTrades: 1088,
          averageTradeSize: 1250.50,
          gasEfficiency: 91.2,
          timestamp: new Date()
        };
        res.json(performanceData);
      } catch (error) {
        res.status(500).json({ error: 'Performance stats unavailable' });
      }
    });

    // System status endpoint
    this.app.get('/api/status', (req: express.Request, res: express.Response) => {
      try {
        const statusData = {
          blockchain: {
            signer: true,
            accountAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            network: 'ethereum',
            gasPrice: '25',
            blockNumber: 18500000
          },
          ai: {
            isReady: true,
            modelVersion: 'gemini-pro',
            lastAnalysis: new Date()
          },
          bots: {
            active: true,
            fleetSize: 7,
            status: 'OPERATIONAL'
          },
          timestamp: new Date()
        };
        res.json(statusData);
      } catch (error) {
        res.status(500).json({ error: 'System status unavailable' });
      }
    });

    // Session authorization endpoint
    this.app.post('/api/session/authorize', (req: express.Request, res: express.Response) => {
      try {
        const { sessionKey } = req.body;
        // Mock authorization - would validate MetaMask signature
        res.json({
          authorized: true,
          sessionId: 'session_' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({ error: 'Session authorization failed' });
      }
    });

    // Withdrawal execution endpoint
    this.app.post('/api/withdrawal/execute', (req: express.Request, res: express.Response) => {
      try {
        const { address, amount } = req.body;
        // Mock withdrawal processing
        res.json({
          success: true,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          amount: amount,
          address: address,
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({ error: 'Withdrawal execution failed' });
      }
    });

    // Bot orchestrator routes
    this.app.get('/api/bots/status', (req: express.Request, res: express.Response) => {
      try {
        const botStatus = {
          scanners: [
            { id: 'scanner_1', type: 'MEMPOOL', hits: 1247, status: 'SCANNING' },
            { id: 'scanner_2', type: 'PENDING_TX', hits: 892, status: 'SCANNING' },
            { id: 'scanner_3', type: 'LIQUIDITY_POOL', hits: 654, status: 'ACTIVE' }
          ],
          captain: {
            status: 'ACTIVE',
            decisionCycleMs: 145,
            pendingOrders: 3
          },
          executors: [
            { id: 'executor_1', capability: 'FLASH_LOAN', busy: false },
            { id: 'executor_2', capability: 'SWAP_EXEC', busy: true },
            { id: 'executor_3', capability: 'ARBITRAGE', busy: false }
          ],
          timestamp: new Date()
        };
        res.json(botStatus);
      } catch (error) {
        res.status(500).json({ error: 'Bot status unavailable' });
      }
    });

    this.app.post('/api/bots/start', (req: express.Request, res: express.Response) => {
      try {
        // Mock bot start
        res.json({ success: true, message: 'Bot system started', timestamp: new Date() });
      } catch (error) {
        res.status(500).json({ error: 'Failed to start bot system' });
      }
    });

    this.app.post('/api/bots/stop', (req: express.Request, res: express.Response) => {
      try {
        // Mock bot stop
        res.json({ success: true, message: 'Bot system stopped', timestamp: new Date() });
      } catch (error) {
        res.status(500).json({ error: 'Failed to stop bot system' });
      }
    });

    // AI routes
    this.app.post('/api/ai/analyze', async (req: express.Request, res: express.Response) => {
      try {
        const aiService = container.ai;
        if (aiService) {
          const analysis = await aiService.analyzeWallet(
            req.body.walletAddress,
            req.body.chain,
            req.body.transactionHistory
          );
          res.json(analysis);
        } else {
          res.status(503).json({ error: 'AI service not available' });
        }
      } catch (error) {
        res.status(500).json({ error: 'AI analysis failed' });
      }
    });

    this.app.post('/api/ai/audit', async (req: express.Request, res: express.Response) => {
      try {
        const aiService = container.ai;
        if (aiService) {
          const audit = await aiService.auditTokenSecurity(
            req.body.tokenAddress,
            req.body.chain
          );
          res.json(audit);
        } else {
          res.status(503).json({ error: 'AI service not available' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Token audit failed' });
      }
    });

    // Blockchain routes
    this.app.get('/api/blockchain/status', async (req: express.Request, res: express.Response) => {
      try {
        const blockchainService = container.blockchain;
        if (blockchainService) {
          const status = await blockchainService.getStatus();
          res.json(status);
        } else {
          res.status(503).json({ error: 'Blockchain service not available' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Blockchain status check failed' });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date()
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize services
      await container.initialize(this.config);

      // Start server
      this.app.listen(this.config.port, '0.0.0.0', () => {
        logger.info(`Server running on port ${this.config.port}`);
        logger.info(`Environment: ${this.config.environment}`);
      });
    } catch (error) {
      logger.error('Failed to start application:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await container.dispose();
    logger.info('Application stopped');
  }

  getApp(): express.Application {
    return this.app;
  }
}
