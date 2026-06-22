const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  predictedIssue: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  estimatedTimeToFailure: { type: Number },
  targetServiceId: { type: String, required: true },
  recommendedAction: { type: String },
  status: { type: String, enum: ['PENDING', 'MITIGATED', 'FAILED'], default: 'PENDING' }
});

module.exports = mongoose.model('Prediction', predictionSchema);
