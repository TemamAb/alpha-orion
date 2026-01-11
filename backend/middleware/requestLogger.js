import morgan from 'morgan';
import logger from '../config/logger.js';

// Create a stream object with a 'write' function that will be used by morgan
const stream = {
  write: (message) => logger.http(message.trim())
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Build the morgan middleware
export const requestLogger = morgan(
  // Define message format string (this is the default one)
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);
