// JavaScript version of StrategyForger for backend integration
// Converted from TypeScript src/core/ai/specialists/StrategyForger.ts

const { GoogleGenerativeAI } = require('@google/generative-ai');

class StrategyForger {
  constructor(apiKey) {
    this.domain = 'arbitrage';
    this.expertise = [
      'top-performer-analysis',
      'strategy-cloning',
      'performance-adaptation',
      'risk-calibration',
      'market-condition-adaptation'
    ];
    this.confidence = 0.92;
    this.lastTraining = new Date();

    this.ai = new GoogleGenerativeAI({ apiKey });
    this.topPerformersCache = new Map();
    this.forgedStrategiesCache = new Map();
    this.CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * CORE METHOD: Forge strategies by copying top performers
   */
  async forgeStrategyFromTopPerformers(targetClassification, marketConditions, capitalAvailable) {
    try {
      console.log(`Forging ${targetClassification} strategy from top performers`);

      // Step 1: Identify top performers in this classification
      const topPerformers = await this.identifyTopPerformers(targetClassification);

      if (topPerformers.length === 0) {
        throw new Error(`No top performers found for classification: ${targetClassification}`);
      }

      // Step 2: Analyze the best performer
      const bestPerformer = topPerformers[0];
      console.log(`Selected top performer: ${bestPerformer.walletAddress} (${bestPerformer.winRate}% win rate)`);

      // Step 3: Reverse-engineer their strategy
      const reverseEngineeredStrategy = await this.reverseEngineerStrategy(bestPerformer, marketConditions);

      // Step 4: Adapt for our execution environment
      const adaptedStrategy = await this.adaptStrategyForExecution(
        reverseEngineeredStrategy,
        capitalAvailable,
        marketConditions
      );

      // Step 5: Calibrate risk parameters
      const calibratedStrategy = await this.calibrateRiskParameters(adaptedStrategy, bestPerformer);

      // Calculate perfect match score
      const perfectMatchScore = this.calculatePerfectMatchScore(bestPerformer, calibratedStrategy, marketConditions);

      // Initialize learning curve data
      const learningCurveData = {
        iterations: 0,
        historicalPerformance: [],
        learningRate: 0.1,
        confidenceScore: bestPerformer.confidence,
        lastUpdated: new Date(),
        discoveredStrategies: [],
        profitDayProgression: [],
        strategyCombinations: []
      };

      const forgedStrategy = {
        originalWallet: bestPerformer.walletAddress,
        classification: targetClassification,
        forgedStrategy: calibratedStrategy,
        adaptationFactors: [
          'capital-scaling',
          'gas-optimization',
          'slippage-adjustment',
          'timing-calibration',
          'risk-mitigation'
        ],
        expectedPerformance: {
          winRate: bestPerformer.winRate * 0.85,
          profitPotential: this.scaleProfitPotential(bestPerformer.totalPnl, capitalAvailable),
          riskLevel: this.assessForgedRiskLevel(bestPerformer, calibratedStrategy)
        },
        executionParameters: {
          capitalAllocated: capitalAvailable,
          maxSlippage: calibratedStrategy.slippageTolerance,
          gasLimit: calibratedStrategy.gasEstimate,
          executionTimeWindow: calibratedStrategy.timeWindow,
          riskChecks: ['flash-loan-safety', 'liquidity-depth', 'price-impact']
        },
        perfectMatchScore,
        learningCurveData
      };

      // Cache the forged strategy
      this.forgedStrategiesCache.set(`${targetClassification}-${Date.now()}`, forgedStrategy);

      console.log(`Strategy forged successfully: ${targetClassification} from ${bestPerformer.walletAddress}`);
      return forgedStrategy;

    } catch (error) {
      console.error('Strategy forging failed:', error);
      throw error;
    }
  }

  /**
   * Identify top performers for a specific strategy classification
   */
  async identifyTopPerformers(classification) {
    const cacheKey = `top-performers-${classification}`;

    // Check cache first
    const cached = this.topPerformersCache.get(cacheKey);
    if (cached && Date.now() - (cached[0]?.lastAnalyzed?.getTime() || 0) < this.CACHE_TTL) {
      return cached;
    }

    try {
      const prompt = `IDENTIFY TOP PERFORMERS FOR STRATEGY CLASSIFICATION: ${classification}

Based on blockchain analysis and performance metrics, identify the top 5 wallets that excel at this strategy:

${this.getStrategyDefinition(classification)}

CRITERIA FOR TOP PERFORMERS:
- Win rate > 75%
- Total PnL > $100K
- Consistent performance over 30+ days
- Low risk profile
- High confidence classification

Return JSON array of top performers with their metrics.`;

      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const topPerformers = JSON.parse(text.trim() || "[]");

      // Add lastAnalyzed timestamp
      topPerformers.forEach((performer) => {
        performer.lastAnalyzed = new Date();
      });

      // Sort by win rate and cache
      topPerformers.sort((a, b) => b.winRate - a.winRate);
      this.topPerformersCache.set(cacheKey, topPerformers);

      return topPerformers;

    } catch (error) {
      console.error('Top performer identification failed:', error);
      return [];
    }
  }

  /**
   * Reverse engineer a top performer's strategy
   */
  async reverseEngineerStrategy(performer, marketConditions) {
    try {
      const prompt = `REVERSE ENGINEER TOP PERFORMER STRATEGY

WALLET: ${performer.walletAddress}
CLASSIFICATION: ${performer.classification}
WIN RATE: ${performer.winRate}%
TOTAL PNL: ${performer.totalPnl}
PERFORMANCE METRICS: ${JSON.stringify(performer.performanceMetrics)}

MARKET CONDITIONS: ${JSON.stringify(marketConditions)}

REVERSE ENGINEER their exact strategy parameters:
1. Entry/exit timing
2. Position sizing
3. Risk management
4. Execution methodology
5. Profit taking rules

Return the precise strategy they use for maximum replication accuracy.`;

      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const strategy = JSON.parse(text.trim() || "{}");

      console.log(`Strategy reverse engineered for ${performer.walletAddress}`);
      return strategy;

    } catch (error) {
      console.error('Strategy reverse engineering failed:', error);
      return this.getDefaultStrategy(performer.classification);
    }
  }

  /**
   * Adapt strategy for our execution environment
   */
  async adaptStrategyForExecution(baseStrategy, capitalAvailable, marketConditions) {
    try {
      const prompt = `ADAPT STRATEGY FOR EXECUTION ENVIRONMENT

BASE STRATEGY: ${JSON.stringify(baseStrategy)}
CAPITAL AVAILABLE: ${capitalAvailable}
MARKET CONDITIONS: ${JSON.stringify(marketConditions)}

ADAPTATIONS NEEDED:
1. Scale position size to available capital
2. Adjust slippage for current market volatility
3. Optimize gas pricing for current network conditions
4. Calibrate timing for our execution speed
5. Adjust risk parameters for our risk tolerance

Return the adapted strategy parameters.`;

      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const adapted = JSON.parse(text.trim() || "{}");

      return {
        ...baseStrategy,
        ...adapted,
        profitPotential: adapted.profitPotential || baseStrategy.profitPotential,
        gasEstimate: adapted.gasEstimate || baseStrategy.gasEstimate,
        slippageTolerance: adapted.slippageTolerance || baseStrategy.slippageTolerance
      };

    } catch (error) {
      console.error('Strategy adaptation failed:', error);
      return baseStrategy;
    }
  }

  /**
   * Calibrate risk parameters based on performer and our constraints
   */
  async calibrateRiskParameters(strategy, performer) {
    // Adjust risk parameters based on performer's risk profile
    const riskMultiplier = performer.riskRating === 'LOW' ? 0.8 :
                          performer.riskRating === 'MEDIUM' ? 1.0 :
                          performer.riskRating === 'HIGH' ? 1.2 : 1.5;

    return {
      ...strategy,
      slippageTolerance: Math.min(strategy.slippageTolerance * riskMultiplier, 0.05),
      riskLevel: this.adjustRiskLevel(strategy.riskLevel, riskMultiplier)
    };
  }

  /**
   * Get strategy definition for AI analysis
   */
  getStrategyDefinition(classification) {
    const definitions = {
      'THE GHOST': 'Private Order Flow - Transactions appear in blocks without prior mempool detection using Flashbots Protect or private RPCs',
      'SLOT-0 SNIPER': 'Top-of-Block Priority - First transaction index (0-5) in the block using high gas priority fees',
      'BUNDLE MASTER': 'Sandwich & Atomic Batches - 3-transaction sequences (Buy -> Victim -> Sell) or multi-pool routing',
      'ATOMIC FLUX': 'Spatial Arbitrage - Buy Token A on DEX X, Sell Token A on DEX Y in the same transaction',
      'DARK RELAY': 'Just-In-Time Liquidity - Add Liq -> Swap executes -> Remove Liq (all in one block)',
      'HIVE SYMMETRY': 'Cluster/Copy Trading - Transaction timing correlates (<1s) with known alpha wallets',
      'DISCOVERY HUNT': 'Factory/Mempool Scanning - Interaction with contracts <5 minutes after deployment'
    };

    return definitions[classification] || 'Unknown strategy classification';
  }

  /**
   * Get default strategy if reverse engineering fails
   */
  getDefaultStrategy(classification) {
    const defaults = {
      'THE GHOST': {
        strategy: 'CROSS_DEX',
        confidence: 0.8,
        profitPotential: '2.5%',
        executionPath: ['Uniswap V3', 'SushiSwap'],
        gasEstimate: '250000',
        slippageTolerance: 0.003,
        timeWindow: '30',
        riskLevel: 'LOW',
        recommendedAction: 'EXECUTE'
      },
      'SLOT-0 SNIPER': {
        strategy: 'LIQUIDITY',
        confidence: 0.85,
        profitPotential: '1.8%',
        executionPath: ['Uniswap V3'],
        gasEstimate: '180000',
        slippageTolerance: 0.002,
        timeWindow: '15',
        riskLevel: 'MEDIUM',
        recommendedAction: 'EXECUTE'
      },
      'BUNDLE MASTER': {
        strategy: 'TRIANGULAR',
        confidence: 0.75,
        profitPotential: '3.2%',
        executionPath: ['Uniswap V3', 'SushiSwap', 'PancakeSwap'],
        gasEstimate: '350000',
        slippageTolerance: 0.005,
        timeWindow: '45',
        riskLevel: 'HIGH',
        recommendedAction: 'MONITOR'
      },
      'ATOMIC FLUX': {
        strategy: 'CROSS_DEX',
        confidence: 0.9,
        profitPotential: '1.2%',
        executionPath: ['Uniswap V3', 'Curve'],
        gasEstimate: '200000',
        slippageTolerance: 0.002,
        timeWindow: '20',
        riskLevel: 'LOW',
        recommendedAction: 'EXECUTE'
      },
      'DARK RELAY': {
        strategy: 'LIQUIDITY',
        confidence: 0.8,
        profitPotential: '4.1%',
        executionPath: ['Uniswap V3'],
        gasEstimate: '280000',
        slippageTolerance: 0.004,
        timeWindow: '25',
        riskLevel: 'MEDIUM',
        recommendedAction: 'EXECUTE'
      },
      'HIVE SYMMETRY': {
        strategy: 'STATISTICAL',
        confidence: 0.7,
        profitPotential: '2.8%',
        executionPath: ['Multiple DEXes'],
        gasEstimate: '300000',
        slippageTolerance: 0.003,
        timeWindow: '35',
        riskLevel: 'MEDIUM',
        recommendedAction: 'MONITOR'
      },
      'DISCOVERY HUNT': {
        strategy: 'YIELD',
        confidence: 0.6,
        profitPotential: '5.5%',
        executionPath: ['New Deployments'],
        gasEstimate: '220000',
        slippageTolerance: 0.006,
        timeWindow: '10',
        riskLevel: 'HIGH',
        recommendedAction: 'MONITOR'
      }
    };

    return defaults[classification] || defaults['THE GHOST'];
  }

  /**
   * Utility methods
   */
  scaleProfitPotential(originalPnl, capitalAvailable) {
    const originalValue = parseFloat(originalPnl.replace(/[$,M]/g, '')) * 1000000;
    const capitalValue = parseFloat(capitalAvailable);

    if (originalValue === 0) return '0%';

    const scaledProfit = (originalValue / capitalValue) * 100;
    return `${scaledProfit.toFixed(2)}%`;
  }

  assessForgedRiskLevel(performer, strategy) {
    let riskScore = 0;

    if (performer.riskRating === 'HIGH') riskScore += 2;
    if (performer.riskRating === 'CRITICAL') riskScore += 3;

    if (strategy.slippageTolerance > 0.02) riskScore += 1;
    if (strategy.riskLevel === 'HIGH') riskScore += 2;
    if (strategy.riskLevel === 'CRITICAL') riskScore += 3;

    if (riskScore >= 5) return 'CRITICAL';
    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 1) return 'MEDIUM';
    return 'LOW';
  }

