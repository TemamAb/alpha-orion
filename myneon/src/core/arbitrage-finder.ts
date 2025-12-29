import { ethers, BigNumber, Contract, providers } from 'ethers';
import { UniswapV3PoolABI } from '../abi/UniswapV3Pool';
import { SushiswapRouterABI } from '../abi/SushiswapRouter';
import { PriceOracle } from './price-oracle';

export interface Trade {
  dex: 'UNISWAP_V3' | 'SUSHISWAP' | 'CURVE' | 'BALANCER';
  pool: string;
  fromToken: string;
  toToken: string;
  amountIn: BigNumber;
  expectedAmountOut: BigNumber;
  fee?: number; // For Uniswap V3 (500, 3000, 10000)
  path?: string[]; // For Sushiswap
}

export interface ArbitrageRoute {
  id: string;
  asset: string;
  amount: BigNumber;
  expectedProfit: BigNumber;
  trades: Trade[];
  gasEstimate: BigNumber;
  timestamp: number;
  confidence: number; // 0-100
}

export interface DexPool {
  address: string;
  token0: string;
  token1: string;
  fee: number;
  dex: 'UNISWAP_V3' | 'SUSHISWAP';
  liquidity: BigNumber;
  volume24h: BigNumber;
}

export class ArbitrageFinder {
  private provider: providers.JsonRpcProvider;
  private priceOracle: PriceOracle;
  private pools: Map<string, DexPool> = new Map();
  private lastScan: number = 0;
  private scanInterval: number = 30000; // 30 seconds

