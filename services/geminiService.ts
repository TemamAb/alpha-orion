import { Strategy, ChampionWallet } from "../types";

// Backend API URL - use environment variable or default to localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

const DISCOVERY_REGISTRY = {
  ONE_CLICK_ARBITRAGE: "1CK-ENTERPRISE-SYNC-882",
  DEXTOOLS_PREMIUM: "DXT-ELITE-ALPHA-091",
  BITQUERY_V3: "BQ-REALTIME-MESH-772",
  ETHERSCAN_PRO: "ETH-PRO-WHALE-TRACK-119",
  FLASHBOTS_RPC: "FB-PROTECT-RELAY-SYNC"
};

// PRODUCTION: Empty default data - strategies will only come from AI or real backend
const DEFAULT_FORGE_DATA = {
  strategies: [],
  wallets: []
};

export const forgeEnterpriseAlpha = async (marketContext: any): Promise<{ strategies: Strategy[], wallets: ChampionWallet[] }> => {
  try {
    console.log('Calling backend API at:', `${API_URL}/api/forge-alpha`);
    
    const response = await fetch(`${API_URL}/api/forge-alpha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ marketContext }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend API error:', errorData);
      
      // If rate limited or server error, return empty data (no mock fallback)
      if (response.status === 429 || response.status >= 500) {
        console.warn('Backend unavailable - returning empty strategies');
        return DEFAULT_FORGE_DATA as any;
      }
      
      throw new Error(errorData.error?.message || 'Failed to forge alpha');
    }

    const data = await response.json();
    console.log('Successfully received strategies from backend:', data.strategies?.length || 0);
    return data;
  } catch (error: any) {
    console.error('Error calling backend API:', error.message);
    
    // PRODUCTION: Return empty data if backend is unavailable (no mock fallback)
    console.warn('Backend unavailable - returning empty strategies');
    return DEFAULT_FORGE_DATA as any;
  }
};
