
export type LifecycleStage = 'NASCENT' | 'ESTABLISHED' | 'APEX' | 'INSTITUTIONAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';
export type DexType = 'RAYDIUM' | 'JUPITER' | 'UNISWAP' | 'ORCA' | 'AERODROME';

export interface WalletIntel {
  address: string;
  label: string;
  winRate: number;
  totalPnl: string;
  dailyProfit: string;
  pnlValue: number;
  rank: number;
  percentile: number; // e.g., 0.001
  confidence: number; 
  intelContribution: number;
  insights: string[];
  status: 'ANALYZING' | 'HARVESTED' | 'APEX_VERIFIED';
  chain: 'SOL' | 'ETH' | 'BASE';
  riskRating: RiskLevel;
  isPrivateRPC: boolean; // Signature of 0.001% wallets
}

export interface MirroredTrade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  amount: string;
  wallet: string;
  timestamp: string;
  confidence: number;
  stage: LifecycleStage;
  risk: RiskLevel;
  consensusCount: number;
  dex: DexType;
  chain: 'SOL' | 'ETH' | 'BASE';
  isBundle: boolean;
}
