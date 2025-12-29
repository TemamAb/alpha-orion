import axios from 'axios';

const PRODUCTION_API = 'https://orion-d5rc.onrender.com/api';

export interface DashboardMetrics {
  nodeStatus: string;
  gasPrice: string;
  yieldPerHour: number;
  yieldPerSwap: number;
  netProduction: number;
  vaultBalance: number;
  confidenceScore: number;
  nodeLatency: number;
  mevResistance: number;
  frontrunBlock: boolean;
  yieldSources: {
    baseSwap: number;
    arbLiquidity: number;
    ethFlash: number;
  };
  systemStatus: {
    pNode: boolean;
    sNode: boolean;
    oracleV3: boolean;
    rpcCore: boolean;
    mevGuard: boolean;
    aiEngine: boolean;
    settlement: boolean;
  };
}

export class DashboardService {
  private static instance: DashboardService;
  
  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await axios.get(`${PRODUCTION_API}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async startTrading(): Promise<boolean> {
    try {
      await axios.post(`${PRODUCTION_API}/trading/start`);
      return true;
    } catch (error) {
      console.error('Failed to start trading:', error);
      return false;
    }
  }

  async settleProfits(): Promise<boolean> {
    try {
      await axios.post(`${PRODUCTION_API}/profits/settle`);
      return true;
    } catch (error) {
      console.error('Failed to settle profits:', error);
      return false;
    }
  }

  async updateRoutingMode(mode: 'AUTO' | 'MANUAL'): Promise<boolean> {
    try {
      await axios.post(`${PRODUCTION_API}/routing/${mode.toLowerCase()}`);
      return true;
    } catch (error) {
      console.error('Failed to update routing mode:', error);
      return false;
    }
  }

  private getDefaultMetrics(): DashboardMetrics {
    return {
      nodeStatus: 'SYNCING...',
      gasPrice: '0.0',
      yieldPerHour: 0,
      yieldPerSwap: 0,
      netProduction: 0,
      vaultBalance: 0,
      confidenceScore: 71,
      nodeLatency: 0,
      mevResistance: 100,
      frontrunBlock: true,
      yieldSources: {
        baseSwap: 1240,
        arbLiquidity: 890,
        ethFlash: 550
      },
      systemStatus: {
        pNode: true,
        sNode: true,
        oracleV3: true,
        rpcCore: true,
        mevGuard: true,
        aiEngine: true,
        settlement: true
      }
    };
  }
}

export default DashboardService.getInstance();
