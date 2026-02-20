/**
 * Profit Engine Manager
 *
 * This module is responsible for instantiating and managing the singleton
 * instance of the EnterpriseProfitEngine and its dependencies.
 */

const { EnterpriseProfitEngine } = require('../../../../strategies/enterprise');

// Assuming these core engines are located in a shared directory or within this service
const MultiChainArbitrageEngine = require('./multi-chain-arbitrage-engine'); // Adjust path if needed
const MEVRouter = require('./mev-router'); // Adjust path if needed
const InstitutionalRiskEngine = require('./risk-engine'); // Adjust path if needed

let profitEngineInstance = null;

/**
 * Initializes and returns a singleton instance of the EnterpriseProfitEngine.
 * @returns {EnterpriseProfitEngine} The singleton instance.
 */
function getProfitEngine() {
  if (!profitEngineInstance) {
    console.log('[ProfitEngineManager] Initializing EnterpriseProfitEngine...');

    // 1. Instantiate Dependencies
    // These would be configured with providers, keys, etc.
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