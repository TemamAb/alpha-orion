const express = require('express');
const router = express.Router();
const { redisClient } = require('./backend-services/services/user-api-service/src/redis-client'); // Assuming redis client is accessible

/**
 * GET /benchmarking/status
 * Returns the current status of the Apex Benchmarking System.
 * Data is derived from real-time telemetry and compared against competitor benchmarks.
 */
router.get('/status', async (req, res) => {
  try {
    // Fetch live benchmark data from Redis.
    // A separate benchmarking engine is responsible for populating these keys.
    const benchmarkData = await redisClient.get('live_benchmark_data');

    if (benchmarkData) {
      res.json({
        success: true,
        source: 'live',
        data: JSON.parse(benchmarkData)
      });
    } else {
      res.status(404).json({
        success: false,
        source: 'live',
        error: 'Live benchmark data not available. The benchmarking engine may not be running or has not populated data yet.'
      });
    }

  } catch (error) {
    console.error('Error fetching benchmark status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmark status'
    });
  }
});

/**
 * POST /benchmarking/record
 * Internal endpoint for services to record benchmark metrics.
 */
router.post('/record', async (req, res) => {
  try {
    // This endpoint is used by the benchmarking engine to push live data.
    const data = req.body;
    await redisClient.set('live_benchmark_data', JSON.stringify(data));
    res.json({ success: true, data: { recorded: true } });
  } catch (error) {
    console.error('Error recording benchmark data:', error);
    res.status(500).json({ success: false, error: 'Failed to record data' });
  }
});

module.exports = router;