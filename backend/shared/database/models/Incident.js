const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  title: { type: String, required: true },
  description: { type: String },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  rootCause: { type: String },
  resolutionSteps: [{ type: String }],
  relatedAnomalies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Anomaly' }]
});

module.exports = mongoose.model('Incident', incidentSchema);
