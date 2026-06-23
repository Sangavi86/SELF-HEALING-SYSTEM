require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('../../shared/database/connectDB');
const Incident = require('../../shared/database/models/Incident');
const RootCauseAnalysis = require('../../shared/database/models/RootCauseAnalysis');
const SystemMetrics = require('../../shared/database/models/SystemMetrics');
const Log = require('../../shared/database/models/Log');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

connectDB();

const FLASK_API_URL = 'http://localhost:5004/analyze';

// --- Background RCA Engine ---
const processPendingIncidents = async () => {
  try {
    // Find incidents that need RCA
    const pendingIncidents = await Incident.find({ rootCause: 'Pending Analysis' });

    for (const incident of pendingIncidents) {
      console.log(`[RCA] Processing Incident: ${incident._id}`);
      
      // Fetch latest metrics and logs (simulated context)
      const metrics = await SystemMetrics.findOne().sort({ timestamp: -1 }) || {};
      const logs = await Log.find().sort({ timestamp: -1 }).limit(10) || [];
      
      // Calculate Historical Accuracy
      let historicalAccuracy = 0.8;
      const totalRCA = await RootCauseAnalysis.countDocuments();
      if (totalRCA >= 5) {
        // Assume an RCA is "successful" or "validated" if it had high confidence
        const successfulRCA = await RootCauseAnalysis.countDocuments({ rccs: { $gte: 0.7 } });
        historicalAccuracy = successfulRCA / totalRCA;
      }

      // Analyze via Flask API
      let analysisResult;
      try {
        const response = await axios.post(FLASK_API_URL, {
          logs: logs,
          metrics: {
            cpuUsage: metrics.cpuUsage,
            memoryUsage: metrics.memoryUsage,
            diskUsage: metrics.diskUsage,
            networkUsage: metrics.networkUsage
          },
          anomalyType: incident.title.replace('System Anomaly: ', ''),
          historicalAccuracy: historicalAccuracy
        });
        analysisResult = response.data;
      } catch (err) {
        console.error('[RCA] Flask API Error:', err.message);
        continue;
      }

      // 1. Create RootCauseAnalysis Record
      const rcaRecord = new RootCauseAnalysis({
        incidentId: incident._id,
        rootCause: analysisResult.rootCause,
        confidence: analysisResult.confidence,
        rccs: analysisResult.rccs,
        evidence: {
          metricEvidence: analysisResult.metricEvidence,
          logEvidence: analysisResult.logEvidence,
          historicalEvidence: analysisResult.historicalEvidence
        }
      });
      await rcaRecord.save();

      // 2. Enhance Incident
      incident.rootCause = analysisResult.rootCause;
      incident.confidence = analysisResult.confidence;
      incident.rccs = analysisResult.rccs;
      incident.evidence = [
        ...analysisResult.logEvidence,
        ...analysisResult.metricEvidence,
        ...analysisResult.historicalEvidence
      ];
      incident.analysisTimestamp = new Date();
      await incident.save();

      console.log(`[RCA] Updated Incident ${incident._id} with Root Cause: ${incident.rootCause}`);
    }
  } catch (error) {
    console.error('[RCA] Engine Error:', error.message);
  }
};

// Start RCA Engine every 15 seconds
setInterval(processPendingIncidents, 15000);

// --- REST APIs ---

// GET /rootcauses
app.get('/rootcauses', async (req, res) => {
  try {
    const rcas = await RootCauseAnalysis.find().populate('incidentId').sort({ timestamp: -1 }).limit(100);
    res.json(rcas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rootcauses/latest
app.get('/rootcauses/latest', async (req, res) => {
  try {
    const rca = await RootCauseAnalysis.findOne().populate('incidentId').sort({ timestamp: -1 });
    res.json(rca);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /analyze-rootcause (Manual trigger)
app.post('/analyze-rootcause', async (req, res) => {
  try {
    const { anomalyId, incidentId } = req.body;
    // For demonstration, we'll just mock fetching logs/metrics and pass to Flask
    const response = await axios.post(FLASK_API_URL, {
      logs: [],
      metrics: { cpuUsage: 99 },
      anomalyType: 'HIGH_CPU',
      historicalAccuracy: 0.8
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Root Cause Agent running on port ${PORT}`);
});
