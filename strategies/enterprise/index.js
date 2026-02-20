/**
 * Alpha-Orion Enterprise Strategies Index
 * 
 * Central export point for all arbitrage strategies
 * Location: alpha-orion/strategies/enterprise/
 * 
 * Usage:
 *   const { EnterpriseProfitEngine, strategies } = require('./strategies/enterprise');
 */

const {
  EnterpriseProfitEngine,
  LVRRebalancingStrategy,
  OracleLatencyStrategy,
  JITLiquidityStrategy,
  TriangularArbitrageStrategy,
  CrossDexArbitrageStrategy,
  CrossChainArbitrageStrategy,
  LiquidityPoolArbitrageStrategy,
  MEVExtractionStrategy,
  StatisticalArbitrageStrategy,
  OrderFlowArbitrageStrategy,
  FlashLoanYieldFarmingStrategy,
  OptionsArbitrageStrategy,
  PerpetualsArbitrageStrategy,
  GammaScalpingStrategy,
  DeltaNeutralStrategy,
  BatchAuctionArbitrageStrategy,
} = require('./enterprise-profit-engine');

// Strategy registry for easy access
const strategies = {
  // Game Changers
  LVR_REBALANCING: 'lvr_rebalancing',
  ORACLE_LATENCY: 'oracle_latency',
  JIT_LIQUIDITY: 'jit_liquidity',
  
  // Core Strategies
  TRIANGULAR_ARBITRAGE: 'triangular',
  CROSS_DEX_ARBITRAGE: 'cross_dex',
  CROSS_CHAIN_ARBITRAGE: 'cross_chain',
  LIQUIDITY_POOL_ARBITRAGE: 'liquidity_pool',
  MEV_EXTRACTION: 'mev',
  STATISTICAL_ARBITRAGE: 'statistical',
  ORDER_FLOW_ARBITRAGE: 'order_flow',
  FLASH_LOAN_YIELD_FARMING: 'yield_farming',
  OPTIONS_ARBITRAGE: 'options_arbitrage',
  PERPETUALS_ARBITRAGE: 'perpetuals_arbitrage',
  GAMMA_SCALPING: 'gamma_scalping',
  DELTA_NEUTRAL: 'delta_neutral',
  BATCH_AUCTION_ARBITRAGE: 'batch_auction_arbitrage',
};

