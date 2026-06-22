const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  serviceId: { type: String, required: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  predictedValue: { type: Number },
  deviationScore: { type: Number },
  status: { type: String, enum: ['DETECTED', 'INVESTIGATING', 'RESOLVED'], default: 'DETECTED' }
});

module.exports = mongoose.model('Anomaly', anomalySchema);
