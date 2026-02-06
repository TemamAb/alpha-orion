const express = require('express');
const cors = require('cors');
const PimlicoGaslessEngine = require('./pimlico-gasless');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║      ALPHA-ORION GASLESS WITHDRAWAL SERVICE                   ║
║         ZERO GAS FEES VIA PIMLICO ACCOUNT ABSTRACTION         ║
║         Polygon zkEVM Network                                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Verify Pimlico API key from GCP Secret Manager
if (!process.env.PIMLICO_API_KEY) {
  console.error('❌ FATAL: PIMLICO_API_KEY not configured');
  console.error('   Required from GCP Secret Manager');
  process.exit(1);
}

// Initialize Pimlico engine
let gaslessEngine;
try {
  gaslessEngine = new PimlicoGaslessEngine();
} catch (error) {
  console.error(`❌ Failed to initialize Pimlico: ${error.message}`);
  process.exit(1);
}

let withdrawalHistory = [];
let autoWithdrawalSettings = {};

// ============================================
// GASLESS WITHDRAWAL ENGINE
// ============================================

/**
 * Execute gasless USDC withdrawal
 * Zero gas fees - Pimlico paymaster sponsors
 */
async function executeGaslessWithdrawal(amount, destinationAddress) {
  console.log(`\n[WITHDRAWAL] GASLESS WITHDRAWAL VIA PIMLICO`);
  console.log(`[WITHDRAWAL] Amount: ${amount} USDC`);
  console.log(`[WITHDRAWAL] To: ${destinationAddress}`);
  console.log(`[WITHDRAWAL] Gas Cost: $0.00 (Pimlico Paymaster)`);

  try {
    // Validate address
    if (!destinationAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Execute gasless withdrawal via Pimlico
    const result = await gaslessEngine.executeGaslessWithdrawal(amount, destinationAddress);

    withdrawalHistory.push({
      ...result,
      amount,
      recipient: destinationAddress,
      timestamp: Date.now()
    });

    // Publish withdrawal event to Pub/Sub
    const topicPath = pubsub.topicPath(GCP_PROJECT_ID, 'withdrawal-events');
    const data = JSON.stringify({
      event_type: 'withdrawal_completed',
      amount,
      recipient: destinationAddress,
      txHash: result.userOpHash,
      gasless: true,
      timestamp: Date.now()
    });
    await pubsub.topic(topicPath).publishMessage({data: Buffer.from(data)});

    // Log to BigQuery
    const tableId = `${GCP_PROJECT_ID}.withdrawals.withdrawal_logs`;
    const rows = [{
      timestamp: new Date().toISOString(),
      service: 'withdrawal-service',
      event_type: 'withdrawal_completed',
      data: JSON.stringify({
        amount,
        recipient: destinationAddress,
        txHash: result.userOpHash,
        gasless: true
      })
    }];
    await bigquery.dataset('withdrawals').table('withdrawal_logs').insert(rows);

    console.log(`[WITHDRAWAL] ✅ Confirmed (Gasless)`);
    return result;

  } catch (error) {
    console.error(`[WITHDRAWAL] Error: ${error.message}`);
    throw error;
  }
}

// ============================================
// API ENDPOINTS - GASLESS MODE
// ============================================

/**
 * Execute gasless withdrawal
 */
app.post('/withdraw', async (req, res) => {
  const { amount, address } = req.body;

  if (!amount || !address) {
    return res.status(400).json({
      error: 'Missing required fields: amount, address'
    });
  }

  try {
    const result = await executeGaslessWithdrawal(amount, address);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'withdrawal_failed'
    });
  }
});

/**
 * Get withdrawal history
 */
app.get('/withdrawals', (req, res) => {
  res.json({
    count: withdrawalHistory.length,
    withdrawals: withdrawalHistory.slice(-20),
    totalWithdrawn: withdrawalHistory.reduce((sum, w) => sum + w.amount, 0),
    totalGasSavings: `$0.00 (All gasless via Pimlico)`
  });
});

/**
 * Setup auto-withdrawal
 */