// Strategy metadata
const strategyMetadata = {
  lvr_rebalancing: {
    name: 'LVR Rebalancing',
    category: 'Game Changer',
    riskLevel: 'LOW',
    complexity: 'ELITE',
    description: 'Loss-Versus-Rebalancing strategy capturing AMM rebalancing leaks'
  },
  oracle_latency: {
    name: 'Oracle Latency Arbitrage',
    category: 'Game Changer',
    riskLevel: 'MEDIUM',
    complexity: 'ELITE',
    description: 'Exploits Chainlink vs CEX latency gaps'
  },
  jit_liquidity: {
    name: 'JIT Liquidity',
    category: 'Game Changer',
    riskLevel: 'HIGH',
    complexity: 'INSTITUTIONAL_ALPHA',
    description: 'Just-In-Time liquidity attacks for fee capture'
  },
  triangular: {
    name: 'Triangular Arbitrage',
    category: 'Core',
    riskLevel: 'MEDIUM',
    complexity: 'HIGH',
    description: 'Multi-hop path optimization across 3 tokens'
  },
  cross_dex: {
    name: 'Cross-DEX Arbitrage',
    category: 'Core',
    riskLevel: 'MEDIUM',
    complexity: 'MEDIUM',
    description: 'Price differences between DEXes on same chain'
  },
  cross_chain: {
    name: 'Cross-Chain Arbitrage',
    category: 'Core',
    riskLevel: 'HIGH',
    complexity: 'VERY_HIGH',
    description: 'Price differences across different blockchains'
  },
  liquidity_pool: {
    name: 'Liquidity Pool Arbitrage',
    category: 'Core',
    riskLevel: 'MEDIUM',
    complexity: 'HIGH',
    description: 'AMM pool inefficiencies exploitation'
  },
  mev: {
    name: 'MEV Extraction',
    category: 'Core',
    riskLevel: 'HIGH',
    complexity: 'VERY_HIGH',
    description: 'Front-running, back-running, sandwich attacks'
  },
  statistical: {
    name: 'Statistical Arbitrage',
    category: 'Core',
    riskLevel: 'MEDIUM',
    complexity: 'HIGH',
    description: 'Mean-reversion and pairs trading'
  },
  order_flow: {
    name: 'Order Flow Arbitrage',
    category: 'Core',
    riskLevel: 'MEDIUM',
    complexity: 'MEDIUM',
    description: 'Order book imbalance exploitation'
  },
  yield_farming: {
    name: 'Flash Loan Yield Farming',
    category: 'Advanced',
    riskLevel: 'HIGH',
    complexity: 'HIGH',
    description: 'Leverage yield optimization via flash loans'
  },
  options_arbitrage: {
    name: 'Options Arbitrage',
    category: 'Advanced',
    riskLevel: 'HIGH',
    complexity: 'ELITE',
    description: 'Options mispricing strategies (e.g., put-call parity)'
  },
  perpetuals_arbitrage: {
    name: 'Perpetuals Arbitrage',
    category: 'Advanced',
    riskLevel: 'MEDIUM',
    complexity: 'ELITE',
    description: 'Funding rate and basis trading on perpetual futures'
  },
  gamma_scalping: {
    name: 'Gamma Scalping',
    category: 'Advanced',
    riskLevel: 'HIGH',
    complexity: 'INSTITUTIONAL_ALPHA',
    description: 'Delta-neutral options strategy to profit from volatility'
  },
  delta_neutral: {
    name: 'Delta-Neutral',
    category: 'Advanced',
    riskLevel: 'LOW',
    complexity: 'INSTITUTIONAL_ALPHA',
    description: 'Market-neutral portfolio strategies to isolate alpha'
  },
  batch_auction_arbitrage: {
    name: 'Batch Auction Arbitrage',
    category: 'Advanced',
    riskLevel: 'MEDIUM',
    complexity: 'HIGH',
    description: 'Exploits price discrepancies in batch and Dutch auctions'
  }
};

// Configuration loader
const fs = require('fs');
const path = require('path');

let config = null;

function getConfig() {
  if (!config) {
    try {
      const configPath = path.join(__dirname, 'config.yaml');
      const yaml = require('js-yaml');
      config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.warn('Could not load config.yaml, using defaults');
      config = { strategies: {}, execution: {} };
    }
  }
  return config;
}

function isStrategyEnabled(strategyName) {
  const cfg = getConfig();
  const key = strategyName.toLowerCase().replace('_', '_');
  return cfg.strategies[key]?.enabled !== false;
}

function getStrategyConfig(strategyName) {
  const cfg = getConfig();
  const key = strategyName.toLowerCase().replace('_', '_');
  return cfg.strategies[key] || {};
}

// Export all
module.exports = {
  // Main engine
  EnterpriseProfitEngine,
  
  // Strategy classes
  LVRRebalancingStrategy,
  OracleLatencyStrategy,
  JITLiquidityStrategy,
  TriangularArbitrageStrategy,
  CrossDexArbitrageStrategy,
  CrossChainArbitrageStrategy,
  LiquidityPoolArbitrageStrategy,
  MEVExtractionStrategy,
  StatisticalArbitrageStrategy,
  OrderFlowArbitrageStrategy,
  FlashLoanYieldFarmingStrategy,
  OptionsArbitrageStrategy,
  PerpetualsArbitrageStrategy,
  GammaScalpingStrategy,
  DeltaNeutralStrategy,
  BatchAuctionArbitrageStrategy,
  
  // Strategy registry
  strategies,
  
  // Strategy metadata
  strategyMetadata,
  
  // Utility functions
  getConfig,
  isStrategyEnabled,
  getStrategyConfig,
  
  // Version info
  version: '2.0.0',
  location: __dirname
};
