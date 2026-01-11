import logger from '../config/logger.js';

// Validate market context for Gemini API calls
export const validateMarketContext = (req, res, next) => {
  const { marketContext } = req.body;

  if (!marketContext) {
    logger.warn('Market context validation failed: missing marketContext');
    return res.status(400).json({
      error: 'Market context is required',
      field: 'marketContext'
    });
  }

  // Validate marketContext structure
  if (typeof marketContext !== 'object') {
    logger.warn('Market context validation failed: invalid type');
    return res.status(400).json({
      error: 'Market context must be an object',
      field: 'marketContext'
    });
  }

  // Sanitize numeric values to prevent injection
  if (marketContext.aave_liquidity !== undefined) {
    const liquidity = parseFloat(marketContext.aave_liquidity);
    if (isNaN(liquidity) || liquidity < 0) {
      return res.status(400).json({
        error: 'Invalid aave_liquidity value',
        field: 'marketContext.aave_liquidity'
      });
    }
    marketContext.aave_liquidity = liquidity;
  }

  // Sanitize string values
  if (marketContext.network_load) {
    marketContext.network_load = String(marketContext.network_load).substring(0, 50);
  }

  if (marketContext.mempool_volatility) {
    marketContext.mempool_volatility = String(marketContext.mempool_volatility).substring(0, 20);
  }

  // Validate active_integrations array
  if (marketContext.active_integrations) {
    if (!Array.isArray(marketContext.active_integrations)) {
      return res.status(400).json({
        error: 'active_integrations must be an array',
        field: 'marketContext.active_integrations'
      });
    }
    // Limit array size and sanitize strings
    marketContext.active_integrations = marketContext.active_integrations
      .slice(0, 10)
      .map(item => String(item).substring(0, 50));
  }

  next();
};

// General request body size validator
export const validateRequestSize = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 1024 * 1024; // 1MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn(`Request too large: ${contentLength} bytes from IP: ${req.ip}`);
    return res.status(413).json({
      error: 'Request payload too large',
      maxSize: '1MB'
    });
  }

  next();
};
