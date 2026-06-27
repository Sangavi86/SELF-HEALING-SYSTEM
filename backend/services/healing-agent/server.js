process.on("uncaughtException", (err) => {
  console.error("GLOBAL UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("GLOBAL UNHANDLED REJECTION at:", promise, "reason:", reason);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const connectDB = require('../../shared/database/connectDB');
const Incident = require('../../shared/database/models/Incident');
const HealingAction = require('../../shared/database/models/HealingAction');
const HealingKnowledgeBase = require('../../shared/database/models/HealingKnowledgeBase');
const SystemMetrics = require('../../shared/database/models/SystemMetrics');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failed asynchronously during startup:", err);
  }
};
startServer();





// Healing Strategy Map
const healingStrategies = {
  "Memory Leak": { action: "Restart service", riskLevel: "HIGH", baseSuccessProb: 0.85, rollbackPlan: "Restore previous container state" },
  "High CPU Process": { action: "Kill process and restart service", riskLevel: "CRITICAL", baseSuccessProb: 0.70, rollbackPlan: "Manual intervention required" },
  "Database Connection Failure": { action: "Reconnect database", riskLevel: "MEDIUM", baseSuccessProb: 0.90, rollbackPlan: "Close orphaned connections" },
  "Connection Pool Exhaustion": { action: "Reset connection pool", riskLevel: "MEDIUM", baseSuccessProb: 0.95, rollbackPlan: "Revert to default pool size" },
  "API Timeout": { action: "Restart API service", riskLevel: "HIGH", baseSuccessProb: 0.80, rollbackPlan: "Rollback to previous API version" },
  "Network Congestion": { action: "Flush network cache", riskLevel: "LOW", baseSuccessProb: 0.99, rollbackPlan: "None required" },
  "Disk Saturation": { action: "Clean temporary files", riskLevel: "LOW", baseSuccessProb: 0.98, rollbackPlan: "None required" },
  "Service Crash": { action: "Restart service", riskLevel: "HIGH", baseSuccessProb: 0.85, rollbackPlan: "Restore previous container state" }
};

// Polling Engine
const processHealing = async () => {
  try {
    // 1. Find resolved RCA incidents without a HealingAction
    // We check incidents where rootCause is not 'Pending Analysis' and status is 'OPEN'
    const incidents = await Incident.find({ 
      rootCause: { $ne: 'Pending Analysis' }, 
      status: 'OPEN' 
    });

    for (const incident of incidents) {
      // Check if HealingAction exists
      const existingAction = await HealingAction.findOne({ incidentId: incident._id });
      if (existingAction) continue;

      console.log(`[Healing] Processing Incident: ${incident._id} | Root Cause: ${incident.rootCause}`);

      // 2. Recommendation Engine (Feedback Loop)
      let strategyAction = null;
      let risk = 'MEDIUM'; // fallback
      let successProb = 0.5;

      try {
        const learningRes = await axios.get(`http://localhost:5007/best-action/${encodeURIComponent(incident.rootCause)}`);
        if (learningRes.data && learningRes.data.bestAction) {
          strategyAction = learningRes.data.bestAction;
          // Use learned confidence to adjust probability
          successProb = learningRes.data.recommendationConfidence || 0.5;
          console.log(`[Healing] Learning Agent suggested: ${strategyAction} with conf: ${successProb}`);
        }
      } catch (err) {
        console.log(`[Healing] Learning Agent unreachable or no data for ${incident.rootCause}. Using fallback.`);
      }

      // Fallback if no learned strategy exists yet
      const fallbackStrategy = healingStrategies[incident.rootCause];
      if (!strategyAction) {
        if (!fallbackStrategy) {
           console.log(`[Healing] Unknown root cause: ${incident.rootCause}. No strategy applied.`);
           continue;
        }
        strategyAction = fallbackStrategy.action;
        successProb = fallbackStrategy.baseSuccessProb * (incident.rccs || 0.8);
      }

      // Keep risk definitions static from fallback logic if available, otherwise assume HIGH
      risk = fallbackStrategy ? fallbackStrategy.riskLevel : 'HIGH';
      const rollbackPlan = fallbackStrategy ? fallbackStrategy.rollbackPlan : 'Manual intervention required';

      successProb = Math.min(Math.max(successProb, 0.1), 0.99); // Clamp

      let approvalRequired = false;
      let status = 'PENDING';

      // 3. Safety Layer Rules
      const confidence = incident.confidence || 0;
 
      if (risk === 'LOW') {
        approvalRequired = false;
      } else if (risk === 'MEDIUM') {
        approvalRequired = confidence < 0.8;
      } else if (risk === 'HIGH') {
        approvalRequired = true;
      } else if (risk === 'CRITICAL') {
        approvalRequired = true;
      }
 
      if (approvalRequired) {
        status = 'REQUIRES_APPROVAL';
      } else {
        status = 'IN_PROGRESS';
      }
 
      const healingAction = new HealingAction({
        incidentId: incident._id,
        rootCause: incident.rootCause,
        action: strategyAction,
        recommendedAction: strategyAction,
        riskLevel: risk,
        successProbability: successProb,
        rollbackPlan: rollbackPlan,
        approvalRequired: approvalRequired,
        status: status,
        startedAt: status === 'IN_PROGRESS' ? new Date() : null
      });
 
      await healingAction.save();
      console.log(`[Healing] Created Action: ${strategyAction}. Status: ${status}`);

      // 4. If auto-executing, simulate it immediately
      if (status === 'IN_PROGRESS') {
        setTimeout(() => executeAndVerify(healingAction, incident), 2000); // Simulate 2s delay
      }
    }
  } catch (error) {
    console.error('[Healing] Engine Error:', error.message);
  }
};

// Simulation and Verification Function
const executeAndVerify = async (actionDoc, incidentDoc) => {
  try {
    console.log(`[Healing] Simulating execution of ${actionDoc.action}`);
    
    // Simulate recovery based on actual probability
    const isSuccess = Math.random() < actionDoc.successProbability;
    
    actionDoc.status = isSuccess ? 'SUCCESS' : 'FAILED';
    actionDoc.completedAt = new Date();
    actionDoc.result = isSuccess ? "Action executed successfully. System stabilized." : "Action failed to stabilize system.";

    // Verification Score components
    let metricRecovery = isSuccess ? 0.9 + (Math.random() * 0.1) : 0.3 + (Math.random() * 0.2);
    let serviceHealth = isSuccess ? 1.0 : 0.4;
    let errorReduction = isSuccess ? 0.95 : 0.2;
    
    // Calculate historical success from KB
    const totalHistorical = await HealingKnowledgeBase.countDocuments({ action: actionDoc.action });
    let historicalHealingSuccess = 0.8; // default
    if (totalHistorical > 0) {
       const successfulHist = await HealingKnowledgeBase.countDocuments({ action: actionDoc.action, result: /success/i });
       historicalHealingSuccess = successfulHist / totalHistorical;
    }

    const verificationScore = (0.4 * metricRecovery) + (0.3 * serviceHealth) + (0.2 * errorReduction) + (0.1 * historicalHealingSuccess);

    actionDoc.metricRecovery = metricRecovery;
    actionDoc.serviceHealth = serviceHealth;
    actionDoc.errorReduction = errorReduction;
    actionDoc.historicalHealingSuccess = historicalHealingSuccess;
    actionDoc.verificationScore = verificationScore;
    
    await actionDoc.save();

    // Store in Learning Dataset
    const kbRecord = new HealingKnowledgeBase({
      rootCause: actionDoc.rootCause,
      action: actionDoc.action,
      riskLevel: actionDoc.riskLevel,
      successProbability: actionDoc.successProbability,
      verificationScore: actionDoc.verificationScore,
      result: actionDoc.result
    });
    await kbRecord.save();

    // Update Incident Status
    if (isSuccess) {
      incidentDoc.status = 'RESOLVED';
      incidentDoc.resolutionSteps = [actionDoc.action, "Verified recovery."];
      await incidentDoc.save();
    }
    console.log(`[Healing] Finished Verification. Score: ${verificationScore.toFixed(2)}`);

  } catch (err) {
    console.error(`[Healing] Execution error:`, err);
  }
};

// Loop every 10 seconds
setInterval(processHealing, 10000);

// --- APIs ---

app.get('/healing-actions', async (req, res) => {
  try {
    const actions = await HealingAction.find().populate('incidentId').sort({ startedAt: -1 }).limit(100);
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Execute (for REQUIRES_APPROVAL)
app.post('/execute-healing', async (req, res) => {
  try {
    const { actionId } = req.body;
    const actionDoc = await HealingAction.findById(actionId);
    if (!actionDoc) return res.status(404).json({ error: "Not found" });

    if (actionDoc.status === 'REQUIRES_APPROVAL') {
      actionDoc.status = 'IN_PROGRESS';
      actionDoc.startedAt = new Date();
      await actionDoc.save();

      const incidentDoc = await Incident.findById(actionDoc.incidentId);
      
      // Execute asynchronously
      setTimeout(() => executeAndVerify(actionDoc, incidentDoc), 2000);
      res.json({ message: "Execution started." });
    } else {
      res.status(400).json({ error: `Cannot execute action in status: ${actionDoc.status}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Healing Agent running on port ${PORT}`);
});
