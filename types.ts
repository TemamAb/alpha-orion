export enum BotRole {
  ORCHESTRATOR = 'ORCHESTRATOR',
  EXECUTOR = 'EXECUTOR',
  SCANNER = 'SCANNER'
}

export enum BotStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  FORGING = 'FORGING',
  EXECUTING = 'EXECUTING',
  ERROR = 'ERROR'
}

export interface BotState {
  id: string;
  role: BotRole;
  status: BotStatus;
  lastAction: string;
  uptime: number;
  cpuUsage: number;
}

export interface Strategy {
  id: string;
  name: string;
  roi: number;
  liquidityProvider: 'Aave' | 'Uniswap' | 'Balancer';
  gasSponsorship: boolean;
  active: boolean;
  score: number;
  championWalletAddress: string;
  pnl24h: number; // Quantitative PnL in USD
  winRate: number; // Percentage 0-100
}

export interface ChampionWallet {
  id: string;
  address: string;
  profitPerDay: string;
  winRate: string;
  forgedStatus: 'Optimized' | 'Syncing' | 'Targeted' | 'Forging';
  assignedStrategies: string[];
  capacityUsage: number;
}

export interface WalletStats {
  address: string;
  balance: string;
  totalProfit: string;
  gasSaved: string;
  accountType: 'ERC-4337 (Pimlico)';
}

export interface MarketAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  message: string;
}