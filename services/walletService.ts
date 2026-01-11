import { BrowserProvider } from 'ethers';

export interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
}

export interface DeploymentRecord {
  id: string;
  timestamp: Date;
  walletAddress: string;
  chainId: number;
  transactionHash: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  blockNumber?: number;
}

class WalletService {
  private provider: BrowserProvider | null = null;

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider
      this.provider = new BrowserProvider(ethereum);

      // Get network info
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // Get balance
      const balance = await this.provider.getBalance(accounts[0]);
      const balanceInEth = (Number(balance) / 1e18).toFixed(4);

      const connection: WalletConnection = {
        address: accounts[0],
        chainId,
        balance: `${balanceInEth} ETH`,
        isConnected: true
      };

      // Listen for account changes
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        }
      });

      // Listen for chain changes
      ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return connection;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
  }

  /**
   * Validate wallet connection
   */
  async validateConnection(address: string): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const accounts = await this.provider.listAccounts();
      return accounts.some(account => account.address.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Deploy engine to Ethereum mainnet (simulated)
   */
  async deployEngine(walletAddress: string): Promise<DeploymentRecord> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // Simulate deployment transaction
      // In production, this would deploy actual smart contracts
      const deploymentRecord: DeploymentRecord = {
        id: `deploy-${Date.now()}`,
        timestamp: new Date(),
        walletAddress,
        chainId,
        transactionHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        status: 'pending',
      };

      // Simulate deployment process (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update to success
      deploymentRecord.status = 'success';
      deploymentRecord.gasUsed = (Math.random() * 0.01 + 0.005).toFixed(6);
      deploymentRecord.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;

      return deploymentRecord;
    } catch (error: any) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Get current network name
   */
  async getNetworkName(): Promise<string> {
    if (!this.provider) return 'Unknown';

    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      const networks: Record<number, string> = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        137: 'Polygon Mainnet',
        42161: 'Arbitrum One',
        8453: 'Base Mainnet',
      };

      return networks[chainId] || `Chain ID: ${chainId}`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Switch to Ethereum Mainnet
   */
  async switchToMainnet(): Promise<void> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    try {
      const ethereum = (window as any).ethereum;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Mainnet
      });
    } catch (error: any) {
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }
}

export const walletService = new WalletService();
