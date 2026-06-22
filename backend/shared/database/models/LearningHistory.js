const mongoose = require('mongoose');

const learningHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  modelId: { type: String, required: true },
  trainingDataRef: { type: String },
  accuracyImprovement: { type: Number },
  loss: { type: Number },
  epochsCompleted: { type: Number },
  status: { type: String, enum: ['STARTED', 'COMPLETED', 'FAILED'], default: 'COMPLETED' }
});

module.exports = mongoose.model('LearningHistory', learningHistorySchema);
