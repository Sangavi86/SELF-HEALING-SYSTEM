require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('../../shared/database/connectDB');
const LearningInsight = require('../../shared/database/models/LearningInsight');
const LearningHistory = require('../../shared/database/models/LearningHistory');
const HealingKnowledgeBase = require('../../shared/database/models/HealingKnowledgeBase');
const RootCauseAnalysis = require('../../shared/database/models/RootCauseAnalysis');
const HealingAction = require('../../shared/database/models/HealingAction');
const Incident = require('../../shared/database/models/Incident');

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

connectDB();

// Global SHEI tracking
let globalSHEI = 0;

// Polling Engine
const performLearningCycle = async () => {
  try {
    console.log('[Learning] Starting optimization cycle...');
    
    // 1. Calculate Ecosystem variables
    const totalRCAs = await RootCauseAnalysis.countDocuments();
    let rootCauseAccuracy = 0;
    if (totalRCAs > 0) {
      // successfulHealingsAfterRCA / totalRCAExecutions
      const rcaIncidentIds = await RootCauseAnalysis.find().distinct('incidentId');
      const successfulHealings = await HealingAction.countDocuments({ 
        incidentId: { $in: rcaIncidentIds }, 
        status: 'SUCCESS' 
      });
      rootCauseAccuracy = successfulHealings / totalRCAs;
    }

    const totalRecoveries = await HealingAction.countDocuments();
    let recoveryEfficiency = 0;
    if (totalRecoveries > 0) {
      // successfulRecoveries / totalRecoveries
      const successfulRecs = await HealingAction.countDocuments({ status: 'SUCCESS' });
      recoveryEfficiency = successfulRecs / totalRecoveries;
    }

    // Process each unique RootCause + Action combo in KB
    const kbRecords = await HealingKnowledgeBase.find();
    
    // Group by rootCause and action
    const grouped = {};
    kbRecords.forEach(kb => {
      const key = `${kb.rootCause}|${kb.action}`;
      if (!grouped[key]) {
        grouped[key] = {
          rootCause: kb.rootCause,
          action: kb.action,
          total: 0,
          success: 0,
          failed: 0,
          sumVerification: 0,
          latestTimestamp: kb.timestamp
        };
      }
      grouped[key].total += 1;
      if (kb.result && kb.result.match(/success/i)) {
        grouped[key].success += 1;
      } else {
        grouped[key].failed += 1;
      }
      grouped[key].sumVerification += (kb.verificationScore || 0);
      if (kb.timestamp > grouped[key].latestTimestamp) {
        grouped[key].latestTimestamp = kb.timestamp;
      }
    });

    let sumSHEI = 0;
    let strategyCount = 0;

    for (const key in grouped) {
      const group = grouped[key];
      const successRate = group.total > 0 ? group.success / group.total : 0;
      const averageVerificationScore = group.total > 0 ? group.sumVerification / group.total : 0;
      
      // Calculate Historical Frequency
      const historicalFrequency = group.total / (kbRecords.length || 1);

      // Recency Factor (simple: 1.0 if today, 0.5 if older)
      const isRecent = (new Date() - new Date(group.latestTimestamp)) < (24 * 60 * 60 * 1000);
      const recencyFactor = isRecent ? 1.0 : 0.5;

      // Confidence Optimization Formula
      const recommendationConfidence = (0.4 * successRate) + (0.3 * averageVerificationScore) + (0.2 * historicalFrequency) + (0.1 * recencyFactor);

      // SHEI Formula for this strategy context
      const shei = (0.35 * successRate) + (0.25 * averageVerificationScore) + (0.20 * rootCauseAccuracy) + (0.20 * recoveryEfficiency);
      sumSHEI += shei;
      strategyCount++;

      // Upsert LearningInsight
      let insight = await LearningInsight.findOne({ rootCause: group.rootCause, recommendedAction: group.action });
      
      let prevConfidence = 0;
      let trendDirection = 'STABLE';

      if (!insight) {
        insight = new LearningInsight({
          rootCause: group.rootCause,
          recommendedAction: group.action
        });
      } else {
        prevConfidence = insight.recommendationConfidence;
      }

      if (recommendationConfidence > prevConfidence + 0.05) trendDirection = 'IMPROVING';
      else if (recommendationConfidence < prevConfidence - 0.05) trendDirection = 'DECLINING';
      
      insight.totalExecutions = group.total;
      insight.successfulExecutions = group.success;
      insight.failedExecutions = group.failed;
      insight.averageVerificationScore = averageVerificationScore;
      insight.successRate = successRate;
      insight.historicalFrequency = historicalFrequency;
      insight.recencyFactor = recencyFactor;
      insight.recommendationConfidence = recommendationConfidence;
      insight.shei = shei;
      insight.trendDirection = trendDirection;
      insight.lastUpdated = new Date();

      await insight.save();

      // Store History if changed
      if (Math.abs(recommendationConfidence - prevConfidence) > 0.01 || !insight._id) {
        await new LearningHistory({
          rootCause: group.rootCause,
          action: group.action,
          previousConfidence: prevConfidence,
          newConfidence: recommendationConfidence,
          reason: `Routine optimization. SHEI calculated at ${shei.toFixed(2)}`,
          shei: shei
        }).save();
      }
    }
    
    if (strategyCount > 0) {
      globalSHEI = sumSHEI / strategyCount;
    }
    console.log(`[Learning] Cycle complete. Global SHEI: ${globalSHEI.toFixed(2)}`);

  } catch (err) {
    console.error('[Learning] Cycle Error:', err.message);
  }
};

// Loop every 30 seconds
setInterval(performLearningCycle, 30000);

// --- APIs ---

app.get('/learning-insights', async (req, res) => {
  try {
    const insights = await LearningInsight.find().sort({ recommendationConfidence: -1 });
    res.json({ insights, globalSHEI });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/learning-insights/latest', async (req, res) => {
  try {
    const history = await LearningHistory.find().sort({ timestamp: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/best-action/:rootCause', async (req, res) => {
  try {
    const rootCause = req.params.rootCause;
    // Find highest performing action for this root cause
    const insight = await LearningInsight.findOne({ rootCause }).sort({ recommendationConfidence: -1 });
    if (insight) {
      res.json({
        bestAction: insight.recommendedAction,
        successRate: insight.successRate,
        averageVerificationScore: insight.averageVerificationScore,
        recommendationConfidence: insight.recommendationConfidence,
        shei: insight.shei
      });
    } else {
      res.status(404).json({ message: "No learning data for this root cause yet." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/retrain-learning', async (req, res) => {
  try {
    await performLearningCycle();
    res.json({ message: "Retraining cycle triggered successfully.", globalSHEI });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Learning Agent running on port ${PORT}`);
});
