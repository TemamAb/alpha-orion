import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  ProfitData,
  Opportunity,
  Trade,
  SystemHealth,
  PimlicoStatus,
  AnalyticsData
} from '../types/api';
import { useConfigStore } from './useConfigStore';

export interface WalletData {
  id: number;
  address: string;
  accountName: string;
  logo: string;
  status: 'valid' | 'invalid';
  balance: number;
}

interface AlphaOrionState {
  // Data states
  profitData: ProfitData | null;
  opportunities: Opportunity[];
  tradeHistory: Trade[];
  systemHealth: SystemHealth | null;
  pimlicoStatus: PimlicoStatus | null;
  analytics: AnalyticsData | null;
  wallets: WalletData[];

  // Auto-transfer settings
  depositMode: 'auto' | 'manual';
  depositThreshold: number;

  // UI states
  isLoading: {
    profit: boolean;
    opportunities: boolean;
    trades: boolean;
    health: boolean;
    pimlico: boolean;
    analytics: boolean;
  };
  error: string | null;
  lastUpdate: Date | null;
  refreshInterval: number;
  currency: 'ETH' | 'USD';
  isEngineRunning: boolean;

  // Actions
  setProfitData: (data: ProfitData | null) => void;
  setOpportunities: (data: Opportunity[]) => void;
  setTradeHistory: (data: Trade[]) => void;
  setSystemHealth: (data: SystemHealth | null) => void;
  setPimlicoStatus: (data: PimlicoStatus | null) => void;
  setAnalytics: (data: AnalyticsData | null) => void;
  setWallets: (wallets: WalletData[]) => void;
  addWallet: (wallet: WalletData) => void;
  removeWallet: (id: number) => void;
  updateWallet: (id: number, updates: Partial<WalletData>) => void;

