import { Strategy, ChampionWallet } from "../types";

// PRODUCTION: Empty default data - strategies will only come from AI
const DEFAULT_FORGE_DATA = {
  strategies: [],
  wallets: []
};

export const forgeEnterpriseAlpha = async (marketContext: any): Promise<{ strategies: Strategy[], wallets: ChampionWallet[] }> => {
  try {
    console.log('🔮 Requesting alpha forging from backend API...');

    let apiUrl = 'http://localhost:3001';

    // Intelligent Backend Discovery
    if (import.meta.env.VITE_API_URL) {
      apiUrl = import.meta.env.VITE_API_URL;
    } else if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      // In production (not localhost), use relative path
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        apiUrl = '';
      }
    }

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

export const chatWithAI = async (query: string, systemContext: any): Promise<string> => {
  try {
    let apiUrl = 'http://localhost:3001';

    // Intelligent Backend Discovery
    if (import.meta.env.VITE_API_URL) {
      apiUrl = import.meta.env.VITE_API_URL;
    } else if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      // In production (not localhost), use relative path
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        apiUrl = '';
      }
    }

    const response = await fetch(`${apiUrl}/api/ai-terminal-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, systemContext }),
    });

    if (!response.ok) {
      console.error('AI Response Error:', response.status, response.statusText);
      const text = await response.text();
      // Throw explicit error if HTML returned (black screen indicator)
      if (text.startsWith('<')) {
        throw new Error('Received HTML instead of JSON. Backend may be offline or Misconfigured.');
      }
      throw new Error(`AI Terminal API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error('❌ AI Terminal communication failed:', error.message);

    if (error.message.includes('Failed to fetch')) {
      return "⚠️ **Connection Error**: I cannot reach the backend cluster. Ensure the backend server is running and `VITE_API_URL` is correctly configured in your environment.";
    }

    return `🤖 **Intelligence Uplink Interrupted**: ${error.message}`;
  }
};
