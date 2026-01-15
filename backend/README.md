# Arbitrage Flash Loan Backend

Enterprise-grade backend service for automated arbitrage flash loan trading, featuring AI-powered wallet strategy analysis and copying.

## Features

- **AI-Powered Strategy Analysis**: Uses Gemini AI to analyze and rank top-performing arbitrage wallets
- **Flash Loan Execution**: Automated execution of arbitrage opportunities using Aave flash loans
- **Wallet Mirroring**: Copy successful trading strategies from top-performing wallets
- **Multi-Chain Support**: Ethereum, Base, Arbitrum, and Solana support
- **Risk Management**: Built-in risk controls and profit/loss monitoring
- **Real-time Monitoring**: Comprehensive logging and performance tracking
- **Enterprise Security**: Multi-sig support, encrypted storage, and audit trails

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │  Blockchain     │
│   (Orion-like)  │◄──►│   (Express.js)  │◄──►│  (Web3/Ethers)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Service    │
                       │   (Gemini AI)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │ (MongoDB/Redis) │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Docker (optional)

### Installation

1. Clone the repository:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB and Redis:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

5. Start the server:
```bash
npm run dev  # Development
npm start    # Production
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t arbitrage-backend .
docker run -p 5000:5000 arbitrage-backend
```

## API Documentation

### Strategy Analysis

#### Analyze Wallet
```http
POST /api/strategies/analyze
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "chain": "ETH"
}
```

#### Get Top Strategies
```http
GET /api/strategies?limit=10&chain=ETH
```

### Flash Loan Execution

#### Execute Arbitrage
```http
POST /api/execute-flash-loan
Content-Type: application/json

{
  "strategyId": "strategy_id",
  "tokenIn": "0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d",
  "tokenOut": "0xA0b86a33E6441e88C5F2712C3E9b74Ae1f0f2c4d",
  "amount": "1000000",
  "dexPath": ["Uniswap", "Sushiswap"],
  "slippageTolerance": 0.005
}
```

#### Mirror Wallet Strategy
```http
POST /api/mirror-wallet
Content-Type: application/json

{
  "sourceWallet": "0x123...",
  "targetWallet": "0x456...",
  "strategyId": "strategy_id"
}
```

### Trade Management

#### Get Trade History
```http
GET /api/trades?walletAddress=0x123...&limit=50
```

#### Get Trade Statistics
```http
GET /api/trades/statistics?walletAddress=0x123...&days=30
```

### Blockchain Information

#### Get Balance
```http
GET /api/blockchain/balance/0x123...
```

#### Get Gas Price
```http
GET /api/blockchain/gas-price
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/arbitrage` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PRIVATE_KEY` | Blockchain private key | Required |
| `GEMINI_API_KEY` | Gemini AI API key | Required |

### Risk Management

- **Maximum Daily Loss**: $10,000
- **Maximum Trade Size**: $100,000
- **Minimum Profit Threshold**: 0.5%
- **Slippage Tolerance**: 0.5%

## Security

- **Multi-sig Support**: All transactions require multiple approvals
- **Encrypted Storage**: Sensitive data is encrypted at rest
- **Rate Limiting**: API endpoints are protected against abuse
- **Audit Logging**: All actions are logged for compliance
- **Input Validation**: All inputs are validated and sanitized

## Monitoring

- **Health Checks**: `/api/health` endpoint for service monitoring
- **Prometheus Metrics**: Comprehensive metrics collection
- **Grafana Dashboards**: Real-time visualization
- **Winston Logging**: Structured logging with multiple transports

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] SSL certificates installed
- [ ] Monitoring alerts configured
- [ ] Security audit completed
- [ ] Load testing performed

### Scaling

- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Sharding**: MongoDB sharding for high throughput
- **Redis Cluster**: Distributed caching for performance
- **CDN**: Static assets served via CDN

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Email: support@arbitrage-platform.com
- Discord: [Arbitrage Platform](https://discord.gg/arbitrage)
- Documentation: [docs.arbitrage-platform.com](https://docs.arbitrage-platform.com)
