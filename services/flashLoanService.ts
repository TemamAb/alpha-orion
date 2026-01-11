import { ethers } from 'ethers';
import { BlockchainService, CONTRACTS } from './blockchainService';
import { MEVProtectionService } from './mevProtectionService';
import { DexService, createDexService } from './dexService';

/**
 * PHASE 1: FLASH LOAN SERVICE
 * 
 * This service handles Aave V3 flash loan execution for arbitrage opportunities.
 * Flash loans allow borrowing without collateral, repaid in the same transaction.
 */

// Aave V3 Pool ABI (simplified - only what we need)
const AAVE_POOL_ABI = [
  'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external',
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowRate, uint128 stableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
  'event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint8 interestRateMode, uint256 premium, uint16 referralCode)'
];

// Flash Loan Receiver Interface (what our contract must implement)
const FLASH_LOAN_RECEIVER_ABI = [
  'function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bool)'
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)'
];

/**
 * Flash Loan Parameters
 */
export interface FlashLoanParams {
  asset: string;           // Token address to borrow
  amount: string;          // Amount to borrow (in token units)
  receiverAddress: string; // Contract that will receive the loan
  params?: string;         // Additional parameters (encoded)
}

/**
 * Flash Loan Result
 */
export interface FlashLoanResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  gasUsed?: bigint;
  premium?: bigint;
  error?: string;
}

/**
 * Arbitrage Strategy for Flash Loan
 */
export interface ArbitrageStrategy {
  tokenIn: string;         // Token to borrow
  tokenOut: string;        // Token to receive
  amountIn: string;        // Amount to borrow
  dexA: string;            // First DEX to trade on
  dexB: string;            // Second DEX to trade on
  minProfitUSD: number;    // Minimum profit in USD
}

/**
 * Flash Loan Service Class
 */
export class FlashLoanService {
   private blockchainService: BlockchainService;
   private mevProtectionService: MEVProtectionService;
   private aavePool: ethers.Contract;

   constructor(blockchainService: BlockchainService, mevProtectionService?: MEVProtectionService) {
     this.blockchainService = blockchainService;
     this.mevProtectionService = mevProtectionService || new MEVProtectionService(blockchainService);

     const provider = blockchainService.getProvider();
     this.aavePool = new ethers.Contract(
       CONTRACTS.AAVE_POOL,
       AAVE_POOL_ABI,
       provider
     );
   }

  /**
   * Calculate flash loan premium (fee)
   * Aave V3 charges 0.09% (9 basis points)
   */
  calculatePremium(amount: bigint): bigint {
    return (amount * 9n) / 10000n; // 0.09%
  }

  /**
   * Get available liquidity for an asset
   */
  async getAvailableLiquidity(asset: string): Promise<string> {
    try {
      const reserveData = await this.aavePool.getReserveData(asset);
      const aTokenAddress = reserveData.aTokenAddress;
      
      // Get aToken balance (represents available liquidity)
      const aToken = new ethers.Contract(
        aTokenAddress,
        ERC20_ABI,
        this.blockchainService.getProvider()
      );
      
      const balance = await aToken.balanceOf(CONTRACTS.AAVE_POOL);
      const decimals = await aToken.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting available liquidity:', error);
      throw error;
    }
  }

  /**
   * Check if flash loan is possible
   */
  async canExecuteFlashLoan(asset: string, amount: string): Promise<boolean> {
    try {
      const availableLiquidity = await this.getAvailableLiquidity(asset);
      return parseFloat(availableLiquidity) >= parseFloat(amount);
    } catch (error) {
      console.error('Error checking flash loan availability:', error);
      return false;
    }
  }

