const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  chain: {
    type: String,
    enum: ['ETH', 'SOL', 'BASE', 'ARB'],
    default: 'ETH'
  },
  winRate: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  totalPnl: {
    type: String,
    required: true
  },
  dailyProfit: {
    type: String,
    required: true
  },
  percentile: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  isPrivateRPC: {
    type: Boolean,
    default: true
  },
  riskRating: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  strategies: [{
    type: String,
    enum: ['Flash Loan Arbitrage', 'Cross-DEX Trading', 'MEV Protection', 'Liquidity Sniping', 'Atomic Trading']
  }],
  insights: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['ANALYZING', 'VERIFIED', 'ACTIVE', 'INACTIVE'],
    default: 'ANALYZING'
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  performanceMetrics: {
    totalTrades: { type: Number, default: 0 },
    successfulTrades: { type: Number, default: 0 },
    failedTrades: { type: Number, default: 0 },
    averageProfit: { type: String, default: '0' },
    maxDrawdown: { type: String, default: '0' },
    sharpeRatio: { type: Number, default: 0 }
  },
  copiedTrades: [{
    tradeId: String,
    timestamp: Date,
    profit: String,
    status: {
      type: String,
      enum: ['PENDING', 'EXECUTED', 'FAILED'],
      default: 'PENDING'
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
strategySchema.index({ percentile: -1 });
strategySchema.index({ winRate: -1 });
strategySchema.index({ 'performanceMetrics.totalTrades': -1 });

// Virtual for profit percentage
strategySchema.virtual('profitPercentage').get(function() {
  // Simple calculation - can be enhanced
  return parseFloat(this.totalPnl.replace(/[$,M]/g, '')) / 1000000 * 100;
});

// Instance method to update performance
strategySchema.methods.updatePerformance = function(tradeResult) {
  this.performanceMetrics.totalTrades += 1;
  if (tradeResult.success) {
    this.performanceMetrics.successfulTrades += 1;
  } else {
    this.performanceMetrics.failedTrades += 1;
  }
  // Update other metrics...
  return this.save();
};

// Static method to find top performers
strategySchema.statics.findTopPerformers = function(limit = 10) {
  return this.find({ status: 'ACTIVE' })
    .sort({ percentile: -1, winRate: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Strategy', strategySchema);
