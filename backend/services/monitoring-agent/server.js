require('dotenv').config();
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const connectDB = require('../../shared/database/connectDB');
const SystemMetrics = require('../../shared/database/models/SystemMetrics');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// --- Metric Collector ---
const collectMetrics = async () => {
  try {
    const [cpu, mem, disk, network, osInfo, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
      si.time()
    ]);

    // Calculate overall disk usage percentage
    let totalSize = 0;
    let totalUsed = 0;
    disk.forEach(d => {
      totalSize += d.size;
      totalUsed += d.used;
    });
    const diskUsage = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;

    // Calculate network usage
    let rx_sec = 0;
    let tx_sec = 0;
    network.forEach(n => {
      rx_sec += n.rx_sec;
      tx_sec += n.tx_sec;
    });

    // Create record
    const metric = new SystemMetrics({
      serviceId: 'monitoring-agent',
      cpuUsage: cpu.currentLoad,
      memoryUsage: (mem.used / mem.total) * 100,
      diskUsage: diskUsage,
      networkIn: rx_sec,
      networkOut: tx_sec,
      networkUsage: rx_sec + tx_sec, // Simplistic metric
      uptime: time.uptime,
      hostName: osInfo.hostname,
      osPlatform: osInfo.platform,
    });

    await metric.save();
  } catch (error) {
    console.error('Error collecting metrics:', error);
  }
};

// Start collector every 10 seconds
setInterval(collectMetrics, 10000);

// --- REST APIs ---

// GET /metrics - latest 100
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await SystemMetrics.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /metrics/latest - newest record
app.get('/metrics/latest', async (req, res) => {
  try {
    const metric = await SystemMetrics.findOne().sort({ timestamp: -1 });
    res.json(metric);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /metrics/stats - averages
app.get('/metrics/stats', async (req, res) => {
  try {
    const stats = await SystemMetrics.aggregate([
      {
        $group: {
          _id: null,
          avgCpu: { $avg: '$cpuUsage' },
          avgMem: { $avg: '$memoryUsage' },
          avgDisk: { $avg: '$diskUsage' },
          avgNetwork: { $avg: '$networkUsage' }
        }
      }
    ]);
    res.json(stats[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Monitoring Agent is running on port ${PORT}`);
});
