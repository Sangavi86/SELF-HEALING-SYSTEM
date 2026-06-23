const mongoose = require('mongoose');
const Incident = require('../../shared/database/models/Incident');

mongoose.connect('mongodb://localhost:27017/cognitive_self_healing').then(async () => {
  // Low Risk Mock Incident -> Auto-execute
  const lowRiskIncident = new Incident({
    title: 'System Anomaly: DB_TIMEOUT',
    description: 'Connection drops',
    severity: 'MEDIUM',
    status: 'OPEN',
    rootCause: 'Database Connection Failure', // Medium Risk, but we'll force confidence high so it auto executes
    confidence: 0.95,
    rccs: 0.95
  });
  await lowRiskIncident.save();

  // High Risk Mock Incident -> Approval Queue
  const highRiskIncident = new Incident({
    title: 'System Anomaly: PROCESS_CRASH',
    description: 'Process stopped',
    severity: 'CRITICAL',
    status: 'OPEN',
    rootCause: 'High CPU Process', // Critical Risk -> Always REQUIRES_APPROVAL
    confidence: 0.90,
    rccs: 0.90
  });
  await highRiskIncident.save();

  console.log('Mock Incidents created for Healing Agent processing.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
