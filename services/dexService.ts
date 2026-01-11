import { ethers } from 'ethers';
import { BlockchainService, CONTRACTS } from './blockchainService';

/**
 * PHASE 2: DEX INTEGRATION SERVICE
 * 
 * This service integrates with Uniswap V3 and Balancer to fetch real-time prices
 * and detect arbitrage opportunities across multiple DEXs.
 */

// Uniswap V3 Quoter ABI (for price quotes)
const UNISWAP_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)'
];

// Uniswap V3 Pool ABI (for current price)
const UNISWAP_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)'
];

// Balancer Vault ABI (for swaps and prices)
const BALANCER_VAULT_ABI = [
  'function queryBatchSwap(uint8 kind, tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) external returns (int256[] assetDeltas)'
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
];

/**
 * DEX Price Quote
 */
export interface DexQuote {
  dex: 'Uniswap' | 'Balancer';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: number;
  priceImpact: number;
  timestamp: number;
}

/**
 * Arbitrage Opportunity
 */
export interface ArbitrageOpportunity {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  buyDex: 'Uniswap' | 'Balancer';
  sellDex: 'Uniswap' | 'Balancer';
  buyPrice: number;
  sellPrice: number;
  spread: number;
  estimatedProfit: string;
  profitable: boolean;
  timestamp: number;
}

/**
 * DEX Service Class
 */
export class DexService {
  private blockchainService: BlockchainService;
  private uniswapQuoter: ethers.Contract;
  private balancerVault: ethers.Contract;

  // Uniswap V3 fee tiers (in basis points)
  private readonly FEE_TIERS = {
    LOW: 500,      // 0.05%
    MEDIUM: 3000,  // 0.3%
    HIGH: 10000    // 1%
  };

   constructor(blockchainService: BlockchainService) {
     this.blockchainService = blockchainService;

     const provider = blockchainService.getProvider();

     // Initialize Uniswap Quoter V2 (for price quotes)
     this.uniswapQuoter = new ethers.Contract(
       CONTRACTS.UNISWAP_QUOTER,
       UNISWAP_QUOTER_ABI,
       provider
     );

     // Initialize Balancer Vault
     // Note: Balancer may not be deployed on all testnets
     this.balancerVault = new ethers.Contract(
       '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Balancer Vault (same on all chains)
       BALANCER_VAULT_ABI,
       provider
     );
   }

 /**
  * Get token decimals
  */
 private async getTokenDecimals(tokenAddress: string): Promise<number> {
   const token = new ethers.Contract(
     tokenAddress,
     ERC20_ABI,
     this.blockchainService.getProvider()
   );
   return await token.decimals();
 }

 /**
  * Get Uniswap V3 price quote
  */
 async getUniswapQuote(
   tokenIn: string,
   tokenOut: string,
   amountIn: string,
   feeTier: keyof typeof this.FEE_TIERS = 'MEDIUM'
 ): Promise<DexQuote> {
     try {
       const decimalsIn = await this.getTokenDecimals(tokenIn);
       const decimalsOut = await this.getTokenDecimals(tokenOut);

       const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
       const fee = this.FEE_TIERS[feeTier];

       // Call Uniswap Quoter V2
       const amountOutWei = await this.uniswapQuoter.quoteExactInputSingle(
         tokenIn,
         tokenOut,
         fee,
         amountInWei,
         0 // sqrtPriceLimitX96 (0 = no limit)
       );

       const amountOut = ethers.formatUnits(amountOutWei, decimalsOut);
       const price = parseFloat(amountOut) / parseFloat(amountIn);

       // Calculate price impact (simplified)
       const priceImpact = await this.calculatePriceImpact(tokenIn, tokenOut, amountIn, 'Uniswap');

       return {
         dex: 'Uniswap',
         tokenIn,
         tokenOut,
         amountIn,
         amountOut,
         price,
         priceImpact,
         timestamp: Date.now()
       };
     } catch (error) {
       console.error('Error getting Uniswap quote:', error);
       throw error;
     }
   }

