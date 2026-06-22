const mongoose = require('mongoose');

const systemMetricsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  serviceId: { type: String, required: true },
  cpuUsage: { type: Number },
  memoryUsage: { type: Number },
  diskUsage: { type: Number },
  networkIn: { type: Number },
  networkOut: { type: Number },
  networkUsage: { type: Number },
  activeConnections: { type: Number },
  uptime: { type: Number },
  hostName: { type: String },
  osPlatform: { type: String }
});

module.exports = mongoose.model('SystemMetrics', systemMetricsSchema);