  setLoading: (key: keyof AlphaOrionState['isLoading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdate: () => void;
  setRefreshInterval: (interval: number) => void;
  setCurrency: (currency: 'ETH' | 'USD') => void;
  setDepositMode: (mode: 'auto' | 'manual') => void;
  setDepositThreshold: (threshold: number) => void;
  setEngineRunning: (running: boolean) => void;
  fetchEngineStatus: () => Promise<void>;
  activateProductionEngine: () => Promise<boolean>;

  // Computed values
  getTotalProfit: () => number;
  getActiveOpportunities: () => Opportunity[];
  getRecentTrades: (limit?: number) => Trade[];
  getSystemStatus: () => 'healthy' | 'warning' | 'critical' | 'unknown';
  getTotalWalletBalance: () => number;
  getWalletCount: () => number;
}

export const useAlphaOrionStore = create<AlphaOrionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial states
    profitData: null,
    opportunities: [],
    tradeHistory: [],
    systemHealth: null,
    pimlicoStatus: null,
    analytics: null,
    wallets: [],

    isLoading: {
      profit: false,
      opportunities: false,
      trades: false,
      health: false,
      pimlico: false,
      analytics: false,
    },

    error: null,
    lastUpdate: null,
    refreshInterval: 5,
    currency: 'USD',
    depositMode: 'manual',
    depositThreshold: 1000,
    isEngineRunning: false,

    // Actions
    setProfitData: (data) => set({ profitData: data }),
    setOpportunities: (data) => set({ opportunities: data }),
    setTradeHistory: (data) => set({ tradeHistory: data }),
    setSystemHealth: (data) => set({ systemHealth: data }),
    setPimlicoStatus: (data) => set({ pimlicoStatus: data }),
    setAnalytics: (data) => set({ analytics: data }),
    setWallets: (wallets) => set({ wallets }),
    addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
    removeWallet: (id) => set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) })),
    updateWallet: (id, updates) => set((state) => ({
      wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),

    setLoading: (key, loading) =>
      set((state) => ({
        isLoading: { ...state.isLoading, [key]: loading }
      })),

    setError: (error) => set({ error }),
    updateLastUpdate: () => set({ lastUpdate: new Date() }),
    setRefreshInterval: (interval) => set({ refreshInterval: Math.max(1, Math.min(30, interval)) }),
    setCurrency: (currency) => set({ currency }),
    setDepositMode: (depositMode) => set({ depositMode }),
    setDepositThreshold: (depositThreshold) => set({ depositThreshold: Math.max(100, Math.min(10000, depositThreshold)) }),
    setEngineRunning: (isEngineRunning) => set({ isEngineRunning }),

    fetchEngineStatus: async () => {
      try {
        const apiBase = useConfigStore.getState().apiUrl;
        const response = await fetch(`${apiBase}/api/engine/status`);
        // Reject HTML responses (static-server SPA catch-all returns 200 + HTML)
        const ct = response.headers.get('content-type') || '';
        if (response.ok && ct.includes('application/json')) {
          const data = await response.json();
          set({ isEngineRunning: data.status === 'running' });
        } else if (!ct.includes('application/json')) {
          // Backend not yet running (static server) — engine is NOT running
          set({ isEngineRunning: false });
        }
      } catch (error) {
        console.error('[EngineStatus] Error:', error);
      }
    },

    activateProductionEngine: async () => {
      try {
        set({ isLoading: { ...get().isLoading, health: true } });
        const apiBase = useConfigStore.getState().apiUrl;
        const response = await fetch(`${apiBase}/api/engine/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        // Only succeed if the response is real JSON (not SPA HTML catch-all)
        const ct = response.headers.get('content-type') || '';
        if (response.ok && ct.includes('application/json')) {
          set({ isEngineRunning: true });
          console.log('[ActivateEngine] Engine started successfully');
          return true;
        }
        console.warn('[ActivateEngine] Response was not JSON — backend may not be running yet');
        return false;
      } catch (error) {
        console.error('[ActivateEngine] Error:', error);
        return false;
      } finally {
        set({ isLoading: { ...get().isLoading, health: false } });
      }
    },

    // Computed values
    getTotalProfit: () => {
      const { profitData } = get();
      return profitData?.totalPnL || 0;
    },

    getActiveOpportunities: () => {
      const { opportunities } = get();
      return opportunities.filter(opp => opp.status === 'pending');
    },

    getRecentTrades: (limit = 10) => {
      const { tradeHistory } = get();
      return tradeHistory.slice(0, limit);
    },

    getSystemStatus: () => {
      const { systemHealth } = get();
      if (!systemHealth) return 'unknown';
      if (systemHealth.status === 'critical') return 'critical';
      if (systemHealth.status === 'warning') return 'warning';
      return 'healthy';
    },

    getTotalWalletBalance: () => {
      const { wallets } = get();
      return wallets.reduce((sum, w) => sum + w.balance, 0);
    },

    getWalletCount: () => {
      const { wallets } = get();
      return wallets.length;
    },
  }))
);

// Selectors for optimized re-renders
export const useProfitData = () => useAlphaOrionStore((state) => state.profitData);
export const useOpportunities = () => useAlphaOrionStore((state) => state.opportunities);
export const useTradeHistory = () => useAlphaOrionStore((state) => state.tradeHistory);
export const useSystemHealth = () => useAlphaOrionStore((state) => state.systemHealth);
export const usePimlicoStatus = () => useAlphaOrionStore((state) => state.pimlicoStatus);
export const useAnalytics = () => useAlphaOrionStore((state) => state.analytics);
export const useLoading = () => useAlphaOrionStore((state) => state.isLoading);
export const useError = () => useAlphaOrionStore((state) => state.error);
export const useLastUpdate = () => useAlphaOrionStore((state) => state.lastUpdate);
export const useRefreshInterval = () => useAlphaOrionStore((state) => state.refreshInterval);
export const useCurrency = () => useAlphaOrionStore((state) => state.currency);
export const useWallets = () => useAlphaOrionStore((state) => state.wallets);
export const useDepositMode = () => useAlphaOrionStore((state) => state.depositMode);
export const useDepositThreshold = () => useAlphaOrionStore((state) => state.depositThreshold);

// Computed selectors
export const useTotalProfit = () => useAlphaOrionStore((state) => state.getTotalProfit());
export const useActiveOpportunities = () => useAlphaOrionStore((state) => state.getActiveOpportunities());
export const useRecentTrades = (limit?: number) => useAlphaOrionStore((state) => state.getRecentTrades(limit));
export const useTotalWalletBalance = () => useAlphaOrionStore((state) => state.getTotalWalletBalance());
export const useWalletCount = () => useAlphaOrionStore((state) => state.getWalletCount());
export const useIsEngineRunning = () => useAlphaOrionStore((state) => state.isEngineRunning);
