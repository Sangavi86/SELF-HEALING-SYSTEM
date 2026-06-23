const mongoose = require('mongoose');

const healingActionSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  rootCause: { type: String, required: true },
  action: { type: String, required: true },
  recommendedAction: { type: String },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  successProbability: { type: Number },
  rollbackPlan: { type: String },
  approvalRequired: { type: Boolean, default: false },
  
  status: { type: String, enum: ['PENDING', 'REQUIRES_APPROVAL', 'IN_PROGRESS', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  result: { type: String },
  
  // Verification components
  verificationScore: { type: Number },
  metricRecovery: { type: Number },
  serviceHealth: { type: Number },
  errorReduction: { type: Number },
  historicalHealingSuccess: { type: Number }
});

module.exports = mongoose.model('HealingAction', healingActionSchema);
