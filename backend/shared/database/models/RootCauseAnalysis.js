const mongoose = require('mongoose');

const rootCauseAnalysisSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  anomalyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Anomaly' },
  rootCause: { type: String, required: true },
  confidence: { type: Number, required: true },
  rccs: { type: Number, required: true },
  evidence: { type: mongoose.Schema.Types.Mixed }, // Structured evidence
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RootCauseAnalysis', rootCauseAnalysisSchema);
