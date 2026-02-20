const { Pool } = require('pg');
const logger = require('./logger');

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pgPool.on('error', (err, client) => {
  logger.error({ err, client }, 'Unexpected error on idle PostgreSQL client');
  process.exit(-1);
});

const connectToDB = async () => {
  try {
    // The pool will establish connections as they are needed.
    // This is a good place to run a single query to check the connection.
    await pgPool.query('SELECT NOW()');
    logger.info('Successfully connected to PostgreSQL');
  } catch (e) {
    logger.error({ err: e }, 'Failed to connect to PostgreSQL on startup.');
  }
};

module.exports = { pgPool, connectToDB };