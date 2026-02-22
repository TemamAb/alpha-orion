const { createClient } = require('redis');
const logger = require('./logger');

// Check if REDIS_URL is configured
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  logger.warn('REDIS_URL not configured - Redis features will be disabled');
}

// Only create Redis client if URL is configured
let redisClient = null;
let redisSubscriber = null;

if (REDIS_URL) {
  redisClient = createClient({
    url: REDIS_URL
  });

  // A separate client is needed for pub/sub mode
  redisSubscriber = redisClient.duplicate();

  redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
  redisSubscriber.on('error', (err) => logger.error({ err }, 'Redis Subscriber Error'));
}

const connectRedis = async () => {
  if (!REDIS_URL) {
    logger.info('Skipping Redis connection - REDIS_URL not configured');
    return false;
  }
  
  try {
    if (redisClient && !redisClient.isOpen) await redisClient.connect();
    if (redisSubscriber && !redisSubscriber.isOpen) await redisSubscriber.connect();
    logger.info('Successfully connected to Redis');
    return true;
  } catch (e) {
    logger.error({ err: e }, 'Failed to connect to Redis - continuing without Redis');
    // Don't throw - continue without Redis
    redisClient = null;
    redisSubscriber = null;
    return false;
  }
};

module.exports = { redisClient, redisSubscriber, connectRedis };