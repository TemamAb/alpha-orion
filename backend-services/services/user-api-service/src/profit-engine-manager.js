/**
 * Profit Engine Manager
 *
 * This module is responsible for instantiating and managing the singleton
 * instance of the EnterpriseProfitEngine and its dependencies.
 * 
 * Note: All dependencies are loaded with graceful fallbacks to ensure
 * the service can start even if advanced modules are not available.
 */

// Helper function to safely require modules with fallback
function safeRequire(modulePath, fallbackName) {
  try {
    return require(modulePath);
  } catch (err) {
    console.warn(`[ProfitEngineManager] ${fallbackName} not available: ${err.message}`);
    return null;
  }
}

// Try to load optional dependencies with graceful fallbacks
let EnterpriseProfitEngine = safeRequire('../../../strategies/enterprise', 'EnterpriseProfitEngine');
let MultiChainArbitrageEngine = safeRequire('./multi-chain-arbitrage-engine', 'MultiChainArbitrageEngine');
let MEVRouter = safeRequire('./mev-router', 'MEVRouter');
let InstitutionalRiskEngine = safeRequire('./risk-engine', 'InstitutionalRiskEngine');

// Create mock classes if modules are not available
if (!EnterpriseProfitEngine) {
  EnterpriseProfitEngine = class EnterpriseProfitEngine {
    constructor(multiChainEngine, mevRouter) {
      this.multiChainEngine = multiChainEngine;
      this.mevRouter = mevRouter;
      this.riskEngine = null;
      console.log('[ProfitEngineManager] Using mock EnterpriseProfitEngine');
    }
    setRiskEngine(riskEngine) {
      this.riskEngine = riskEngine;
    }
  };
}

if (!MultiChainArbitrageEngine) {
  MultiChainArbitrageEngine = class MultiChainArbitrageEngine {
    constructor() {
      console.log('[ProfitEngineManager] Using mock MultiChainArbitrageEngine');
    }
  };
}

if (!MEVRouter) {
  MEVRouter = class MEVRouter {
    constructor() {
      console.log('[ProfitEngineManager] Using mock MEVRouter');
    }
  };
}

if (!InstitutionalRiskEngine) {
  InstitutionalRiskEngine = class InstitutionalRiskEngine {
    constructor() {
      console.log('[ProfitEngineManager] Using mock InstitutionalRiskEngine');
    }
  };
}

let profitEngineInstance = null;

/**
 * Initializes and returns a singleton instance of the EnterpriseProfitEngine.
 * @returns {EnterpriseProfitEngine} The singleton instance.
 */
function getProfitEngine() {
  if (!profitEngineInstance) {
    console.log('[ProfitEngineManager] Initializing EnterpriseProfitEngine...');

    // 1. Instantiate Dependencies
    const multiChainEngine = new MultiChainArbitrageEngine();
    const mevRouter = new MEVRouter();
    const riskEngine = new InstitutionalRiskEngine();

    // 2. Instantiate the Enterprise Profit Engine
    const engine = new EnterpriseProfitEngine(multiChainEngine, mevRouter);

    // 3. Set the risk engine dependency
    engine.setRiskEngine(riskEngine);

    profitEngineInstance = engine;
    console.log('[ProfitEngineManager] EnterpriseProfitEngine is ready.');
  }
  return profitEngineInstance;
}

module.exports = { getProfitEngine };
