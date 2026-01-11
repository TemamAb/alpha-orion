# ArbiNexus Enterprise Backend API

Backend proxy service for the ArbiNexus flash loan arbitrage platform. This service securely handles Gemini AI API calls and provides health monitoring endpoints.

## Features

- 🔐 **Secure API Key Management** - API keys never exposed to client
- 🛡️ **Rate Limiting** - Prevents API abuse (10 req/min general, 5 req/min for AI)
- ✅ **Input Validation** - Sanitizes and validates all inputs
- 📊 **Comprehensive Logging** - Winston-based structured logging
- 🏥 **Health Checks** - Multiple health check endpoints for monitoring
- 🚀 **Production Ready** - Error handling, CORS, security headers

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Gemini API key from Google AI Studio

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the PORT specified in .env)

## API Endpoints

### Health Checks

#### GET /health
Returns comprehensive health status including uptime, memory usage, and service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "3600s",
  "version": "4.2.0",
  "services": {
    "gemini": "configured",
    "server": "running",
    "memory": {
      "used": "45MB",
      "total": "128MB"
    }
  },
  "environment": "production"
}
```

#### GET /ready
Kubernetes-style readiness probe. Returns 200 if service is ready to accept traffic.

#### GET /live
Kubernetes-style liveness probe. Returns 200 if service is alive.

### AI Strategy Forging

#### POST /api/forge-alpha
Generates arbitrage strategies using Gemini AI.

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "marketContext": {
    "aave_liquidity": 4500000,
    "active_integrations": ["1Click", "DexTools", "BitQuery", "EtherscanPro"],
    "network_load": "Low",
    "mempool_volatility": "0.24%"
  }
}
```

**Response:**
```json
{
  "strategies": [
    {
      "id": "s1",
      "name": "L2 Flash Arbitrage (Aave-Uni)",
      "roi": 1.2,
      "liquidityProvider": "Aave",
      "score": 94,
      "gasSponsorship": true,
      "active": true,
      "championWalletAddress": "0xAlpha...9283",
      "pnl24h": 1240,
      "winRate": 98.2
    }
    // ... more strategies
  ],
  "wallets": []
}
```

## Security Features

### Rate Limiting
- General API: 10 requests per minute
- Gemini AI calls: 5 requests per minute
- Automatic IP-based tracking

### Input Validation
- Request size limit: 1MB
- Market context validation
- Numeric value sanitization
- String length limits
- Array size limits

### Security Headers
- Helmet.js for security headers
- Content Security Policy
- CORS configuration
- XSS protection

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Security event logging

## Error Handling

All errors are logged and returned in a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "stack": "Stack trace (development only)"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Monitoring

### Log Files
Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Health Monitoring
Use the `/health` endpoint for monitoring:
```bash
curl http://localhost:3001/health
```

## Deployment

### Render.com
The service is configured for Render.com deployment via `render.yaml` in the root directory.

**Environment Variables to Set in Render Dashboard:**
- `GEMINI_API_KEY` - Your Gemini API key
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your frontend URL
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Docker
```bash
# Build
docker build -t arbinexus-backend .

# Run
docker run -p 3001:3001 --env-file .env arbinexus-backend
```

## Development

### Project Structure
```
backend/
├── config/
│   └── logger.js          # Winston logger configuration
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   ├── rateLimiter.js     # Rate limiting middleware
│   ├── requestLogger.js   # Request logging
│   └── validator.js       # Input validation
├── routes/
│   ├── gemini.js          # Gemini AI endpoints
│   └── health.js          # Health check endpoints
├── logs/                  # Log files (auto-created)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── README.md             # This file
└── server.js             # Main server file
```

### Adding New Endpoints
1. Create route file in `routes/`
2. Import and use in `server.js`
3. Add appropriate middleware (rate limiting, validation)
4. Update this README

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### CORS Issues
Ensure your frontend URL is in the `ALLOWED_ORIGINS` environment variable.

### API Key Not Working
1. Verify the key is correct in `.env`
2. Check the key has proper permissions in Google AI Studio
3. Restart the server after changing `.env`

### High Memory Usage
Monitor memory with the `/health` endpoint. Consider:
- Reducing log retention
- Implementing log rotation
- Scaling horizontally

## Support

For issues and questions:
- GitHub: https://github.com/TemamAb/alpha-orion
- Documentation: See main project README

## License

MIT