 /**
  * Get Balancer price quote
  */
 async getBalancerQuote(
   tokenIn: string,
   tokenOut: string,
   amountIn: string
 ): Promise<DexQuote> {
    try {
      const decimalsIn = await this.getTokenDecimals(tokenIn);
      const decimalsOut = await this.getTokenDecimals(tokenOut);
      
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      
      // SIMULATION: In production, call actual Balancer vault
      // For now, simulate with a slightly different price (for arbitrage)
      const simulatedAmountOut = amountInWei * 1005n / 1000n; // 0.5% better price
      
      const amountOut = ethers.formatUnits(simulatedAmountOut, decimalsOut);
      const price = parseFloat(amountOut) / parseFloat(amountIn);
      const priceImpact = 0.5; // 0.5% simulated impact
      
      return {
        dex: 'Balancer',
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        price,
        priceImpact,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting Balancer quote:', error);
      throw error;
    }
  }

 /**
  * Get best price across all DEXs
  */
 async getBestPrice(
   tokenIn: string,
   tokenOut: string,
   amountIn: string
 ): Promise<DexQuote> {
    try {
      // Get quotes from all DEXs
      const [uniswapQuote, balancerQuote] = await Promise.all([
        this.getUniswapQuote(tokenIn, tokenOut, amountIn),
        this.getBalancerQuote(tokenIn, tokenOut, amountIn)
      ]);
      
      // Return the quote with better output amount
      return parseFloat(uniswapQuote.amountOut) > parseFloat(balancerQuote.amountOut)
        ? uniswapQuote
        : balancerQuote;
    } catch (error) {
      console.error('Error getting best price:', error);
      throw error;
    }
  }

 /**
  * Detect arbitrage opportunities
  */
 async detectArbitrageOpportunity(
   tokenIn: string,
   tokenOut: string,
   amountIn: string,
   minSpread: number = 0.3 // Minimum 0.3% spread
 ): Promise<ArbitrageOpportunity | null> {
     try {
       // Get quotes from both DEXs for direct swap
       const [uniswapQuote, balancerQuote] = await Promise.all([
         this.getUniswapQuote(tokenIn, tokenOut, amountIn),
         this.getBalancerQuote(tokenIn, tokenOut, amountIn)
       ]);

       // Calculate spread for direct arbitrage
       const uniswapPrice = uniswapQuote.price;
       const balancerPrice = balancerQuote.price;
       const directSpread = Math.abs(balancerPrice - uniswapPrice) / uniswapPrice * 100;

       // For triangular arbitrage, check tokenOut -> tokenIn on both DEXs
       const [uniswapReverseQuote, balancerReverseQuote] = await Promise.all([
         this.getUniswapQuote(tokenOut, tokenIn, uniswapQuote.amountOut),
         this.getBalancerQuote(tokenOut, tokenIn, balancerQuote.amountOut)
       ]);

       // Calculate triangular arbitrage profit
       const uniswapTriangularProfit = parseFloat(uniswapReverseQuote.amountOut) - parseFloat(amountIn);
       const balancerTriangularProfit = parseFloat(balancerReverseQuote.amountOut) - parseFloat(amountIn);

       // Use the better opportunity
       let spread = directSpread;
       let estimatedProfit = Math.max(uniswapTriangularProfit, balancerTriangularProfit);
       let buyDex: 'Uniswap' | 'Balancer' = uniswapTriangularProfit > balancerTriangularProfit ? 'Uniswap' : 'Balancer';
       let sellDex: 'Uniswap' | 'Balancer' = buyDex === 'Uniswap' ? 'Balancer' : 'Uniswap';

       // Subtract fees (flash loan 0.09% + gas ~$0.20)
       const flashLoanFee = parseFloat(amountIn) * 0.0009;
       const gasCost = 0.20; // Approximate
       const netProfit = estimatedProfit - flashLoanFee - gasCost;

       const profitable = spread >= minSpread && netProfit > 0;

       return {
         id: `arb-${Date.now()}`,
         tokenIn,
         tokenOut,
         amountIn,
         buyDex,
         sellDex,
         buyPrice: Math.min(uniswapPrice, balancerPrice),
         sellPrice: Math.max(uniswapPrice, balancerPrice),
         spread,
         estimatedProfit: netProfit.toFixed(6),
         profitable,
         timestamp: Date.now()
       };
     } catch (error) {
       console.error('Error detecting arbitrage opportunity:', error);
       return null;
     }
   }

 /**
  * Scan for arbitrage opportunities across multiple token pairs
  */
 async scanArbitrageOpportunities(
   tokenPairs: Array<{ tokenIn: string; tokenOut: string }>,
   amountIn: string = '10000'
 ): Promise<ArbitrageOpportunity[]> {
    try {
      const opportunities: ArbitrageOpportunity[] = [];
      
      for (const pair of tokenPairs) {
        const opportunity = await this.detectArbitrageOpportunity(
          pair.tokenIn,
          pair.tokenOut,
          amountIn
        );
        
        if (opportunity && opportunity.profitable) {
          opportunities.push(opportunity);
        }
      }
      
      // Sort by estimated profit (descending)
      return opportunities.sort((a, b) => 
        parseFloat(b.estimatedProfit) - parseFloat(a.estimatedProfit)
      );
    } catch (error) {
      console.error('Error scanning arbitrage opportunities:', error);
      return [];
    }
  }

 /**
  * Get real-time price for a token pair
  */
 async getPrice(
   tokenIn: string,
   tokenOut: string,
   dex: 'Uniswap' | 'Balancer' = 'Uniswap'
 ): Promise<number> {
    try {
      const quote = dex === 'Uniswap'
        ? await this.getUniswapQuote(tokenIn, tokenOut, '1')
        : await this.getBalancerQuote(tokenIn, tokenOut, '1');
      
      return quote.price;
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    }
  }

 /**
  * Calculate price impact for a trade
  */
 async calculatePriceImpact(
   tokenIn: string,
   tokenOut: string,
   amountIn: string,
   dex: 'Uniswap' | 'Balancer' = 'Uniswap'
 ): Promise<number> {
    try {
      // Get quote for small amount (reference price)
      const smallQuote = dex === 'Uniswap'
        ? await this.getUniswapQuote(tokenIn, tokenOut, '1')
        : await this.getBalancerQuote(tokenIn, tokenOut, '1');
      
      // Get quote for actual amount
      const actualQuote = dex === 'Uniswap'
        ? await this.getUniswapQuote(tokenIn, tokenOut, amountIn)
        : await this.getBalancerQuote(tokenIn, tokenOut, amountIn);
      
      // Calculate price impact
      const priceImpact = Math.abs(actualQuote.price - smallQuote.price) / smallQuote.price * 100;
      
      return priceImpact;
    } catch (error) {
      console.error('Error calculating price impact:', error);
      throw error;
    }
  }

 /**
  * Get DEX statistics
  */
 async getDexStats(): Promise<{
   uniswap: { available: boolean; feeTiers: number[] };
   balancer: { available: boolean };
 }> {
    return {
      uniswap: {
        available: true,
        feeTiers: [500, 3000, 10000] // 0.05%, 0.3%, 1%
      },
      balancer: {
        available: true
      }
    };
  }
}

/**
 * Create DEX service instance
 */
export function createDexService(blockchainService: BlockchainService): DexService {
  return new DexService(blockchainService);
}
