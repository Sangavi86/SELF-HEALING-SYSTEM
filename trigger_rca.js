const mongoose = require('mongoose');
const Incident = require('./backend/shared/database/models/Incident');
const Log = require('./backend/shared/database/models/Log');

mongoose.connect('mongodb://localhost:27017/cognitive_self_healing').then(async () => {
  // Insert a mock log that SentenceTransformer will classify
  const mockLog = new Log({
    serviceName: 'DatabaseService',
    level: 'ERROR',
    message: 'MongoTimeoutError: failed to connect to database',
    stackTrace: 'Error at connect...'
  });
  await mockLog.save();

  // Insert a pending Incident
  const incident = new Incident({
    title: 'System Anomaly: DB_TIMEOUT',
    description: 'Connection drops',
    severity: 'HIGH',
    status: 'OPEN',
    rootCause: 'Pending Analysis'
  });
  await incident.save();

  console.log('Mock Incident and Log created for RCA processing.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
