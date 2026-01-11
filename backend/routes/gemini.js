import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import logger from '../config/logger.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import { validateMarketContext } from '../middleware/validator.js';

const router = express.Router();

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `You are the ArbiNexus Alpha Forging Engine. 
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
    
    Market Context: ${JSON.stringify(marketContext)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                roi: { type: Type.NUMBER },
                liquidityProvider: { type: Type.STRING },
                score: { type: Type.INTEGER },
                gasSponsorship: { type: Type.BOOLEAN },
                active: { type: Type.BOOLEAN },
                championWalletAddress: { type: Type.STRING },
                pnl24h: { type: Type.NUMBER },
                winRate: { type: Type.NUMBER }
              },
              required: ["id", "name", "roi", "liquidityProvider", "score", "championWalletAddress", "pnl24h", "winRate"]
            }
          }
        },
        required: ["strategies"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from AI");
  }

  const parsed = JSON.parse(text);
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

    // Try gemini-3-pro-preview first
    try {
      result = await tryModel("gemini-3-pro-preview", marketContext);
      logger.info('Successfully used gemini-3-pro-preview');
    } catch (error) {
      logger.warn(`Pro Forge failed: ${error.message}. Switching to Flash...`);
      
      // Fallback to gemini-3-flash-preview
      try {
        result = await tryModel("gemini-3-flash-preview", marketContext);
        logger.info('Successfully used gemini-3-flash-preview');
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

export default router;
