const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
  url: process.env.REDIS_URL
});

// A separate client is needed for pub/sub mode
const redisSubscriber = redisClient.duplicate();

redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
redisSubscriber.on('error', (err) => logger.error({ err }, 'Redis Subscriber Error'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    if (!redisSubscriber.isOpen) await redisSubscriber.connect();
    logger.info('Successfully connected to Redis');
  } catch (e) {
    logger.error({ err: e }, 'Failed to connect to Redis');
    throw e;
  }
};

module.exports = { redisClient, redisSubscriber, connectRedis };