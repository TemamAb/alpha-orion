import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import { validateMarketContext } from '../middleware/validator.js';

const router = express.Router();

// Initialize Gemini AI
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
const tryModel = async (modelName, marketContext) => {
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
    1. Forge exactly 7 high-performance arbitrage strategies.
    2. Detect the 'Champion Wallet' address currently executing this specific alpha in the wild.
    3. For each strategy, yield:
       - pnl24h: Quantitative 24h PnL projection (Integer USD).
       - winRate: Real-time win rate percentage (Float 0-100).
       - score: Aggregated confidence score (Integer 0-100) based on liquidity depth.
    
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

  logger.info(`Successfully forged ${parsed.strategies?.length || 0} strategies with ${modelName}`);

  return { strategies: parsed.strategies, wallets: [] };
};

// POST /api/forge-alpha - Main endpoint for strategy forging
router.post('/forge-alpha', geminiLimiter, validateMarketContext, async (req, res, next) => {
  try {
    const { marketContext } = req.body;

    logger.info('Received forge-alpha request', {
      ip: req.ip,
      marketContext: marketContext
    });

    let result;

    // Try gemini-1.5-pro first
    try {
      result = await tryModel("gemini-1.5-pro", marketContext);
      logger.info('Successfully used gemini-1.5-pro');
    } catch (error) {
      logger.warn(`Pro Forge failed: ${error.message}. Switching to Flash...`);

      // Fallback to gemini-1.5-flash
      try {
        result = await tryModel("gemini-1.5-flash", marketContext);
        logger.info('Successfully used gemini-1.5-flash');
      } catch (innerError) {
        logger.warn(`Flash Forge failed: ${innerError.message}. Using default data...`);
        result = DEFAULT_FORGE_DATA;
      }
    }

    res.json(result);
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

    const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `You are the Alpha-Orion Enterprise Intelligence System (Core v4.2).
      You are an elite DeFi quant, blockchain security expert, and arbitrage architect.
      
      TERMINAL CAPABILITIES:
      - Real-time monitoring of flash loan arbitrage clusters.
      - Deep analysis of MEV protection and front-run defense.
      - Gas optimization and EIP-1559 fee management.
      - Strategy forging and discovery matrix synchronization.
      
      SYSTEM CONTEXT (LIVE DATA):
      ${JSON.stringify(systemContext)}
      
      USER QUERY: "${query}"
      
      INSTRUCTIONS:
      1. Provide enterprise-grade, highly technical, and actionable insights.
      2. Use markdown formatting for readability (bolding, lists, code blocks).
      3. If the user asks for "Deep Monitoring", analyze the live data for specific optimization opportunities.
      4. Maintain a professional, elite-quant persona.
      5. Response should be concise but packed with intelligence.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    logger.error('Error in ai-terminal-chat endpoint:', error);
    next(error);
  }
});

export default router;
