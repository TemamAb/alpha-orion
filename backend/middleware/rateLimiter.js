import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

// Rate limiter for API endpoints
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // 10 requests per minute
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '60 seconds'
    });
  },
});

// Stricter rate limiter for Gemini API calls
export const geminiLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 requests per minute for AI calls
  message: {
    error: 'AI request limit exceeded. Please wait before making more requests.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Gemini rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'AI request limit exceeded. Please wait before making more requests.',
      retryAfter: '60 seconds'
    });
  },
});