app.post('/auto-withdrawal', (req, res) => {
  const { threshold, address } = req.body;

  if (!threshold || !address) {
    return res.status(400).json({
      error: 'Missing required fields: threshold, address'
    });
  }

  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({
      error: 'Invalid Ethereum address format'
    });
  }

  autoWithdrawalSettings = {
    threshold,
    address,
    enabled: true,
    gasless: true,
    paymaster: 'Pimlico',
    gasCost: '$0.00',
    createdAt: Date.now()
  };

  console.log(`[AUTO-WITHDRAW] Settings configured: $${threshold} gasless withdrawal to ${address}`);

  res.json({
    success: true,
    settings: autoWithdrawalSettings
  });
});

/**
 * Get auto-withdrawal settings
 */
app.get('/auto-withdrawal', (req, res) => {
  res.json({
    settings: autoWithdrawalSettings,
    enabled: !!autoWithdrawalSettings.enabled,
    gasless: true,
    paymaster: 'Pimlico'
  });
});

/**
 * Health check
 */
app.get('/health', async (req, res) => {
  const health_status = {
    status: 'ok',
    service: 'withdrawal-service',
    mode: 'GASLESS_VIA_PIMLICO',
    network: 'Polygon zkEVM',
    gcp_services: {},
    dependencies: {}
  };

  // Check database connectivity
  try {
    const db = pool;
    await db.query('SELECT 1');
    health_status.gcp_services['alloydb'] = 'connected';
  } catch (e) {
    health_status.gcp_services['alloydb'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check Redis connectivity
  try {
    await redisClient.ping();
    health_status.gcp_services['redis'] = 'connected';
  } catch (e) {
    health_status.gcp_services['redis'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check GCP Secret Manager connectivity
  try {
    await secretManager.listSecrets({
      parent: `projects/${GCP_PROJECT_ID}`
    });
    health_status.gcp_services['secretmanager'] = 'connected';
  } catch (e) {
    health_status.gcp_services['secretmanager'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check GCP Logging connectivity
  try {
    await gcpLog.write(gcpLog.entry({
      severity: 'DEBUG',
      resource: { type: 'global' }
    }, { message: 'Health check test', service: 'withdrawal-service' }));
    health_status.gcp_services['logging'] = 'connected';
  } catch (e) {
    health_status.gcp_services['logging'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check GCP Monitoring connectivity
  try {
    await monitoring.listMetricDescriptors({
      name: monitoring.projectPath(GCP_PROJECT_ID)
    });
    health_status.gcp_services['monitoring'] = 'connected';
  } catch (e) {
    health_status.gcp_services['monitoring'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check Pub/Sub connectivity
  try {
    const [topics] = await pubsub.getTopics();
    health_status.gcp_services['pubsub'] = 'connected';
  } catch (e) {
    health_status.gcp_services['pubsub'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check BigQuery connectivity
  try {
    await bigquery.query('SELECT 1');
    health_status.gcp_services['bigquery'] = 'connected';
  } catch (e) {
    health_status.gcp_services['bigquery'] = `error: ${e.message}`;
    health_status.status = 'degraded';
  }

  // Check Pimlico API key availability
  health_status.dependencies['pimlico'] = !!process.env.PIMLICO_API_KEY ? 'configured' : 'missing';

  // Check gasless engine status
  health_status.dependencies['gasless_engine'] = gaslessEngine ? 'initialized' : 'not_initialized';

  res.json(health_status);
});

/**
 * Gasless mode status
 */
app.get('/pimlico/status', (req, res) => {
  res.json({
    service: 'Gasless Withdrawal',
    engine: 'Pimlico ERC-4337',
    network: 'Polygon zkEVM',
    bundler: 'Pimlico',
    paymaster: 'Pimlico (TOKEN_PAYMASTER)',
    gasless: true,
    gasCostPerWithdrawal: '$0.00',
    totalWithdrawals: withdrawalHistory.length,
    totalGasSavings: `$0.00`
  });
});

app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  ✅ GASLESS WITHDRAWAL SERVICE - PORT ${PORT}`);
  console.log(`║  🚀 NETWORK: Polygon zkEVM (Account Abstraction)`);
  console.log(`║  💰 GAS COST: $0.00 per withdrawal (Pimlico Paymaster)`);
  console.log(`║  🔐 Verified: Pimlico ERC-4337 Bundler`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
});