  // Real DEX addresses (Neon EVM)
  private readonly CONFIG = {
    UNISWAP_V3: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
    },
    SUSHISWAP: {
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
    }
  };

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
    this.priceOracle = new PriceOracle(provider);
    
    // Initialize with known pools
    this.initializePools();
    
    // Start background pool updates
    this.updatePoolsPeriodically();
  }

  async findOptimalRoute(
    asset: string,
    amount: BigNumber
  ): Promise<ArbitrageRoute | null> {
    const allRoutes = await this.scanAllOpportunities();
    
    // Filter for specific asset and amount
    const filtered = allRoutes.filter(route => 
      route.asset.toLowerCase() === asset.toLowerCase() &&
      route.amount.eq(amount)
    );
    
    if (filtered.length === 0) {
      return null;
    }
    
    // Return route with highest profit
    return filtered.reduce((best, current) => 
      current.expectedProfit.gt(best.expectedProfit) ? current : best
    );
  }

  async scanAllOpportunities(): Promise<ArbitrageRoute[]> {
    const now = Date.now();
    if (now - this.lastScan < this.scanInterval) {
      // Return cached results if recent scan
      return this.getCachedOpportunities();
    }
    
    this.lastScan = now;
    const routes: ArbitrageRoute[] = [];
    
    // 1. Cross-DEX arbitrage (Uniswap vs Sushiswap)
    const crossDexRoutes = await this.findCrossDexArbitrage();
    routes.push(...crossDexRoutes);
    
    // 2. Triangular arbitrage within same DEX
    const triangularRoutes = await this.findTriangularArbitrage();
    routes.push(...triangularRoutes);
    
    // 3. Multi-hop arbitrage
    const multiHopRoutes = await this.findMultiHopArbitrage();
    routes.push(...multiHopRoutes);
    
    // 4. Calculate confidence scores
    routes.forEach(route => {
      route.confidence = this.calculateConfidence(route);
    });
    
    // Cache results
    this.cacheOpportunities(routes);
    
    // Filter out low-confidence routes
    return routes.filter(route => 
      route.confidence >= 70 && 
      route.expectedProfit.gt(ethers.utils.parseEther('0.01'))
    ).sort((a, b) => b.expectedProfit.sub(a.expectedProfit).toNumber());
  }

  async findCrossDexArbitrage(): Promise<ArbitrageRoute[]> {
    const routes: ArbitrageRoute[] = [];
    const tokens = await this.getActiveTokens();
    
    for (const token of tokens) {
      // Compare prices between Uniswap and Sushiswap
      const [uniPrice, sushiPrice] = await Promise.all([
        this.getPrice(this.CONFIG.UNISWAP_V3.router, token, 'WNEON', ethers.utils.parseEther('1')),
        this.getPrice(this.CONFIG.SUSHISWAP.router, token, 'WNEON', ethers.utils.parseEther('1'))
      ]);
      
      // Check for price discrepancy (>0.3%)
      const priceDiff = uniPrice.sub(sushiPrice).abs();
      const avgPrice = uniPrice.add(sushiPrice).div(2);
      const diffPercentage = priceDiff.mul(10000).div(avgPrice); // Basis points
      
      if (diffPercentage.gt(30)) { // 0.3% difference
        const isUniCheaper = uniPrice.lt(sushiPrice);
        
        const route: ArbitrageRoute = {
          id: `crossdex_${Date.now()}_${token}`,
          asset: token,
          amount: ethers.utils.parseEther('10'),
          expectedProfit: priceDiff,
          trades: [
            {
              dex: isUniCheaper ? 'SUSHISWAP' : 'UNISWAP_V3',
              pool: isUniCheaper ? this.CONFIG.SUSHISWAP.router : this.CONFIG.UNISWAP_V3.router,
              fromToken: token,
              toToken: 'WNEON',
              amountIn: ethers.utils.parseEther('10'),
              expectedAmountOut: isUniCheaper ? sushiPrice : uniPrice
            },
            {
              dex: isUniCheaper ? 'UNISWAP_V3' : 'SUSHISWAP',
              pool: isUniCheaper ? this.CONFIG.UNISWAP_V3.router : this.CONFIG.SUSHISWAP.router,
              fromToken: 'WNEON',
              toToken: token,
              amountIn: isUniCheaper ? sushiPrice : uniPrice,
              expectedAmountOut: isUniCheaper ? uniPrice : sushiPrice
            }
          ],
          gasEstimate: await this.estimateGas(2),
          timestamp: Date.now(),
          confidence: 85
        };
        
        routes.push(route);
      }
    }
    
    return routes;
  }

  async findTriangularArbitrage(): Promise<ArbitrageRoute[]> {
    const routes: ArbitrageRoute[] = [];
    
    // Get all pools with common tokens
    const triangleCandidates = this.findTriangleCandidates();
    
    for (const triangle of triangleCandidates) {
      // Calculate if triangular arbitrage is possible
      const route = await this.calculateTriangleRoute(triangle);
      if (route) {
        routes.push(route);
      }
    }
    
    return routes;
  }

  async findMultiHopArbitrage(): Promise<ArbitrageRoute[]> {
    // Implement multi-hop arbitrage detection
    return [];
  }

  async getPoolReserves(poolAddress: string): Promise<{ reserve0: BigNumber; reserve1: BigNumber }> {
    try {
      const pool = new Contract(poolAddress, UniswapV3PoolABI, this.provider);
      const slot0 = await pool.slot0();
      const liquidity = await pool.liquidity();
      
      // Calculate reserves from sqrtPriceX96 and liquidity
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      const price = sqrtPriceX96.pow(2).div(BigNumber.from(2).pow(192));
      
      // Simplified calculation - implement proper reserve calculation
      return {
        reserve0: liquidity,
        reserve1: liquidity.mul(price).div(ethers.utils.parseEther('1'))
      };
    } catch (error) {
      console.error('Failed to get pool reserves:', error);
      return { reserve0: ethers.constants.Zero, reserve1: ethers.constants.Zero };
    }
  }

  async getPrice(
    router: string,
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): Promise<BigNumber> {
    try {
      // Use Uniswap V3 Quoter for accurate price quotes
      const quoter = new Contract(
        this.CONFIG.UNISWAP_V3.quoter,
        ['function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'],
        this.provider
      );
      
      const amountOut = await quoter.callStatic.quoteExactInputSingle(
        tokenIn,
        tokenOut,
        3000, // 0.3% fee tier
        amount,
        0 // sqrtPriceLimitX96
      );
      
      return amountOut;
    } catch (error) {
      // Fallback to simple calculation
      console.warn('Quoter failed, using fallback:', error);
      return this.priceOracle.getPrice(tokenIn, tokenOut, amount);
    }
  }

  async getLiquidity(poolAddress: string): Promise<BigNumber> {
    try {
      const pool = new Contract(poolAddress, UniswapV3PoolABI, this.provider);
      return await pool.liquidity();
    } catch (error) {
      return ethers.constants.Zero;
    }
  }

  private initializePools(): void {
    // Initialize with known Neon EVM pools
    const initialPools: DexPool[] = [
      {
        address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
        token0: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        fee: 3000,
        dex: 'UNISWAP_V3',
        liquidity: ethers.constants.Zero,
        volume24h: ethers.constants.Zero
      }
      // Add more pools as needed
    ];
    
    initialPools.forEach(pool => {
      this.pools.set(pool.address, pool);
    });
  }

  private async updatePoolsPeriodically(): Promise<void> {
    setInterval(async () => {
      try {
        await this.updatePoolData();
      } catch (error) {
        console.error('Failed to update pools:', error);
      }
    }, 60000); // Update every minute
  }

  private async updatePoolData(): Promise<void> {
    for (const [address, pool] of this.pools) {
      try {
        const liquidity = await this.getLiquidity(address);
        pool.liquidity = liquidity;
        this.pools.set(address, pool);
      } catch (error) {
        // Skip failed updates
      }
    }
  }

  private async getActiveTokens(): Promise<string[]> {
    // Return actively traded tokens
    return [
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
      '0x5f0155d08eF4aaE2B500AeBdA368Eb6374B6e9c1', // USDC (Neon)
      '0x94C7d657f1eBD0A6e8b4DddC2cB0E6B7b3f8aB17', // USDT (Neon)
      '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'  // DAI
    ];
  }

  private async estimateGas(numSwaps: number): Promise<BigNumber> {
    const gasPrice = await this.provider.getGasPrice();
    const gasPerSwap = BigNumber.from(150000); // Approximate gas per swap
    return gasPrice.mul(gasPerSwap.mul(numSwaps));
  }

  private findTriangleCandidates(): Array<[DexPool, DexPool, DexPool]> {
    const candidates: Array<[DexPool, DexPool, DexPool]> = [];
    const poolArray = Array.from(this.pools.values());
    
    // Simple implementation - find pools that form triangles
    for (let i = 0; i < poolArray.length; i++) {
      for (let j = i + 1; j < poolArray.length; j++) {
        for (let k = j + 1; k < poolArray.length; k++) {
          const poolA = poolArray[i];
          const poolB = poolArray[j];
          const poolC = poolArray[k];
          
          // Check if pools share tokens to form a triangle
          if (this.canFormTriangle(poolA, poolB, poolC)) {
            candidates.push([poolA, poolB, poolC]);
          }
        }
      }
    }
    
    return candidates;
  }

  private canFormTriangle(poolA: DexPool, poolB: DexPool, poolC: DexPool): boolean {
    const tokens = new Set([
      poolA.token0, poolA.token1,
      poolB.token0, poolB.token1,
      poolC.token0, poolC.token1
    ]);
    
    return tokens.size === 3; // Triangle requires exactly 3 unique tokens
  }

  private async calculateTriangleRoute(
    triangle: [DexPool, DexPool, DexPool]
  ): Promise<ArbitrageRoute | null> {
    // Implement triangular arbitrage calculation
    return null;
  }

  private calculateConfidence(route: ArbitrageRoute): number {
    let confidence = 100;
    
    // Reduce confidence based on factors
    if (route.gasEstimate.gt(ethers.utils.parseUnits('0.1', 'ether'))) {
      confidence -= 20;
    }
    
    if (route.trades.length > 3) {
      confidence -= 15;
    }
    
    // Check liquidity for each trade
    route.trades.forEach(trade => {
      const pool = this.pools.get(trade.pool);
      if (pool && pool.liquidity.lt(ethers.utils.parseEther('10000'))) {
        confidence -= 10;
      }
    });
    
    return Math.max(0, Math.min(100, confidence));
  }

  private cacheOpportunities(routes: ArbitrageRoute[]): void {
    // Cache implementation
    localStorage.setItem('arbitrage_cache', JSON.stringify({
      timestamp: Date.now(),
      routes: routes.map(r => ({
        ...r,
        amount: r.amount.toString(),
        expectedProfit: r.expectedProfit.toString(),
        gasEstimate: r.gasEstimate.toString()
      }))
    }));
  }

  private getCachedOpportunities(): ArbitrageRoute[] {
    try {
      const cached = localStorage.getItem('arbitrage_cache');
      if (!cached) return [];
      
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > 60000) return []; // Cache expired
      
      return data.routes.map((r: any) => ({
        ...r,
        amount: BigNumber.from(r.amount),
        expectedProfit: BigNumber.from(r.expectedProfit),
        gasEstimate: BigNumber.from(r.gasEstimate)
      }));
    } catch (error) {
      return [];
    }
  }
}