  /**
   * Estimate flash loan cost (premium + gas)
   */
  async estimateFlashLoanCost(asset: string, amount: string): Promise<{
    premium: string;
    estimatedGas: bigint;
    gasCostETH: string;
    totalCostUSD: string;
  }> {
    try {
      // Get token decimals
      const token = new ethers.Contract(
        asset,
        ERC20_ABI,
        this.blockchainService.getProvider()
      );
      const decimals = await token.decimals();
      
      // Calculate premium
      const amountBigInt = ethers.parseUnits(amount, decimals);
      const premiumBigInt = this.calculatePremium(amountBigInt);
      const premium = ethers.formatUnits(premiumBigInt, decimals);
      
      // Estimate gas (rough estimate for flash loan + arbitrage)
      const estimatedGas = 500000n; // ~500k gas for complex flash loan
      const gasPrice = await this.blockchainService.getGasPrice();
      const gasCost = estimatedGas * gasPrice;
      const gasCostETH = ethers.formatEther(gasCost);
      
      // Estimate total cost in USD (assuming ETH = $2500)
      const ethPriceUSD = 2500;
      const gasCostUSD = parseFloat(gasCostETH) * ethPriceUSD;
      const premiumUSD = parseFloat(premium); // Simplified, assumes 1:1 with USD
      const totalCostUSD = (gasCostUSD + premiumUSD).toFixed(2);
      
      return {
        premium,
        estimatedGas,
        gasCostETH,
        totalCostUSD
      };
    } catch (error) {
      console.error('Error estimating flash loan cost:', error);
      throw error;
    }
  }

