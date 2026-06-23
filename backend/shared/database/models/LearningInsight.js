const mongoose = require('mongoose');

const learningInsightSchema = new mongoose.Schema({
  rootCause: { type: String, required: true },
  recommendedAction: { type: String, required: true },
  
  // Base stats
  totalExecutions: { type: Number, default: 0 },
  successfulExecutions: { type: Number, default: 0 },
  failedExecutions: { type: Number, default: 0 },
  
  // Analytics
  rootCauseFrequency: { type: Number, default: 0 },
  averageRecoveryTime: { type: Number, default: 0 },
  averageVerificationScore: { type: Number, default: 0 },
  
  // Confidence components
  successRate: { type: Number, default: 0 },
  historicalFrequency: { type: Number, default: 0 },
  recencyFactor: { type: Number, default: 0 },
  recommendationConfidence: { type: Number, default: 0 },
  
  // Ecosystem metrics
  shei: { type: Number, default: 0 },
  trendDirection: { type: String, enum: ['IMPROVING', 'STABLE', 'DECLINING'], default: 'STABLE' },
  
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningInsight', learningInsightSchema);
