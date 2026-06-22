const mongoose = require('mongoose');

const healingActionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  actionType: { type: String, required: true },
  targetServiceId: { type: String, required: true },
  reason: { type: String },
  relatedIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  status: { type: String, enum: ['INITIATED', 'IN_PROGRESS', 'SUCCESS', 'FAILED'], default: 'INITIATED' },
  resultDetails: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('HealingAction', healingActionSchema);
