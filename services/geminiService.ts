import { GoogleGenAI } from '@google/genai';
import { Strategy, ChampionWallet } from "../types";

const DISCOVERY_REGISTRY = {
  ONE_CLICK_ARBITRAGE: "1CK-ENTERPRISE-SYNC-882",
  DEXTOOLS_PREMIUM: "DXT-ELITE-ALPHA-091",
  BITQUERY_V3: "BQ-REALTIME-MESH-772",
  ETHERSCAN_PRO: "ETH-PRO-WHALE-TRACK-119",
  FLASHBOTS_RPC: "FB-PROTECT-RELAY-SYNC"
};

// PRODUCTION: Empty default data - strategies will only come from AI
const DEFAULT_FORGE_DATA = {
  strategies: [],
  wallets: []
};

// Initialize Gemini AI
const initializeGemini = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
  }
  return new GoogleGenAI({ apiKey });
};

export const forgeEnterpriseAlpha = async (marketContext: any): Promise<{ strategies: Strategy[], wallets: ChampionWallet[] }> => {
  try {
    console.log('🔮 Initializing Gemini AI for alpha forging...');

    const ai = initializeGemini();
    const model = ai.models.gemini_1_5_pro;

    // Prepare context for AI
    const context = {
      marketVolatility: marketContext?.volatility || 2.5,
      gasPriceGwei: marketContext?.gasPrice || 25,
      activeBotCount: marketContext?.activeBots || 3,
      networkLoad: marketContext?.networkLoad || 'Medium',
      liquidityDepth: marketContext?.liquidity || 5000000,
      timestamp: Date.now()
    };

    // AI Prompt for strategy synthesis
    const prompt = `
You are ArbiNexus AI Strategist. Analyze the current DeFi market conditions and forge 7 champion arbitrage strategies.

Market Context:
- Volatility: ${context.marketVolatility}%
- Gas Price: ${context.gasPriceGwei} gwei
- Network Load: ${context.networkLoad}
- Liquidity Depth: $${(context.liquidityDepth / 1000000).toFixed(1)}M
- Active Bots: ${context.activeBotCount}

REQUIRED: Generate exactly 7 strategies with these mechanics:
1. L2 Flash Arbitrage (Aave-Uni) - Atomic flash loan arbitrage
2. Cross-Dex Rebalance (Eth-Usdc) - Price equalization across DEXs
3. Mempool Front-run Protection - MEV-aware execution
4. Stabilizer Alpha #09 - JIT liquidity capture
5. L2 Sequential Executor - Cross-chain arbitrage
6. Delta Neutral Forge - Perpetual hedging
7. Shadow Mempool Sweep - Advanced mempool monitoring

For each strategy, provide:
- id: unique identifier
- name: strategy name
- description: detailed mechanics
- roi: expected ROI percentage (realistic 0.5-5%)
- active: boolean (true for profitable ones)
- score: confidence score 0-100
- liquidityProvider: "Aave", "Uniswap", or "Balancer"
- gasSponsorship: boolean for Pimlico sponsorship

Also generate 3-5 champion wallets with:
- address: ethereum address
- winRate: success percentage
- totalPnL: profit/loss amount
- activeStrategies: array of strategy names
- status: "Optimized", "Syncing", or "Forging"

Return ONLY valid JSON with this structure:
{
  "strategies": [Strategy objects],
  "wallets": [ChampionWallet objects]
}
`;

    console.log('🚀 Sending prompt to Gemini AI...');

    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini AI');
    }

    const data = JSON.parse(responseText);
    console.log('✅ Successfully forged strategies with Gemini AI:', data.strategies?.length || 0);

    // Validate response structure
    if (!data.strategies || !Array.isArray(data.strategies)) {
      throw new Error('Invalid strategies format from AI');
    }
    if (!data.wallets || !Array.isArray(data.wallets)) {
      throw new Error('Invalid wallets format from AI');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Gemini AI forging failed:', error.message);

    // Fallback: try with Gemini Flash if Pro fails
    try {
      console.log('🔄 Falling back to Gemini Flash...');
      const ai = initializeGemini();
      const flashModel = ai.models.gemini_1_5_flash;

      const simplePrompt = `Generate 3 basic arbitrage strategies as JSON with fields: id, name, roi, active, score, liquidityProvider. Return only JSON.`;

      const response = await flashModel.generateContent({
        contents: [{ parts: [{ text: simplePrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5
        }
      });

      const fallbackText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      const fallbackData = JSON.parse(fallbackText || '{}');
      return fallbackData;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return DEFAULT_FORGE_DATA as any;
    }
  }
};
