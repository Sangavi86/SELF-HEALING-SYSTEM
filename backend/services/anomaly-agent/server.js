require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('../../shared/database/connectDB');
const SystemMetrics = require('../../shared/database/models/SystemMetrics');
const Incident = require('../../shared/database/models/Incident');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

const FLASK_API_URL = 'http://localhost:5002/predict';

// --- Background Anomaly Checker ---
const checkAnomalies = async () => {
  try {
    // Get the latest metric
    const latestMetric = await SystemMetrics.findOne().sort({ timestamp: -1 });
    if (!latestMetric) return;

    // Send to Flask AI
    const response = await axios.post(FLASK_API_URL, {
      cpuUsage: latestMetric.cpuUsage,
      memoryUsage: latestMetric.memoryUsage,
      diskUsage: latestMetric.diskUsage,
      networkUsage: latestMetric.networkUsage
    });

    const prediction = response.data;

    // If anomaly detected, create an incident
    if (prediction.anomaly) {
      console.log(`[ALERT] Anomaly Detected! Type: ${prediction.anomalyType}, Confidence: ${prediction.confidence}`);
      
      // Check if we recently created an incident for the same type to avoid spamming
      const recentIncident = await Incident.findOne({
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
        title: `System Anomaly: ${prediction.anomalyType}`
      });

      if (!recentIncident) {
        const incident = new Incident({
          title: `System Anomaly: ${prediction.anomalyType}`,
          description: `Anomaly detected by Isolation Forest model. Confidence: ${prediction.confidence}. CPU: ${latestMetric.cpuUsage.toFixed(1)}%, Mem: ${latestMetric.memoryUsage.toFixed(1)}%`,
          severity: prediction.anomalyType === 'HIGH_CPU' || prediction.anomalyType === 'HIGH_MEMORY' ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          rootCause: 'Pending Analysis'
        });
        await incident.save();
        console.log(`[INFO] Incident created: ${incident._id}`);
      }
    }
  } catch (error) {
    console.error('[ERROR] Failed to check anomalies:', error.message);
  }
};

// Start checker every 10 seconds (offset from monitoring-agent)
setInterval(checkAnomalies, 10000);

// --- REST APIs ---

// GET /anomalies - Returns anomalies (we infer this by fetching Incidents that are Anomalies)
// Or wait, the requirement says "GET /anomalies", but I don't have an Anomaly model explicitly storing each detection event. 
// Ah, we can fetch Incidents with title starting with "System Anomaly"
app.get('/anomalies', async (req, res) => {
  try {
    const anomalies = await Incident.find({ title: /System Anomaly/ })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /anomalies/latest
app.get('/anomalies/latest', async (req, res) => {
  try {
    const anomaly = await Incident.findOne({ title: /System Anomaly/ }).sort({ timestamp: -1 });
    res.json(anomaly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /predict-anomaly - Direct pass-through to Flask
app.post('/predict-anomaly', async (req, res) => {
  try {
    const response = await axios.post(FLASK_API_URL, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Anomaly Agent is running on port ${PORT}`);
});
