const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  tradeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  chain: {
    type: String,
    enum: ['ETH', 'SOL', 'BASE', 'ARB'],
    default: 'ETH'
  },
  type: {
    type: String,
    enum: ['FLASH_LOAN_ARBITRAGE', 'CROSS_DEX_TRADING', 'LIQUIDITY_SNIPING', 'MEV_PROTECTION'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  amount: {
    type: String, // Amount in wei or smallest unit
    required: true
  },
  tokenIn: {
    type: String, // Token address or symbol
    required: true
  },
  tokenOut: {
    type: String, // Token address or symbol
    required: true
  },
  dexPath: [{
    dex: String, // e.g., 'Uniswap', 'Sushiswap'
    tokenIn: String,
    tokenOut: String,
    amountIn: String,
    amountOut: String
  }],
  profit: {
    expected: String,
    actual: String,
    percentage: Number
  },
  gasUsed: String,
  gasPrice: String,
  slippage: Number, // in percentage
  executionTime: Number, // in milliseconds
  transactionHash: String,
  blockNumber: Number,
  errorMessage: String,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  copiedFrom: {
    wallet: String,
    strategy: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
tradeSchema.index({ status: 1, createdAt: -1 });
tradeSchema.index({ walletAddress: 1, createdAt: -1 });
tradeSchema.index({ strategyId: 1 });

// Virtual for profit margin
tradeSchema.virtual('profitMargin').get(function() {
  if (this.profit.actual && this.amount) {
    return (parseFloat(this.profit.actual) / parseFloat(this.amount)) * 100;
  }
  return 0;
});

// Instance method to update status
tradeSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  Object.assign(this, additionalData);
  return this.save();
};

// Instance method to calculate profit
tradeSchema.methods.calculateProfit = function(actualAmountOut) {
  const expected = parseFloat(this.profit.expected || '0');
  const actual = parseFloat(actualAmountOut);
  this.profit.actual = actualAmountOut;
  this.profit.percentage = expected > 0 ? ((actual - expected) / expected) * 100 : 0;
  return this.save();
};

// Static method to find trades by wallet
tradeSchema.statics.findByWallet = function(walletAddress, limit = 50) {
  return this.find({ walletAddress })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('strategyId');
};

// Static method to get trade statistics
tradeSchema.statics.getStatistics = function(walletAddress = null, days = 30) {
  const match = walletAddress ? { walletAddress } : {};
  match.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        successfulTrades: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedTrades: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        totalProfit: { $sum: { $toDouble: '$profit.actual' } },
        averageExecutionTime: { $avg: '$executionTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('Trade', tradeSchema);
