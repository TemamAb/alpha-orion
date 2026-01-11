import { ethers } from 'ethers';

/**
 * PHASE 1: BLOCKCHAIN INTEGRATION
 * 
 * This service provides core blockchain connectivity for Alpha-Orion.
 * It handles Web3 provider setup, wallet management, and basic transaction execution.
 */

// Network Configuration
export const NETWORKS = {
  ARBITRUM_SEPOLIA: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  BASE_SEPOLIA: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  // Mainnet configs (for production)
  ARBITRUM: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  BASE: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  }
};

// Contract Addresses (Testnet - Arbitrum Sepolia)
export const CONTRACTS = {
  // Aave V3 on Arbitrum Sepolia
  AAVE_POOL: '0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff',
  AAVE_POOL_DATA_PROVIDER: '0x6b4E260b765B3cA1514e618C0215A6B7839fF93e',
  
  // Uniswap V3 on Arbitrum Sepolia
  UNISWAP_ROUTER: '0x101F443B4d1b059569D643917553c771E1b9663E',
  UNISWAP_QUOTER: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Quoter V2
  UNISWAP_FACTORY: '0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e',
  
  // Common tokens on Arbitrum Sepolia
  WETH: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
  USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  DAI: '0x7683022d84F726a96c4A6611cD31DBf5409c0Ac9'
};

// Blockchain Service Class
export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private network: typeof NETWORKS[keyof typeof NETWORKS];
  
  constructor(networkKey: keyof typeof NETWORKS = 'ARBITRUM_SEPOLIA') {
    this.network = NETWORKS[networkKey];
  }

  /**
   * Initialize Web3 provider
   */
  async initialize(privateKey?: string): Promise<void> {
    try {
      // Create provider
      this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
      
      // Test connection
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`✅ Connected to ${this.network.name} at block ${blockNumber}`);
      
      // Initialize wallet if private key provided
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        const address = await this.wallet.getAddress();
        const balance = await this.provider.getBalance(address);
        console.log(`✅ Wallet initialized: ${address}`);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Get current provider
   */
  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
    return this.provider;
  }

  /**
   * Get wallet instance
   */
  getWallet(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Provide private key to initialize().');
    }
    return this.wallet;
  }

  /**
   * Get network information
   */
  getNetwork() {
    return this.network;
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const provider = this.getProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    const provider = this.getProvider();
    return await provider.estimateGas(tx);
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(address: string): Promise<string> {
    const provider = this.getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    const provider = this.getProvider();
    
    // ERC20 ABI for balanceOf
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    
    return ethers.formatUnits(balance, decimals);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    const wallet = this.getWallet();
    return await wallet.sendTransaction(tx);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    const provider = this.getProvider();
    return await provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    const provider = this.getProvider();
    return await provider.getTransactionReceipt(txHash);
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Format address (shortened)
   */
  formatAddress(address: string): string {
    if (!this.isValidAddress(address)) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Get block explorer URL for transaction
   */
  getExplorerUrl(txHash: string): string {
    return `${this.network.explorer}/tx/${txHash}`;
  }

  /**
   * Get block explorer URL for address
   */
  getAddressExplorerUrl(address: string): string {
    return `${this.network.explorer}/address/${address}`;
  }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

/**
 * Get or create blockchain service instance
 */
export function getBlockchainService(networkKey?: keyof typeof NETWORKS): BlockchainService {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService(networkKey);
  }
  return blockchainServiceInstance;
}

/**
 * Initialize blockchain service with private key
 */
export async function initializeBlockchain(
  privateKey?: string,
  networkKey?: keyof typeof NETWORKS
): Promise<BlockchainService> {
  const service = getBlockchainService(networkKey);
  await service.initialize(privateKey);
  return service;
}

// Export types
export type NetworkKey = keyof typeof NETWORKS;
export type Network = typeof NETWORKS[NetworkKey];