  /**
   * Execute flash loan (requires deployed receiver contract)
   * 
   * NOTE: This is a SIMULATION. In production, you need:
   * 1. Deploy a FlashLoanReceiver contract
   * 2. Implement executeOperation() with arbitrage logic
   * 3. Approve Aave Pool to pull back loan + premium
   */
  async executeFlashLoan(params: FlashLoanParams): Promise<FlashLoanResult> {
    try {
      console.log('🔄 Preparing flash loan execution...');
      console.log('Asset:', params.asset);
      console.log('Amount:', params.amount);
      console.log('Receiver:', params.receiverAddress);
      
      // Validate parameters
      if (!this.blockchainService.isValidAddress(params.asset)) {
        throw new Error('Invalid asset address');
      }
      if (!this.blockchainService.isValidAddress(params.receiverAddress)) {
        throw new Error('Invalid receiver address');
      }
      
      // Check if flash loan is possible
      const canExecute = await this.canExecuteFlashLoan(params.asset, params.amount);
      if (!canExecute) {
        throw new Error('Insufficient liquidity for flash loan');
      }
      
      // Get token decimals
      const token = new ethers.Contract(
        params.asset,
        ERC20_ABI,
        this.blockchainService.getProvider()
      );
      const decimals = await token.decimals();
      
      // Parse amount
      const amount = ethers.parseUnits(params.amount, decimals);
      
      // Encode params (empty for now)
      const encodedParams = params.params || '0x';
      
      // Get wallet with signer
      const wallet = this.blockchainService.getWallet();
      const aavePoolWithSigner = this.aavePool.connect(wallet) as any;

      // Execute flash loan with MEV protection if enabled
      console.log('📤 Sending flash loan transaction...');

      let tx;
      if (this.mevProtectionService.isProtectionEnabled()) {
        console.log('🛡️ Using MEV protection via Flashbots relay');

        // Prepare transaction for Flashbots
        const txRequest = await aavePoolWithSigner.flashLoanSimple.populateTransaction(
          params.receiverAddress,
          params.asset,
          amount,
          encodedParams,
          0 // referralCode
        );

        // Execute through Flashbots
        tx = await this.mevProtectionService.executeOnFlashbotsRelay(txRequest);
      } else {
        console.log('⚠️ MEV protection disabled - executing on public mempool');
        tx = await aavePoolWithSigner.flashLoanSimple(
          params.receiverAddress,
          params.asset,
          amount,
          encodedParams,
          0 // referralCode
        );
      }

      console.log('⏳ Waiting for confirmation...');
      console.log('TX Hash:', tx.hash);

      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        const explorerUrl = this.blockchainService.getExplorerUrl(tx.hash);
        
        console.log('✅ Flash loan executed successfully!');
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('Explorer:', explorerUrl);
        
        return {
          success: true,
          txHash: tx.hash,
          explorerUrl,
          gasUsed: receipt.gasUsed,
          premium: this.calculatePremium(amount)
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Flash loan execution failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Simulate arbitrage profit calculation
   * 
   * This calculates potential profit from a flash loan arbitrage:
   * 1. Borrow tokenIn from Aave
   * 2. Swap tokenIn → tokenOut on DEX A (buy low)
   * 3. Swap tokenOut → tokenIn on DEX B (sell high)
   * 4. Repay loan + premium
   * 5. Keep profit
   */
  async calculateArbitrageProfitability(strategy: ArbitrageStrategy): Promise<{
    profitable: boolean;
    grossProfit: string;
    flashLoanPremium: string;
    gasCost: string;
    netProfit: string;
    roi: string;
  }> {
    try {
      // Get token decimals
      const tokenIn = new ethers.Contract(
        strategy.tokenIn,
        ERC20_ABI,
        this.blockchainService.getProvider()
      );
      const decimals = await tokenIn.decimals();
      
      // Parse amount
      const amountIn = ethers.parseUnits(strategy.amountIn, decimals);
      
      // Calculate flash loan premium (0.09%)
      const premium = this.calculatePremium(amountIn);
      const premiumFormatted = ethers.formatUnits(premium, decimals);
      
      // Estimate gas cost
      const estimatedGas = 500000n;
      const gasPrice = await this.blockchainService.getGasPrice();
      const gasCost = estimatedGas * gasPrice;
      const gasCostETH = ethers.formatEther(gasCost);
      const gasCostUSD = parseFloat(gasCostETH) * 2500; // Assume ETH = $2500
      
      // Get real DEX prices using dexService
      const dexService = createDexService(this.blockchainService);

      // For arbitrage: Buy tokenOut with tokenIn on DEX A, then sell tokenOut for tokenIn on DEX B
      const quoteA = await dexService.getUniswapQuote(strategy.tokenIn, strategy.tokenOut, strategy.amountIn); // tokenIn -> tokenOut
      const quoteB = await dexService.getBalancerQuote(strategy.tokenOut, strategy.tokenIn, quoteA.amountOut); // tokenOut -> tokenIn

      // Calculate amounts
      const amountOut = parseFloat(quoteA.amountOut); // tokenOut received from DEX A
      const amountBack = parseFloat(quoteB.amountOut); // tokenIn received from DEX B
      
      // Calculate profit
      const grossProfit = amountBack - parseFloat(strategy.amountIn);
      const netProfit = grossProfit - parseFloat(premiumFormatted) - gasCostUSD;
      const roi = (netProfit / parseFloat(strategy.amountIn)) * 100;
      
      return {
        profitable: netProfit > strategy.minProfitUSD,
        grossProfit: grossProfit.toFixed(6),
        flashLoanPremium: premiumFormatted,
        gasCost: gasCostUSD.toFixed(6),
        netProfit: netProfit.toFixed(6),
        roi: roi.toFixed(2) + '%'
      };
    } catch (error) {
      console.error('Error calculating arbitrage profitability:', error);
      throw error;
    }
  }

  /**
   * Get flash loan statistics
   */
  async getFlashLoanStats(asset: string): Promise<{
    availableLiquidity: string;
    premiumRate: string;
    estimatedGas: string;
  }> {
    try {
      const liquidity = await this.getAvailableLiquidity(asset);
      
      return {
        availableLiquidity: liquidity,
        premiumRate: '0.09%',
        estimatedGas: '~500,000'
      };
    } catch (error) {
      console.error('Error getting flash loan stats:', error);
      throw error;
    }
  }
}

/**
 * Create flash loan service instance
 */
export function createFlashLoanService(
  blockchainService: BlockchainService,
  mevProtectionService?: MEVProtectionService
): FlashLoanService {
  return new FlashLoanService(blockchainService, mevProtectionService);
}
