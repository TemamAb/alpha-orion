const axios = require('axios');
const { ethers } = require('ethers');
const flashLoanExecutorAbi = require('./abi/FlashLoanExecutor.json');


class ArbitrageEngine {
  constructor() {
    this.oneInchApiKey = process.env.ONE_INCH_API_KEY;
    this.rpcUrl = process.env.POLYGON_ZKEVM_RPC_URL || 'https://rpc.polygon-zkevm.gateway.fm';
    this.chainId = 1101; // Polygon zkEVM
    this.flashLoanExecutorAddress = process.env.FLASH_LOAN_EXECUTOR_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;

    if (!this.flashLoanExecutorAddress || !this.privateKey || !this.oneInchApiKey) {
      throw new Error("ArbitrageEngine: Missing critical environment variables (EXECUTOR_ADDRESS, PRIVATE_KEY, or 1INCH_API_KEY)");
    }

    this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    this.contract = new ethers.Contract(this.flashLoanExecutorAddress, flashLoanExecutorAbi, this.wallet);
    console.log(`[ArbitrageEngine] Initialized for REAL on-chain execution. Wallet: ${this.wallet.address}`);
  }

  async findFlashLoanArbitrage() {
    // Fetch REAL market data from 1inch - no fallback simulation
    if (!this.oneInchApiKey) {
      throw new Error("1inch API Key is required for arbitrage operations.");
    }

    try {
      // This is a simplified triangular arbitrage finder. A production system would be more complex.
      // Path: WETH -> USDC -> WETH
      const baseToken = { symbol: 'WETH', address: '0x4F9A0e7FD2Bf60675dE95FA66388785275276641', decimals: 18 };
      const quoteToken = { symbol: 'USDC', address: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbC681C', decimals: 6 };
      const loanAmount = ethers.utils.parseUnits('1.0', baseToken.decimals); // Borrow 1 WETH

      // Step 1: Quote WETH -> USDC
      const quote1 = await this.get1inchQuote(baseToken.address, quoteToken.address, loanAmount.toString());
      if (!quote1) return [];
      const usdcAmount = ethers.BigNumber.from(quote1.toAmount);

      // Step 2: Quote USDC -> WETH
      const quote2 = await this.get1inchQuote(quoteToken.address, baseToken.address, usdcAmount.toString());
      if (!quote2) return [];
      const finalWethAmount = ethers.BigNumber.from(quote2.toAmount);

      // Calculate profit
      const profit = finalWethAmount.sub(loanAmount);

      if (profit.gt(0)) {
        const profitUSD = parseFloat(ethers.utils.formatUnits(profit, baseToken.decimals)) * quote1.toTokenAmount / (10**quoteToken.decimals); // Approximate profit in USD
        
        return [{
          id: `tri-weth-usdc-${Date.now()}`,
          assets: [baseToken.symbol, quoteToken.symbol, baseToken.symbol],
          path: [baseToken.address, quoteToken.address, baseToken.address],
          loanAmount: loanAmount,
          potentialProfit: profitUSD,
          exchanges: ['1inch', '1inch'],
          timestamp: Date.now(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`[ArbitrageEngine] 1inch API call failed: ${error.message}`);
      throw new Error(`Failed to fetch market data from 1inch: ${error.message}`);
    }
  }

  async get1inchQuote(src, dst, amount) {
    const url = `https://api.1inch.dev/swap/v5.2/${this.chainId}/quote`;
    const config = {
      headers: { 'Authorization': `Bearer ${this.oneInchApiKey}` },
      params: { src, dst, amount, from: this.flashLoanExecutorAddress }
    };
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.warn(`[1inch] Quote failed for ${src}->${dst}: ${error.response?.data?.description || error.message}`);
      return null;
    }
  }

  async executeArbitrage(opportunity) {
    console.log(`[ArbitrageEngine] Executing REAL opportunity ${opportunity.id} on-chain.`);

    try {
      const minProfit = ethers.utils.parseUnits('0.001', opportunity.assets[0] === 'WETH' ? 18 : 6); // Minimal profit to ensure tx success

      // Estimate gas for the transaction
      const gasEstimate = await this.contract.estimateGas.executeFlashLoanArbitrage(
        opportunity.path[0], // asset to borrow
        opportunity.loanAmount,
        opportunity.path,
        minProfit
      );

      // Execute the transaction
      const tx = await this.contract.executeFlashLoanArbitrage(
        opportunity.path[0],
        opportunity.loanAmount,
        opportunity.path,
        minProfit,
        { gasLimit: gasEstimate.mul(12).div(10) } // Add 20% buffer to gas estimate
      );

      console.log(`[ArbitrageEngine] Transaction submitted with hash: ${tx.hash}`);
      
      // We don't wait for the receipt here; the confirmation loop will handle it.
      // This makes the API responsive.
      return {
        status: 'success',
        transactionHash: tx.hash, // REAL transaction hash
      };
    } catch (error) {
      console.error(`[ArbitrageEngine] On-chain execution failed:`, error.reason || error.message);
      return { status: 'failed', error: error.reason || error.message };
    }
  }
}

module.exports = ArbitrageEngine;