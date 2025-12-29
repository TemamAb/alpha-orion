import { ethers, BigNumber, providers } from 'ethers';
import { FlashLoanConfig } from './flash-loan-engine';

export interface RiskAssessment {
  score: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
  metrics: {
    gasRisk: number;
    slippageRisk: number;
    liquidityRisk: number;
    frontrunRisk: number;
    sandwichRisk: number;
    volatilityRisk: number;
  };
}

export interface RiskMetrics {
  gasPrice: BigNumber;
  mempoolSize: number;
  liquidity: BigNumber;
  priceImpact: number;
  volatility: number;
  blockTime: number;
}

export class RiskManager {
  private provider: providers.JsonRpcProvider;
  private config: FlashLoanConfig;
  private metricsHistory: RiskMetrics[] = [];
  private maxHistorySize: number = 100;

  constructor(provider: providers.JsonRpcProvider, config: FlashLoanConfig) {
    this.provider = provider;
    this.config = config;
    
    // Start metrics collection
    this.collectMetricsPeriodically();
  }

  async assess(
    asset: string,
    amount: BigNumber,
    route?: any
  ): Promise<RiskAssessment> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const metrics = await this.getCurrentMetrics();
    
    let score = 100;
    
    // 1. Gas Price Risk
    if (metrics.gasPrice.gt(this.config.maxGasPrice)) {
      const risk = 30;
      score -= risk;
      issues.push(`High gas price: ${ethers.utils.formatUnits(metrics.gasPrice, 'gwei')} gwei`);
      recommendations.push('Wait for lower gas prices or increase maxGasPrice config');
    }
    
    // 2. Liquidity Risk
    if (metrics.liquidity.lt(amount.mul(2))) {
      const risk = 40;
      score -= risk;
      issues.push(`Insufficient liquidity: ${ethers.utils.formatEther(metrics.liquidity)} vs ${ethers.utils.formatEther(amount)}`);
      recommendations.push('Reduce loan amount or choose different asset');
    }
    
    // 3. Price Impact Risk
    if (metrics.priceImpact > 0.01) { // 1% price impact
      const risk = Math.min(50, metrics.priceImpact * 100);
      score -= risk;
      issues.push(`High price impact: ${(metrics.priceImpact * 100).toFixed(2)}%`);
      recommendations.push('Split trade into smaller amounts or use different route');
    }
    
    // 4. Frontrun Risk
    if (metrics.mempoolSize > 100) {
      const risk = 20;
      score -= risk;
      issues.push(`High mempool activity: ${metrics.mempoolSize} pending transactions`);
      recommendations.push('Use private transactions or adjust timing');
    }
    
    // 5. Volatility Risk
    if (metrics.volatility > 0.05) { // 5% volatility
      const risk = Math.min(30, metrics.volatility * 100);
      score -= risk;
      issues.push(`High volatility: ${(metrics.volatility * 100).toFixed(2)}%`);
      recommendations.push('Wait for market to stabilize or reduce position size');
    }
    
    // 6. Block Time Risk (for Neon EVM)
    if (metrics.blockTime > 2) { // 2 seconds
      const risk = 15;
      score -= risk;
      issues.push(`Slow block time: ${metrics.blockTime.toFixed(2)} seconds`);
      recommendations.push('Consider network congestion');
    }
    
