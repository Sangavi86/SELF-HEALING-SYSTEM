const mongoose = require('mongoose');

// Define/import models inline to prevent path issues
const MetricSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  cpuUsage: Number,
  memoryUsage: Number,
  diskUsage: Number,
  networkUsage: {
    rxBytes: Number,
    txBytes: Number
  },
  uptime: Number,
  hostName: String,
  osPlatform: String
});

const AnomalySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  cpuUsage: Number,
  memoryUsage: Number,
  diskUsage: Number,
  networkUsage: Number,
  anomaly: Boolean,
  confidence: Number,
  anomalyType: String
});

const IncidentSchema = new mongoose.Schema({
  title: String,
  description: String,
  severity: String,
  status: String,
  rootCause: String,
  confidence: Number,
  rccs: Number,
  evidence: [String],
  analysisTimestamp: Date,
  resolutionSteps: [String],
  relatedAnomalies: [mongoose.Schema.Types.ObjectId],
  timestamp: { type: Date, default: Date.now }
});

const RootCauseAnalysisSchema = new mongoose.Schema({
  incidentId: mongoose.Schema.Types.ObjectId,
  anomalyId: mongoose.Schema.Types.ObjectId,
  rootCause: String,
  confidence: Number,
  rccs: Number,
  evidence: {
    metricEvidence: [String],
    logEvidence: [String],
    historicalEvidence: [String]
  },
  timestamp: { type: Date, default: Date.now }
});

const HealingActionSchema = new mongoose.Schema({
  incidentId: mongoose.Schema.Types.ObjectId,
  rootCause: String,
  action: String,
  recommendedAction: String,
  riskLevel: String,
  successProbability: Number,
  rollbackPlan: String,
  approvalRequired: Boolean,
  status: String,
  startedAt: Date,
  completedAt: Date,
  result: String,
  verificationScore: Number,
  metricRecovery: Number,
  serviceHealth: Number,
  errorReduction: Number,
  historicalHealingSuccess: Number
});

const HealingKnowledgeBaseSchema = new mongoose.Schema({
  rootCause: String,
  action: String,
  riskLevel: String,
  successProbability: Number,
  verificationScore: Number,
  result: String,
  timestamp: { type: Date, default: Date.now }
});

const LearningInsightSchema = new mongoose.Schema({
  rootCause: String,
  recommendedAction: String,
  totalExecutions: Number,
  successfulExecutions: Number,
  failedExecutions: Number,
  rootCauseFrequency: Number,
  averageRecoveryTime: Number,
  averageVerificationScore: Number,
  successRate: Number,
  historicalFrequency: Number,
  recencyFactor: Number,
  recommendationConfidence: Number,
  shei: Number,
  trendDirection: String,
  lastUpdated: { type: Date, default: Date.now }
});

const LearningHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  rootCause: String,
  action: String,
  previousConfidence: Number,
  newConfidence: Number,
  reason: String,
  shei: Number
});

const SystemMetrics = mongoose.model('SystemMetrics', MetricSchema, 'systemmetrics');
const Anomaly = mongoose.model('Anomaly', AnomalySchema, 'anomalies');
const Incident = mongoose.model('Incident', IncidentSchema, 'incidents');
const RootCauseAnalysis = mongoose.model('RootCauseAnalysis', RootCauseAnalysisSchema, 'rootcauseanalyses');
const HealingAction = mongoose.model('HealingAction', HealingActionSchema, 'healingactions');
const HealingKnowledgeBase = mongoose.model('HealingKnowledgeBase', HealingKnowledgeBaseSchema, 'healingknowledgebases');
const LearningInsight = mongoose.model('LearningInsight', LearningInsightSchema, 'learninginsights');
const LearningHistory = mongoose.model('LearningHistory', LearningHistorySchema, 'learninghistories');

