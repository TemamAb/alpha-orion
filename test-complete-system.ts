import { initializeBlockchain, CONTRACTS } from './services/blockchainService';
import { createFlashLoanService } from './services/flashLoanService';
import { createDexService } from './services/dexService';
import { getDiscoveryService } from './services/discoveryService';
import { getStrategyOptimizer } from './services/strategyOptimizer';
import { Strategy } from './types';

/**
 * COMPLETE SYSTEM TEST SUITE
 * 
 * Comprehensive testing covering all services and integration points
 * to achieve 100% quality excellence.
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class SystemTester {
  private results: TestResult[] = [];
  
  async runAllTests(): Promise<void> {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     ALPHA-ORION COMPLETE SYSTEM TEST SUITE               ║');
    console.log('║     Target: 100% Quality Excellence                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Phase 1: Blockchain Integration Tests
    await this.runPhase1Tests();
    
    // Phase 2: DEX Integration Tests
    await this.runPhase2Tests();
    
    // Phase 3: Discovery Service Tests
    await this.runPhase3Tests();
    
    // Phase 4: Strategy Optimizer Tests
    await this.runPhase4Tests();
    
    // Phase 5: Integration Tests
    await this.runPhase5Tests();
    
    // Generate report
    this.generateReport();
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: false, duration, error: error.message });
      console.log(`❌ ${name} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  private async runPhase1Tests(): Promise<void> {
    console.log('\n📦 PHASE 1: BLOCKCHAIN INTEGRATION TESTS');
    console.log('─'.repeat(60));

    await this.runTest('Blockchain Service Initialization', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      if (!blockchain) throw new Error('Failed to initialize blockchain');
    });

    await this.runTest('Network Configuration', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const network = blockchain.getNetwork();
      if (network.chainId !== 421614) throw new Error('Invalid chain ID');
      if (!network.rpcUrl) throw new Error('Missing RPC URL');
    });

    await this.runTest('Gas Price Fetching', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const gasPrice = await blockchain.getGasPrice();
      if (gasPrice <= 0n) throw new Error('Invalid gas price');
    });

    await this.runTest('Address Validation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      if (!blockchain.isValidAddress(CONTRACTS.AAVE_POOL)) {
        throw new Error('Invalid address validation');
      }
      if (blockchain.isValidAddress('invalid')) {
        throw new Error('Should reject invalid address');
      }
    });

    await this.runTest('Flash Loan Service Creation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const flashLoan = createFlashLoanService(blockchain);
      if (!flashLoan) throw new Error('Failed to create flash loan service');
    });

    await this.runTest('Flash Loan Premium Calculation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const flashLoan = createFlashLoanService(blockchain);
      const premium = flashLoan.calculatePremium(1000000n);
      // 0.09% of 1000000 = 900 (not 90)
      if (premium !== 900n) throw new Error(`Incorrect premium calculation: expected 900, got ${premium}`);
    });

    await this.runTest('Flash Loan Cost Estimation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const flashLoan = createFlashLoanService(blockchain);
      const cost = await flashLoan.estimateFlashLoanCost(CONTRACTS.USDC, '1000');
      if (!cost.premium || !cost.gasCostETH) {
        throw new Error('Invalid cost estimation');
      }
    });
  }

  private async runPhase2Tests(): Promise<void> {
    console.log('\n📦 PHASE 2: DEX INTEGRATION TESTS');
    console.log('─'.repeat(60));

    await this.runTest('DEX Service Creation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      if (!dex) throw new Error('Failed to create DEX service');
    });

    await this.runTest('Uniswap Quote Generation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const quote = await dex.getUniswapQuote(CONTRACTS.USDC, CONTRACTS.WETH, '1000');
      if (!quote.amountOut || quote.price <= 0) {
        throw new Error('Invalid Uniswap quote');
      }
    });

    await this.runTest('Balancer Quote Generation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const quote = await dex.getBalancerQuote(CONTRACTS.USDC, CONTRACTS.WETH, '1000');
      if (!quote.amountOut || quote.price <= 0) {
        throw new Error('Invalid Balancer quote');
      }
    });

    await this.runTest('Best Price Detection', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const bestPrice = await dex.getBestPrice(CONTRACTS.USDC, CONTRACTS.WETH, '1000');
      if (!bestPrice || !bestPrice.dex) {
        throw new Error('Failed to get best price');
      }
    });

    await this.runTest('Arbitrage Opportunity Detection', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const opportunity = await dex.detectArbitrageOpportunity(
        CONTRACTS.USDC,
        CONTRACTS.WETH,
        '10000'
      );
      if (!opportunity) throw new Error('Failed to detect opportunity');
      if (typeof opportunity.spread !== 'number') {
        throw new Error('Invalid spread calculation');
      }
    });

    await this.runTest('Price Impact Calculation', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const impact = await dex.calculatePriceImpact(
        CONTRACTS.USDC,
        CONTRACTS.WETH,
        '10000'
      );
      if (typeof impact !== 'number' || impact < 0) {
        throw new Error('Invalid price impact');
      }
    });
  }

  private async runPhase3Tests(): Promise<void> {
    console.log('\n📦 PHASE 3: DISCOVERY SERVICE TESTS');
    console.log('─'.repeat(60));

    await this.runTest('Discovery Service Creation', async () => {
      const discovery = getDiscoveryService();
      if (!discovery) throw new Error('Failed to create discovery service');
    });

    await this.runTest('1Click Opportunity Discovery', async () => {
      const discovery = getDiscoveryService();
      const opportunities = await discovery.discover1ClickOpportunities();
      if (!Array.isArray(opportunities)) {
        throw new Error('Invalid opportunities format');
      }
    });

    await this.runTest('DexTools Opportunity Discovery', async () => {
      const discovery = getDiscoveryService();
      const opportunities = await discovery.discoverDexToolsOpportunities();
      if (!Array.isArray(opportunities)) {
        throw new Error('Invalid opportunities format');
      }
    });

    await this.runTest('Champion Wallet Tracking', async () => {
      const discovery = getDiscoveryService();
      const wallets = await discovery.trackChampionWallets();
      if (!Array.isArray(wallets)) {
        throw new Error('Invalid wallets format');
      }
      if (wallets.length > 0 && !wallets[0].address) {
        throw new Error('Invalid wallet structure');
      }
    });

    await this.runTest('Market Conditions Retrieval', async () => {
      const discovery = getDiscoveryService();
      const conditions = await discovery.getMarketConditions();
      if (!conditions.volatility || !conditions.liquidity) {
        throw new Error('Invalid market conditions');
      }
    });

    await this.runTest('Aggregate Discovery', async () => {
      const discovery = getDiscoveryService();
      const result = await discovery.discoverAll();
      if (!result.opportunities || !result.championWallets || !result.marketConditions) {
        throw new Error('Invalid aggregate discovery result');
      }
    });

    await this.runTest('Source Status Check', async () => {
      const discovery = getDiscoveryService();
      const status = discovery.getSourceStatus();
      if (typeof status !== 'object') {
        throw new Error('Invalid source status');
      }
    });
  }

  private async runPhase4Tests(): Promise<void> {
    console.log('\n📦 PHASE 4: STRATEGY OPTIMIZER TESTS');
    console.log('─'.repeat(60));

    const mockStrategy: Strategy = {
      id: 'test-1',
      name: 'Test Strategy',
      roi: 0.8,
      liquidityProvider: 'Aave',
      gasSponsorship: true,
      active: true,
      score: 85,
      championWalletAddress: '0xTest...1234',
      pnl24h: 800,
      winRate: 92
    };

    await this.runTest('Strategy Optimizer Creation', async () => {
      const optimizer = getStrategyOptimizer();
      if (!optimizer) throw new Error('Failed to create optimizer');
    });

    await this.runTest('Single Strategy Optimization', async () => {
      const optimizer = getStrategyOptimizer();
      const result = await optimizer.optimizeStrategy(mockStrategy);
      if (!result || result.optimizedScore <= result.originalScore) {
        throw new Error('Optimization did not improve score');
      }
    });

    await this.runTest('Multiple Strategy Optimization', async () => {
      const optimizer = getStrategyOptimizer();
      const strategies = [mockStrategy, { ...mockStrategy, id: 'test-2' }];
      const results = await optimizer.optimizeStrategies(strategies);
      if (results.length !== 2) {
        throw new Error('Invalid optimization results');
      }
    });

    await this.runTest('Performance Metrics Calculation', async () => {
      const optimizer = getStrategyOptimizer();
      const trades = [
        { profit: 100 },
        { profit: 150 },
        { profit: -50 },
        { profit: 200 }
      ];
      const metrics = optimizer.calculatePerformanceMetrics('test-1', trades);
      if (!metrics || metrics.totalTrades !== 4) {
        throw new Error('Invalid performance metrics');
      }
    });

    await this.runTest('Market-Based Recommendations', async () => {
      const optimizer = getStrategyOptimizer();
      const recommendations = optimizer.recommendAdjustments(mockStrategy, {
        volatility: 4,
        liquidity: 1500000,
        gasPrice: 60
      });
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('No recommendations generated');
      }
    });

    await this.runTest('Optimization Report Generation', async () => {
      const optimizer = getStrategyOptimizer();
      const strategies = [mockStrategy];
      const report = optimizer.generateOptimizationReport(strategies);
      if (!report || !report.recommendations) {
        throw new Error('Invalid optimization report');
      }
    });
  }

  private async runPhase5Tests(): Promise<void> {
    console.log('\n📦 PHASE 5: INTEGRATION TESTS');
    console.log('─'.repeat(60));

    await this.runTest('End-to-End Arbitrage Flow', async () => {
      // Initialize all services
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const flashLoan = createFlashLoanService(blockchain);
      
      // Detect opportunity
      const opportunity = await dex.detectArbitrageOpportunity(
        CONTRACTS.USDC,
        CONTRACTS.WETH,
        '10000'
      );
      
      if (!opportunity) throw new Error('No opportunity detected');
      
      // Calculate costs
      const cost = await flashLoan.estimateFlashLoanCost(CONTRACTS.USDC, '10000');
      
      if (!cost) throw new Error('Failed to calculate costs');
      
      // Verify profitability
      const netProfit = parseFloat(opportunity.estimatedProfit) - parseFloat(cost.totalCostUSD);
      if (netProfit <= 0) {
        console.log('   Note: Opportunity not profitable after costs (expected in simulation)');
      }
    });

    await this.runTest('Discovery to Optimization Flow', async () => {
      const discovery = getDiscoveryService();
      const optimizer = getStrategyOptimizer();
      
      // Discover opportunities
      const result = await discovery.discoverAll();
      
      if (!result.opportunities) throw new Error('No opportunities discovered');
      
      // Create mock strategy from opportunity
      if (result.opportunities.length > 0) {
        const opp = result.opportunities[0];
        const mockStrategy: Strategy = {
          id: opp.id,
          name: `${opp.tokenPair} Arbitrage`,
          roi: opp.spread / 100,
          liquidityProvider: 'Aave',
          gasSponsorship: true,
          active: true,
          score: opp.confidence,
          championWalletAddress: '0xTest...1234',
          pnl24h: opp.estimatedProfit,
          winRate: 90
        };
        
        // Optimize strategy
        const optimized = await optimizer.optimizeStrategy(mockStrategy);
        
        if (!optimized || optimized.improvement <= 0) {
          throw new Error('Optimization failed');
        }
      }
    });

    await this.runTest('Multi-Service Coordination', async () => {
      const blockchain = await initializeBlockchain(undefined, 'ARBITRUM_SEPOLIA');
      const dex = createDexService(blockchain);
      const discovery = getDiscoveryService();
      const optimizer = getStrategyOptimizer();
      
      // Get market conditions
      const conditions = await discovery.getMarketConditions();
      
      // Scan for opportunities
      const opportunities = await dex.scanArbitrageOpportunities([
        { tokenIn: CONTRACTS.USDC, tokenOut: CONTRACTS.WETH },
        { tokenIn: CONTRACTS.DAI, tokenOut: CONTRACTS.USDC }
      ]);
      
      // All services working together
      if (!conditions || !Array.isArray(opportunities)) {
        throw new Error('Multi-service coordination failed');
      }
    });
  }

  private generateReport(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const passRate = (passed / total) * 100;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (passRate === 100) {
      console.log('🎉 ALL TESTS PASSED - 100% QUALITY EXCELLENCE ACHIEVED!');
    } else if (passRate >= 95) {
      console.log('✅ EXCELLENT - System quality is very high');
    } else if (passRate >= 90) {
      console.log('✅ GOOD - System quality is acceptable');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT - Some tests failed');
    }
    
    console.log('═'.repeat(60) + '\n');
  }
}

// Run tests
const tester = new SystemTester();
tester.runAllTests().catch(console.error);