    // 7. Route Complexity Risk
    if (route && route.trades && route.trades.length > 3) {
      const risk = 10;
      score -= risk;
      issues.push('Complex route increases failure risk');
      recommendations.push('Simplify arbitrage route');
    }
    
    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 80) level = 'LOW';
    else if (score >= 60) level = 'MEDIUM';
    else if (score >= 40) level = 'HIGH';
    else level = 'CRITICAL';
    
    // Calculate risk metrics
    const riskMetrics = {
      gasRisk: this.calculateGasRisk(metrics.gasPrice),
      slippageRisk: this.calculateSlippageRisk(metrics.priceImpact),
      liquidityRisk: this.calculateLiquidityRisk(metrics.liquidity, amount),
      frontrunRisk: this.calculateFrontrunRisk(metrics.mempoolSize),
      sandwichRisk: this.calculateSandwichRisk(route),
      volatilityRisk: this.calculateVolatilityRisk(metrics.volatility)
    };
    
    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      issues,
      recommendations,
      metrics: riskMetrics
    };
  }

  async getCurrentMetrics(): Promise<RiskMetrics> {
    const [
      gasPrice,
      block,
      historicalBlocks
    ] = await Promise.all([
      this.provider.getGasPrice(),
      this.provider.getBlock('latest'),
      this.getHistoricalBlocks(10)
    ]);
    
    // Calculate volatility from historical prices
    const volatility = await this.calculateVolatility(historicalBlocks);
    
    // Estimate mempool size (simplified)
    const mempoolSize = await this.estimateMempoolSize();
    
    // Get liquidity for major assets (simplified)
    const liquidity = await this.estimateLiquidity();
    
    // Calculate price impact (simplified)
    const priceImpact = await this.estimatePriceImpact();
    
    // Calculate average block time
    const blockTime = this.calculateAverageBlockTime(historicalBlocks);
    
    return {
      gasPrice,
      mempoolSize,
      liquidity,
      priceImpact,
      volatility,
      blockTime
    };
  }

  shouldProceed(assessment: RiskAssessment): boolean {
    // Decision logic based on risk assessment
    if (assessment.level === 'CRITICAL') return false;
    if (assessment.level === 'HIGH' && assessment.score < 50) return false;
    
    // Check individual risk metrics
    if (assessment.metrics.gasRisk > 80) return false;
    if (assessment.metrics.liquidityRisk > 90) return false;
    if (assessment.metrics.sandwichRisk > 70) return false;
    
    return true;
  }

  getRiskThresholds() {
    return {
      maxGasPrice: this.config.maxGasPrice,
      minLiquidityRatio: 2, // 2x loan amount
      maxPriceImpact: 0.01, // 1%
      maxVolatility: 0.05, // 5%
      maxMempoolSize: 100,
      maxBlockTime: 2 // seconds
    };
  }

  private async collectMetricsPeriodically(): Promise<void> {
    setInterval(async () => {
      try {
        const metrics = await this.getCurrentMetrics();
        this.metricsHistory.push(metrics);
        
        // Keep history size limited
        if (this.metricsHistory.length > this.maxHistorySize) {
          this.metricsHistory.shift();
        }
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, 15000); // Every 15 seconds
  }

  private async getHistoricalBlocks(count: number): Promise<any[]> {
    const latestBlock = await this.provider.getBlockNumber();
    const blockPromises = [];
    
    for (let i = 0; i < count; i++) {
      blockPromises.push(this.provider.getBlock(latestBlock - i));
    }
    
    return Promise.all(blockPromises);
  }

  private async calculateVolatility(blocks: any[]): Promise<number> {
    if (blocks.length < 2) return 0;
    
    // Simplified volatility calculation
    // In production, use actual price data from oracles
    const baseVolatility = 0.02; // 2% base volatility
    
    // Adjust based on block time variance
    const blockTimes = blocks.map((b, i) => {
      if (i === 0) return 0;
      return b.timestamp - blocks[i - 1].timestamp;
    }).filter(t => t > 0);
    
    if (blockTimes.length === 0) return baseVolatility;
    
    const avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;
    const variance = blockTimes.reduce((a, b) => a + Math.pow(b - avgBlockTime, 2), 0) / blockTimes.length;
    const blockTimeVolatility = Math.sqrt(variance) / avgBlockTime;
    
    return baseVolatility + blockTimeVolatility * 0.5;
  }

  private async estimateMempoolSize(): Promise<number> {
    // Simplified mempool estimation
    // In production, use actual mempool monitoring
    try {
      const block = await this.provider.getBlock('latest');
      return block.transactions.length * 3; // Estimate
    } catch (error) {
      return 50; // Default
    }
  }

  private async estimateLiquidity(): Promise<BigNumber> {
    // Simplified liquidity estimation
    // In production, query DEX pools
    return ethers.utils.parseEther('1000000'); // 1M ETH default
  }

  private async estimatePriceImpact(): Promise<number> {
    // Simplified price impact estimation
    return 0.005; // 0.5% default
  }

  private calculateAverageBlockTime(blocks: any[]): number {
    if (blocks.length < 2) return 2.0; // Default Neon EVM block time
    
    let totalTime = 0;
    for (let i = 1; i < blocks.length; i++) {
      totalTime += blocks[i].timestamp - blocks[i - 1].timestamp;
    }
    
    return totalTime / (blocks.length - 1);
  }

  private calculateGasRisk(gasPrice: BigNumber): number {
    const maxGas = this.config.maxGasPrice;
    const ratio = gasPrice.mul(100).div(maxGas).toNumber() / 100;
    return Math.min(100, ratio * 100);
  }

  private calculateSlippageRisk(priceImpact: number): number {
    return Math.min(100, priceImpact * 10000); // Convert to basis points
  }

  private calculateLiquidityRisk(liquidity: BigNumber, amount: BigNumber): number {
    if (liquidity.isZero()) return 100;
    
    const ratio = amount.mul(100).div(liquidity).toNumber() / 100;
    return Math.min(100, ratio * 200); // 50% utilization = 100 risk
  }

  private calculateFrontrunRisk(mempoolSize: number): number {
    return Math.min(100, mempoolSize);
  }

  private calculateSandwichRisk(route: any): number {
    if (!route || !route.trades) return 50; // Default medium risk
    
    // Complex routes are more susceptible to sandwich attacks
    let risk = 30; // Base risk
    
    if (route.trades.length > 2) risk += 20;
    if (route.trades.some((t: any) => t.amountIn.gt(ethers.utils.parseEther('100')))) risk += 30;
    
    return Math.min(100, risk);
  }

  private calculateVolatilityRisk(volatility: number): number {
    return Math.min(100, volatility * 2000); // 5% volatility = 100 risk
  }

  getMetricsHistory(): RiskMetrics[] {
    return [...this.metricsHistory];
  }

  getTrendAnalysis(): { trend: 'improving' | 'worsening' | 'stable'; change: number } {
    if (this.metricsHistory.length < 2) {
      return { trend: 'stable', change: 0 };
    }
    
    const recent = this.metricsHistory.slice(-5);
    const older = this.metricsHistory.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) {
      return { trend: 'stable', change: 0 };
    }
    
    // Calculate average risk score for each period
    const recentAvg = this.calculateAverageRisk(recent);
    const olderAvg = this.calculateAverageRisk(older);
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return { trend: 'worsening', change };
    if (change < -10) return { trend: 'improving', change };
    return { trend: 'stable', change };
  }

  private calculateAverageRisk(metrics: RiskMetrics[]): number {
    if (metrics.length === 0) return 50;
    
    let totalRisk = 0;
    metrics.forEach(m => {
      totalRisk += this.assessMetrics(m).score;
    });
    
    return totalRisk / metrics.length;
  }

  private assessMetrics(metrics: RiskMetrics): { score: number } {
    // Simplified assessment for trend analysis
    let score = 100;
    
    if (metrics.gasPrice.gt(this.config.maxGasPrice)) score -= 30;
    if (metrics.priceImpact > 0.01) score -= 20;
    if (metrics.volatility > 0.05) score -= 15;
    
    return { score: Math.max(0, score) };
  }
}