const seed = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/cognitive_self_healing');
    console.log('Connected to MongoDB.');

    // Clear all existing data to start clean
    await SystemMetrics.deleteMany({});
    await Anomaly.deleteMany({});
    await Incident.deleteMany({});
    await RootCauseAnalysis.deleteMany({});
    await HealingAction.deleteMany({});
    await HealingKnowledgeBase.deleteMany({});
    await LearningInsight.deleteMany({});
    await LearningHistory.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Seed SystemMetrics (10 records)
    const metrics = [];
    for (let i = 0; i < 10; i++) {
      metrics.push({
        timestamp: new Date(Date.now() - i * 10000),
        cpuUsage: 15 + Math.random() * 10,
        memoryUsage: 45 + Math.random() * 5,
        diskUsage: 60,
        networkUsage: { rxBytes: 1024 * i, txBytes: 512 * i },
        uptime: 3600 + i * 10,
        hostName: 'Ecosystem-Host',
        osPlatform: 'win32'
      });
    }
    await SystemMetrics.insertMany(metrics);
    console.log('Seeded SystemMetrics.');

    // 2. Seed Anomalies (5 records)
    const anomalies = [];
    for (let i = 0; i < 5; i++) {
      anomalies.push({
        timestamp: new Date(Date.now() - i * 60000),
        cpuUsage: i === 0 ? 95 : 20,
        memoryUsage: i === 1 ? 98 : 50,
        diskUsage: 60,
        networkUsage: 1500,
        anomaly: i < 2,
        confidence: i < 2 ? 0.92 : 0.1,
        anomalyType: i === 0 ? 'HIGH_CPU' : i === 1 ? 'MEMORY_LEAK' : 'NOMINAL'
      });
    }
    const insertedAnomalies = await Anomaly.insertMany(anomalies);
    console.log('Seeded Anomalies.');

    // 3. Seed Incidents (5 records)
    const incidentsData = [
      {
        title: 'System Anomaly: HIGH_CPU',
        description: 'CPU usage spiked abnormally.',
        severity: 'HIGH',
        status: 'RESOLVED',
        rootCause: 'High CPU Process',
        confidence: 0.9,
        rccs: 0.88,
        evidence: ['Log signature match', 'CPU threshold exceeded'],
        analysisTimestamp: new Date(),
        resolutionSteps: ['Kill process and restart service'],
        relatedAnomalies: [insertedAnomalies[0]._id],
        timestamp: new Date(Date.now() - 3 * 3600000)
      },
      {
        title: 'System Anomaly: MEMORY_LEAK',
        description: 'Memory usage grew continuously.',
        severity: 'HIGH',
        status: 'RESOLVED',
        rootCause: 'Memory Leak',
        confidence: 0.85,
        rccs: 0.82,
        evidence: ['Memory growth rate high'],
        analysisTimestamp: new Date(),
        resolutionSteps: ['Restart service'],
        relatedAnomalies: [insertedAnomalies[1]._id],
        timestamp: new Date(Date.now() - 2 * 3600000)
      },
      {
        title: 'System Anomaly: DB_TIMEOUT',
        description: 'Database query timeout observed.',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        rootCause: 'Database Connection Failure',
        confidence: 0.95,
        rccs: 0.93,
        evidence: ['MongoTimeoutError in app logs'],
        analysisTimestamp: new Date(),
        resolutionSteps: ['Reconnect database'],
        timestamp: new Date(Date.now() - 1 * 3600000)
      },
      {
        title: 'System Anomaly: DISK_FULL',
        description: 'Disk partition saturated.',
        severity: 'HIGH',
        status: 'RESOLVED',
        rootCause: 'Disk Saturation',
        confidence: 0.98,
        rccs: 0.96,
        evidence: ['Disk space < 5%'],
        analysisTimestamp: new Date(),
        resolutionSteps: ['Clean temporary files'],
        timestamp: new Date(Date.now() - 30 * 60000)
      },
      {
        title: 'System Anomaly: API_TIMEOUT',
        description: 'Gateway observed API gateway timeout.',
        severity: 'HIGH',
        status: 'OPEN',
        rootCause: 'API Timeout',
        confidence: 0.88,
        rccs: 0.84,
        evidence: ['504 Gateway Timeout log'],
        analysisTimestamp: new Date(),
        timestamp: new Date()
      }
    ];
    const insertedIncidents = await Incident.insertMany(incidentsData);
    console.log('Seeded Incidents.');

    // 4. Seed RootCauseAnalyses (5 records)
    const rcas = insertedIncidents.map(inc => ({
      incidentId: inc._id,
      rootCause: inc.rootCause,
      confidence: inc.confidence,
      rccs: inc.rccs,
      evidence: {
        metricEvidence: inc.evidence,
        logEvidence: inc.evidence,
        historicalEvidence: ['Calculated baseline']
      },
      timestamp: inc.analysisTimestamp
    }));
    await RootCauseAnalysis.insertMany(rcas);
    console.log('Seeded RootCauseAnalyses.');

    // 5. Seed HealingActions (5 records)
    const healingActions = insertedIncidents.map(inc => {
      const isSuccess = inc.status === 'RESOLVED';
      return {
        incidentId: inc._id,
        rootCause: inc.rootCause,
        action: inc.resolutionSteps[0] || 'Restart API service',
        recommendedAction: inc.resolutionSteps[0] || 'Restart API service',
        riskLevel: inc.rootCause === 'High CPU Process' ? 'CRITICAL' : 'HIGH',
        successProbability: inc.rccs || 0.8,
        rollbackPlan: 'Rollback previous deployment state',
        approvalRequired: inc.rootCause === 'High CPU Process',
        status: isSuccess ? 'SUCCESS' : 'REQUIRES_APPROVAL',
        startedAt: new Date(inc.timestamp.getTime() + 10000),
        completedAt: isSuccess ? new Date(inc.timestamp.getTime() + 30000) : null,
        result: isSuccess ? 'Simulated execution completed successfully.' : 'Pending manual verification.',
        verificationScore: isSuccess ? 0.94 : null,
        metricRecovery: isSuccess ? 0.95 : null,
        serviceHealth: isSuccess ? 1.0 : null,
        errorReduction: isSuccess ? 0.96 : null,
        historicalHealingSuccess: 0.8
      };
    });
    await HealingAction.insertMany(healingActions);
    console.log('Seeded HealingActions.');

    // 6. Seed HealingKnowledgeBase (15 records to enable rich training calculations)
    const kbEntries = [];
    const causes = ['Memory Leak', 'High CPU Process', 'Database Connection Failure', 'Disk Saturation'];
    const actions = ['Restart service', 'Kill process and restart service', 'Reconnect database', 'Clean temporary files'];
    
    for (let i = 0; i < 15; i++) {
      const index = i % 4;
      const isSuccess = i % 5 !== 0; // 80% success rate overall
      kbEntries.push({
        rootCause: causes[index],
        action: actions[index],
        riskLevel: index === 1 ? 'CRITICAL' : 'HIGH',
        successProbability: 0.7 + (Math.random() * 0.2),
        verificationScore: isSuccess ? 0.85 + (Math.random() * 0.1) : 0.3 + (Math.random() * 0.2),
        result: isSuccess ? 'Success' : 'Failure',
        timestamp: new Date(Date.now() - i * 3600000)
      });
    }
    await HealingKnowledgeBase.insertMany(kbEntries);
    console.log('Seeded HealingKnowledgeBase.');

    // 7. Seed LearningInsights
    const insights = [
      {
        rootCause: 'Memory Leak',
        recommendedAction: 'Restart service',
        totalExecutions: 10,
        successfulExecutions: 9,
        failedExecutions: 1,
        rootCauseFrequency: 2,
        averageRecoveryTime: 20000,
        averageVerificationScore: 0.92,
        successRate: 0.90,
        historicalFrequency: 0.4,
        recencyFactor: 1.0,
        recommendationConfidence: 0.87,
        shei: 0.89,
        trendDirection: 'IMPROVING'
      },
      {
        rootCause: 'High CPU Process',
        recommendedAction: 'Kill process and restart service',
        totalExecutions: 8,
        successfulExecutions: 6,
        failedExecutions: 2,
        rootCauseFrequency: 1,
        averageRecoveryTime: 30000,
        averageVerificationScore: 0.84,
        successRate: 0.75,
        historicalFrequency: 0.3,
        recencyFactor: 0.9,
        recommendationConfidence: 0.78,
        shei: 0.81,
        trendDirection: 'STABLE'
      }
    ];
    await LearningInsight.insertMany(insights);
    console.log('Seeded LearningInsights.');

    // 8. Seed LearningHistory
    const history = [
      {
        rootCause: 'Memory Leak',
        action: 'Restart service',
        previousConfidence: 0.82,
        newConfidence: 0.87,
        reason: 'Incremental successes registered.',
        shei: 0.89
      },
      {
        rootCause: 'High CPU Process',
        action: 'Kill process and restart service',
        previousConfidence: 0.79,
        newConfidence: 0.78,
        reason: 'Execution failures slightly degraded ranking.',
        shei: 0.81
      }
    ];
    await LearningHistory.insertMany(history);
    console.log('Seeded LearningHistory.');

    console.log('Successfully completed seeding all MongoDB collections.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