  adjustRiskLevel(currentLevel, multiplier) {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === -1) return 'MEDIUM';

    const newIndex = Math.min(Math.floor(currentIndex * multiplier), levels.length - 1);
    return levels[newIndex];
  }

  /**
   * Get all forged strategies
   */
  getForgedStrategies() {
    return Array.from(this.forgedStrategiesCache.values());
  }

  /**
   * Calculate perfect match score for strategy selection
   */
  calculatePerfectMatchScore(performer, strategy, marketConditions) {
    let score = 0;

    // PROFIT/DAY MATCHING (50% weight)
    const profitMatchingScore = this.calculateProfitDayMatching(performer, strategy, marketConditions);
    score += profitMatchingScore * 0.50;

    // Execution capability (20% weight)
    const executionScore = this.calculateExecutionCapability(strategy);
    score += executionScore * 0.20;

    // Risk alignment (15% weight)
    const riskScore = this.calculateRiskAlignment(performer, strategy);
    score += riskScore * 0.15;

    // Market compatibility (15% weight)
    const marketScore = this.calculateMarketCompatibility(strategy, marketConditions);
    score += marketScore * 0.15;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate market compatibility score
   */
  calculateMarketCompatibility(strategy, marketConditions) {
    const volatility = marketConditions.volatility || 0.5;
    const liquidity = marketConditions.liquidity || 0.5;

    const volatilityMatch = strategy.timeWindow ? Math.min(parseInt(strategy.timeWindow) / 60, 1) : 0.5;
    const liquidityMatch = strategy.executionPath?.length > 1 ? liquidity : 1 - liquidity;

    return (volatilityMatch + liquidityMatch) / 2;
  }

  /**
   * Calculate execution capability score
   */
  calculateExecutionCapability(strategy) {
    const gasEfficiency = strategy.gasEstimate ? Math.min(500000 / parseInt(strategy.gasEstimate), 1) : 0.5;
    const slippageSafety = strategy.slippageTolerance ? Math.max(0, 1 - strategy.slippageTolerance * 10) : 0.5;

    return (gasEfficiency + slippageSafety) / 2;
  }

  /**
   * Calculate profit/day matching score
   */
  calculateProfitDayMatching(performer, strategy, marketConditions) {
    const performerMetrics = performer.performanceMetrics || {};
    const performerAvgDailyProfit = performerMetrics.avgDailyProfit || this.estimateDailyProfit(performer.totalPnl);
    const performerProfitConsistency = performerMetrics.profitConsistency || performer.winRate / 100;

    const strategyProfitPotential = this.calculateStrategyProfitPotential(strategy, marketConditions);
    const strategyExecutionFrequency = this.calculateExecutionFrequency(strategy);

    const profitMatchingRatio = strategyProfitPotential / performerAvgDailyProfit;
    const profitMatchScore = Math.min(profitMatchingRatio, 1.0);

    const consistencyMatchScore = this.calculateConsistencyMatch(strategy, performerProfitConsistency);

    return profitMatchScore * 0.7 + consistencyMatchScore * 0.3;
  }

  /**
   * Calculate strategy's profit potential
   */
  calculateStrategyProfitPotential(strategy, marketConditions) {
    const baseProfit = parseFloat(strategy.profitPotential?.replace('%', '') || '0') / 100;
    const marketMultiplier = marketConditions.volatility || 1.0;
    const liquidityMultiplier = marketConditions.liquidity || 1.0;

    return baseProfit * marketMultiplier * liquidityMultiplier;
  }

  /**
   * Calculate how often the strategy can execute
   */
  calculateExecutionFrequency(strategy) {
    const timeWindow = parseInt(strategy.timeWindow || '60');
    const executionsPerDay = Math.max(1, 1440 / timeWindow);

    const complexityMultiplier = strategy.executionPath?.length > 1 ? 0.7 : 1.0;

    return executionsPerDay * complexityMultiplier;
  }

  /**
   * Calculate consistency match
   */
  calculateConsistencyMatch(strategy, performerConsistency) {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const riskIndex = riskLevels.indexOf(strategy.riskLevel || 'MEDIUM');
    const strategyConsistency = Math.max(0.1, 1 - (riskIndex * 0.2));

    const slippageAdjustment = Math.max(0, 1 - (strategy.slippageTolerance || 0) * 5);

    const strategyConsistencyScore = strategyConsistency * slippageAdjustment;

    return 1 - Math.abs(strategyConsistencyScore - performerConsistency);
  }

  /**
   * Estimate daily profit
   */
  estimateDailyProfit(totalPnl) {
    const pnlValue = parseFloat(totalPnl.replace(/[$,M]/g, '')) * 1000000;
    const estimatedDays = 90;
    return pnlValue / estimatedDays;
  }

  /**
   * Calculate risk alignment score
   */
  calculateRiskAlignment(performer, strategy) {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const performerRiskIndex = riskLevels.indexOf(performer.riskRating);
    const strategyRiskIndex = riskLevels.indexOf(strategy.riskLevel || 'MEDIUM');

    const riskDifference = Math.abs(performerRiskIndex - strategyRiskIndex);
    return Math.max(0, 1 - riskDifference * 0.25);
  }

  /**
   * Update learning curve with execution results
   */
  updateLearningCurve(strategyId, executionResult) {
    const strategies = Array.from(this.forgedStrategiesCache.values());
    const strategy = strategies.find(s => s.forgedStrategy.strategy === strategyId);

    if (strategy) {
      strategy.learningCurveData.historicalPerformance.push(executionResult);
      strategy.learningCurveData.iterations++;

      this.trackStrategyDiscovery(strategy, executionResult);
      this.trackProfitDayProgression(strategy, executionResult);
      this.trackStrategyCombinations(strategy, executionResult);

      strategy.learningCurveData.confidenceScore = this.calculateUpdatedConfidence(strategy.learningCurveData);
      strategy.learningCurveData.lastUpdated = new Date();

      console.log(`Learning curve updated for strategy ${strategyId}: iterations=${strategy.learningCurveData.iterations}, discovered=${strategy.learningCurveData.discoveredStrategies.length}, confidence=${strategy.learningCurveData.confidenceScore}`);
    }
  }

  /**
   * Calculate updated confidence score
   */
  calculateUpdatedConfidence(learningData) {
    if (learningData.historicalPerformance.length === 0) return 0.5;

    const recentPerformances = learningData.historicalPerformance.slice(-10);
    const successRate = recentPerformances.filter(p => p.executionSuccess).length / recentPerformances.length;
    const avgProfit = recentPerformances.reduce((sum, p) => sum + p.profitLoss, 0) / recentPerformances.length;

    const profitScore = Math.max(0, Math.min(1, (avgProfit + 1000) / 2000));
    return successRate * 0.7 + profitScore * 0.3;
  }

  /**
   * Track strategy discovery
   */
  trackStrategyDiscovery(strategy, executionResult) {
    const existingVariant = strategy.learningCurveData.discoveredStrategies.find(
      v => v.baseStrategy === executionResult.strategyId
    );

    if (!existingVariant) {
      const variant = {
        variantId: `${executionResult.strategyId}-${Date.now()}`,
        baseStrategy: executionResult.strategyId,
        modifications: ['risk-adjusted', 'market-adapted', 'capital-scaled'],
        profitDayTarget: this.calculateProfitDayTarget(strategy),
        achievedProfitDay: executionResult.profitLoss,
        discoveryIteration: strategy.learningCurveData.iterations,
        marketConditions: executionResult.marketConditions,
        successRate: executionResult.executionSuccess ? 1.0 : 0.0
      };

      strategy.learningCurveData.discoveredStrategies.push(variant);
      console.log(`New strategy variant discovered: ${variant.variantId} at iteration ${variant.discoveryIteration}`);
    } else {
      const totalExecutions = strategy.learningCurveData.historicalPerformance.filter(
        h => h.strategyId === executionResult.strategyId
      ).length;
      const successfulExecutions = strategy.learningCurveData.historicalPerformance.filter(
        h => h.strategyId === executionResult.strategyId && h.executionSuccess
      ).length;

      existingVariant.successRate = successfulExecutions / totalExecutions;
      existingVariant.achievedProfitDay = Math.max(existingVariant.achievedProfitDay, executionResult.profitLoss);
    }
  }

  /**
   * Track profit/day progression
   */
  trackProfitDayProgression(strategy, executionResult) {
    const currentProfitDay = executionResult.profitLoss;
    const targetProfitDay = this.calculateProfitDayTarget(strategy);

    const milestones = [0.25, 0.5, 0.75, 1.0];
    const achievedMilestone = milestones.find(milestone =>
      currentProfitDay >= targetProfitDay * milestone &&
      !strategy.learningCurveData.profitDayProgression.some(p => p.achievedProfitDay >= targetProfitDay * milestone)
    );

    if (achievedMilestone) {
      const milestone = {
        milestoneId: `milestone-${achievedMilestone}-${Date.now()}`,
        targetProfitDay: targetProfitDay * achievedMilestone,
        achievedProfitDay: currentProfitDay,
        strategiesUsed: [executionResult.strategyId],
        iterationReached: strategy.learningCurveData.iterations,
        timestamp: new Date(),
        marketConditions: executionResult.marketConditions
      };

      strategy.learningCurveData.profitDayProgression.push(milestone);
      console.log(`Profit/day milestone reached: ${achievedMilestone * 100}% at iteration ${milestone.iterationReached}`);
    }
  }

  /**
   * Track strategy combinations
   */
  trackStrategyCombinations(strategy, executionResult) {
    const combinationId = `combo-${executionResult.strategyId}-${strategy.learningCurveData.iterations}`;

    const existingCombination = strategy.learningCurveData.strategyCombinations.find(
      c => c.combinationId === combinationId
    );

    if (!existingCombination) {
      const combination = {
        combinationId,
        strategies: [executionResult.strategyId],
        combinedProfitDay: executionResult.profitLoss,
        synergyMultiplier: 1.0,
        testedIterations: 1,
        successRate: executionResult.executionSuccess ? 1.0 : 0.0,
        lastTested: new Date()
      };

      strategy.learningCurveData.strategyCombinations.push(combination);
    } else {
      existingCombination.combinedProfitDay = Math.max(existingCombination.combinedProfitDay, executionResult.profitLoss);
      existingCombination.testedIterations++;
      existingCombination.lastTested = new Date();

      const successfulTests = strategy.learningCurveData.historicalPerformance.filter(
        h => h.strategyId === executionResult.strategyId && h.executionSuccess
      ).length;
      existingCombination.successRate = successfulTests / existingCombination.testedIterations;
    }
  }

  /**
   * Calculate profit/day target
   */
  calculateProfitDayTarget(strategy) {
    const expectedProfit = strategy.expectedPerformance.profitPotential;
    const profitValue = parseFloat(expectedProfit.replace('%', '')) / 100;
    return profitValue * 1000;
  }

  /**
   * Get learning metrics for dashboard display
   */
  getLearningMetrics() {
    const allStrategies = Array.from(this.forgedStrategiesCache.values());

    if (allStrategies.length === 0) {
      return {
        totalIterations: 0,
        discoveredStrategies: 0,
        perfectMatchScore: 0,
        confidenceScore: 0.5,
        learningRate: 0.1,
        profitDayProgression: [],
        strategyCombinations: [],
        historicalPerformance: []
      };
    }

    const totalIterations = allStrategies.reduce((sum, s) => sum + s.learningCurveData.iterations, 0);
    const totalDiscovered = allStrategies.reduce((sum, s) => sum + s.learningCurveData.discoveredStrategies.length, 0);
    const avgConfidence = allStrategies.reduce((sum, s) => sum + s.learningCurveData.confidenceScore, 0) / allStrategies.length;
    const avgPerfectMatch = allStrategies.reduce((sum, s) => sum + s.perfectMatchScore, 0) / allStrategies.length;

    const allProgression = allStrategies.flatMap(s => s.learningCurveData.profitDayProgression);
    const allCombinations = allStrategies.flatMap(s => s.learningCurveData.strategyCombinations);
    const allPerformance = allStrategies.flatMap(s => s.learningCurveData.historicalPerformance);

    return {
      totalIterations,
      discoveredStrategies: totalDiscovered,
      perfectMatchScore: avgPerfectMatch,
      confidenceScore: avgConfidence,
      learningRate: 0.1,
      profitDayProgression: allProgression.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      strategyCombinations: allCombinations.sort((a, b) => b.lastTested.getTime() - a.lastTested.getTime()),
      historicalPerformance: allPerformance.sort((a, b) => b.executionTime.getTime() - a.executionTime.getTime())
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.topPerformersCache.clear();
    this.forgedStrategiesCache.clear();
    console.log('Strategy forger caches cleared');
  }
}

module.exports = { StrategyForger };
