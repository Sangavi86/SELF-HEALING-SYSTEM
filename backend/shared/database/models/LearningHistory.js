const mongoose = require('mongoose');

const learningHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  rootCause: { type: String, required: true },
  action: { type: String, required: true },
  previousConfidence: { type: Number },
  newConfidence: { type: Number },
  reason: { type: String },
  shei: { type: Number }
});

module.exports = mongoose.model('LearningHistory', learningHistorySchema);
