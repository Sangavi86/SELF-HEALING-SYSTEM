const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  serviceId: { type: String, required: true },
  level: { type: String, enum: ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'], default: 'INFO' },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('Log', logSchema);
