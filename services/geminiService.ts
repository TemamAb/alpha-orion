import { Strategy, ChampionWallet } from "../types";

// PRODUCTION: Empty default data - strategies will only come from AI
const DEFAULT_FORGE_DATA = {
  strategies: [],
  wallets: []
};

export const forgeEnterpriseAlpha = async (marketContext: any): Promise<{ strategies: Strategy[], wallets: ChampionWallet[] }> => {
  try {
    console.log('🔮 Requesting alpha forging from backend API...');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${apiUrl}/api/forge-alpha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ marketContext }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully received forged strategies from backend:', data.strategies?.length || 0);

    return data;
  } catch (error: any) {
    console.error('❌ Alpha forging failed:', error.message);
    return DEFAULT_FORGE_DATA as any;
  }
};
