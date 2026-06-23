const mongoose = require('mongoose');

const healingKnowledgeBaseSchema = new mongoose.Schema({
  rootCause: { type: String, required: true },
  action: { type: String, required: true },
  riskLevel: { type: String },
  successProbability: { type: Number },
  verificationScore: { type: Number },
  result: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealingKnowledgeBase', healingKnowledgeBaseSchema);
