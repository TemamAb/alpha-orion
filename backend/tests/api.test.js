const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis-mock');
const app = require('../server');

let mongoServer;
let redisClient;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Mock Redis
  redisClient = redis.createClient();
  global.redisClient = redisClient;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  redisClient.quit();
});

beforeEach(async () => {
  // Clear database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  // Clear Redis
  await new Promise((resolve) => redisClient.flushall(resolve));
});

describe('Security Middleware Testing', () => {
  describe('Authentication', () => {
    test('API endpoints should require authentication', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    test('Valid API key should allow access', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .set('x-api-key', 'test-api-key-12345')
        .expect(200);

      expect(response.body).toHaveProperty('strategies');
    });

    test('Invalid API key should be rejected', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .set('x-api-key', 'invalid-key')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('Rate Limiting', () => {
    test('Rate limiting should work for API endpoints', async () => {
      // Make multiple requests to trigger rate limit
      for (let i = 0; i < 105; i++) {
        await request(app)
          .get('/api/strategies')
          .set('x-api-key', 'test-api-key-12345');
      }

      const response = await request(app)
        .get('/api/strategies')
        .set('x-api-key', 'test-api-key-12345')
        .expect(429);

      expect(response.body).toHaveProperty('error');
    });

    test('Flash loan endpoint should have stricter rate limiting', async () => {
      // Make multiple flash loan requests
      for (let i = 0; i < 7; i++) {
        await request(app)
          .post('/api/execute-flash-loan')
          .set('x-api-key', 'test-api-key-12345')
          .send({
            strategyId: 'test',
            tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
            tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            amount: '1000000',
            dexPath: ['Uniswap'],
            slippageTolerance: 0.005
          });
      }

      const response = await request(app)
        .post('/api/execute-flash-loan')
        .set('x-api-key', 'test-api-key-12345')
        .send({
          strategyId: 'test',
          tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
          tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          amount: '1000000',
          dexPath: ['Uniswap'],
          slippageTolerance: 0.005
        })
        .expect(429);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input Validation', () => {
    test('Invalid Ethereum address should be rejected', async () => {
      const response = await request(app)
        .post('/api/strategies/analyze')
        .set('x-api-key', 'test-api-key-12345')
        .send({
          walletAddress: 'invalid-address',
          chain: 'ETH'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Invalid Ethereum address format');
    });

    test('Invalid amount should be rejected', async () => {
      const response = await request(app)
        .post('/api/execute-flash-loan')
        .set('x-api-key', 'test-api-key-12345')
        .send({
          strategyId: 'test',
          tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
          tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          amount: '-1000',
          dexPath: ['Uniswap'],
          slippageTolerance: 0.005
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Amount must be a positive number');
    });

    test('Invalid slippage tolerance should be rejected', async () => {
      const response = await request(app)
        .post('/api/execute-flash-loan')
        .set('x-api-key', 'test-api-key-12345')
        .send({
          strategyId: 'test',
          tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
          tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          amount: '1000000',
          dexPath: ['Uniswap'],
          slippageTolerance: 1.5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Slippage tolerance must be between 0 and 1');
    });

    test('Invalid DEX should be rejected', async () => {
      const response = await request(app)
        .post('/api/execute-flash-loan')
        .set('x-api-key', 'test-api-key-12345')
        .send({
          strategyId: 'test',
          tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
          tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          amount: '1000000',
          dexPath: ['INVALID_DEX'],
          slippageTolerance: 0.005
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Invalid DEX at index 0');
    });
  });

  describe('Security Headers', () => {
    test('Security headers should be present', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('CORS', () => {
    test('CORS headers should be present for allowed origins', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('CORS should reject disallowed origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com')
        .expect(200);

      // CORS headers won't be set for disallowed origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

describe('API Endpoints Testing', () => {
  describe('Health Check', () => {
    test('GET /api/health - should return OK status without auth', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment', 'test');
    });
  });

  describe('Strategy Routes', () => {
    test('GET /api/strategies - should return empty array when no strategies', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .expect(200);

      expect(response.body).toHaveProperty('strategies');
      expect(Array.isArray(response.body.strategies)).toBe(true);
    });

    test('POST /api/strategies/analyze - should analyze wallet (mock)', async () => {
      const walletData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'ETH'
      };

      const response = await request(app)
        .post('/api/strategies/analyze')
        .send(walletData)
        .expect(200);

      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('winRate');
      expect(response.body).toHaveProperty('status', 'VERIFIED');
    });

    test('GET /api/strategies/:walletAddress - should return 404 for non-existent strategy', async () => {
      const response = await request(app)
        .get('/api/strategies/0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Strategy not found');
    });
  });

  describe('Trade Routes', () => {
    test('GET /api/trades - should return empty trades array', async () => {
      const response = await request(app)
        .get('/api/trades?walletAddress=0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
        .expect(200);

      expect(response.body).toHaveProperty('trades');
      expect(Array.isArray(response.body.trades)).toBe(true);
    });

    test('GET /api/trades/statistics - should return statistics object', async () => {
      const response = await request(app)
        .get('/api/trades/statistics?walletAddress=0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
        .expect(200);

      expect(response.body).toHaveProperty('statistics');
      expect(typeof response.body.statistics).toBe('object');
    });
  });

  describe('Flash Loan Routes', () => {
    test('POST /api/execute-flash-loan - should reject without arbitrage opportunity', async () => {
      const flashLoanData = {
        strategyId: 'test-strategy-id',
        tokenIn: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
        tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amount: '1000000',
        dexPath: ['Uniswap'],
        slippageTolerance: 0.005
      };

      const response = await request(app)
        .post('/api/execute-flash-loan')
        .send(flashLoanData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Wallet Mirroring', () => {
    test('POST /api/mirror-wallet - should initiate mirroring', async () => {
      const mirrorData = {
        sourceWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        targetWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44f',
        strategyId: 'test-strategy-id'
      };

      const response = await request(app)
        .post('/api/mirror-wallet')
        .send(mirrorData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('strategy');
      expect(response.body).toHaveProperty('execution');
    });
  });

  describe('Token Auditing', () => {
    test('POST /api/audit-token - should audit token security', async () => {
      const auditData = {
        tokenAddress: '0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d',
        chain: 'ETH'
      };

      const response = await request(app)
        .post('/api/audit-token')
        .send(auditData)
        .expect(200);

      expect(response.body).toHaveProperty('securityScore');
      expect(response.body).toHaveProperty('liquidityDepth');
      expect(response.body).toHaveProperty('recommendation');
    });
  });

  describe('Blockchain Info', () => {
    test('GET /api/blockchain/gas-price - should return gas price info', async () => {
      const response = await request(app)
        .get('/api/blockchain/gas-price')
        .expect(200);

      expect(response.body).toHaveProperty('gasPrice');
    });

    test('GET /api/blockchain/balance/:address - should return balance', async () => {
      const response = await request(app)
        .get('/api/blockchain/balance/0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });
  });
});
