import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import { validateMarketContext } from '../middleware/validator.js';

const router = express.Router();

// Helper to get Gemini AI instance safely
const getAIInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error('CRITICAL: GEMINI_API_KEY is missing from environment variables');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Discovery Registry
const DISCOVERY_REGISTRY = {
  ONE_CLICK_ARBITRAGE: "1CK-ENTERPRISE-SYNC-882",
  DEXTOOLS_PREMIUM: "DXT-ELITE-ALPHA-091",
  BITQUERY_V3: "BQ-REALTIME-MESH-772",
  ETHERSCAN_PRO: "ETH-PRO-WHALE-TRACK-119",
  FLASHBOTS_RPC: "FB-PROTECT-RELAY-SYNC"
};

// PRODUCTION: Empty default data - strategies only come from AI
const DEFAULT_FORGE_DATA = {
  strategies: [],
  wallets: []
};

// Helper function to try a specific model
const tryForgeModel = async (modelName, marketContext) => {
  const ai = getAIInstance();
  if (!ai) throw new Error("AI Service Unconfigured");

  logger.info(`Attempting to forge alpha with model: ${modelName}`);
  const model = ai.getGenerativeModel({ model: modelName });

  const prompt = `You are the ArbiNexus Alpha Forging Engine. 
    Act as a high-frequency trading quant. 
    
    ACTIVE DATA INTEGRATIONS:
    - 1Click Arbitrage Discovery (ID: ${DISCOVERY_REGISTRY.ONE_CLICK_ARBITRAGE})
    - DexTools Premium Engine (ID: ${DISCOVERY_REGISTRY.DEXTOOLS_PREMIUM})
    - BitQuery Real-time Mesh (ID: ${DISCOVERY_REGISTRY.BITQUERY_V3})
    - Etherscan Pro Whale Tracker (ID: ${DISCOVERY_REGISTRY.ETHERSCAN_PRO})
    
    TASK:
    1. Forge exactly 7 high-performance arbitrage strategies, one for each core cluster:
       - L2 Flash Arbitrage (Aave-Uni)
       - Cross-Dex Rebalance (Eth-Usdc)
       - Mempool Front-run Protection
       - Stabilizer Alpha #09
       - L2 Sequential Executor
       - Delta Neutral Forge
       - Shadow Mempool Sweep
    2. Detect the 'Champion Wallet' address currently executing this specific alpha in the wild for each type.
    3. For each strategy, yield:
       - pnl24h: Quantitative 24h PnL projection (Integer USD).
       - winRate: Real-time win rate percentage (Float 0-100).
       - score: Aggregated confidence score (Integer 0-100) based on liquidity depth.
    
    CORE REQUIREMENT:
    Output must be hyper-focused on these 7 specific routes to ensure execution consistency across the ArbiNexus cluster.
    
    Market Context: ${JSON.stringify(marketContext)}
    
    Return ONLY valid JSON with this structure:
    {
      "strategies": [
        {
          "id": "string",
          "name": "string",
          "roi": number,
          "liquidityProvider": "Aave" | "Uniswap" | "Balancer",
          "score": number,
          "gasSponsorship": boolean,
          "active": boolean,
          "championWalletAddress": "string",
          "pnl24h": number,
          "winRate": number
        }
      ]
    }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Empty response from AI");
  }

  // Handle potential markdown formatting in response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text;
  const parsed = JSON.parse(jsonText);

  return { strategies: parsed.strategies, wallets: [] };
};

// POST /api/forge-alpha - Main endpoint for strategy forging
router.post('/forge-alpha', geminiLimiter, validateMarketContext, async (req, res, next) => {
  try {
    const { marketContext } = req.body;
    logger.info('Received forge-alpha request', { marketContext });

    try {
      const result = await tryForgeModel("gemini-1.5-pro", marketContext);
      return res.json(result);
    } catch (error) {
      logger.warn(`Pro Forge failed: ${error.message}. Switching to Flash...`);
      try {
        const result = await tryForgeModel("gemini-1.5-flash", marketContext);
        return res.json(result);
      } catch (innerError) {
        logger.error(`Critical Forge Failure: ${innerError.message}`);
        return res.json(DEFAULT_FORGE_DATA);
      }
    }
  } catch (error) {
    logger.error('Error in forge-alpha endpoint:', error);
    next(error);
  }
});

// POST /api/ai-terminal-chat - Conversational endpoint for AI Terminal
router.post('/ai-terminal-chat', geminiLimiter, async (req, res, next) => {
  try {
    const { query, systemContext } = req.body;
    logger.info('Received terminal-chat request', { query });

    const ai = getAIInstance();
    if (!ai) {
      return res.status(503).json({
        response: "🤖 **Intelligence Offline**: The Gemini API key is missing. Please configure `GEMINI_API_KEY` in the environment variables."
      });
    }

    const tryChat = async (modelName) => {
      const model = ai.getGenerativeModel({ model: modelName });
      const prompt = `You are the Alpha-Orion Enterprise Intelligence System (Core v4.2).
        You are an elite DeFi quant and arbitrage architect.
        
        TERMINAL CAPABILITIES:
        - Real-time monitoring of the Seven Champion Strategy Clusters.
        - DEEP DISCOVERY: Identifying Champion Wallets.
        - STRATEGY SYNTHESIS: L2 Flash Arbitrage, Mempool Protection, Shadow Sweeps.
        
        SYSTEM CONTEXT (LIVE DATA):
        ${JSON.stringify(systemContext)}
        
        USER QUERY: "${query}"
        
        INSTRUCTIONS:
        1. Provide enterprise-grade, technical, and actionable insights.
        2. Use markdown.
        3. Maintain an elite-quant persona.
        4. If the user asks for "Profit Status", confirm the system is in LIVE sync mode.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    };

    try {
      const text = await tryChat("gemini-1.5-pro");
      res.json({ response: text });
    } catch (error) {
      logger.warn(`Pro Chat failed: ${error.message}. Switching to Flash...`);
      try {
        const text = await tryChat("gemini-1.5-flash");
        res.json({ response: text });
      } catch (innerError) {
        logger.error(`Critical Chat Failure: ${innerError.message}`);
        res.status(500).json({
          response: "🤖 **Uplink Error**: I am currently unable to process your request due to an internal AI provider error. Details: " + innerError.message
        });
      }
    }
  } catch (error) {
    logger.error('Error in ai-terminal-chat endpoint:', error);
    next(error);
  }
});

export default router;
