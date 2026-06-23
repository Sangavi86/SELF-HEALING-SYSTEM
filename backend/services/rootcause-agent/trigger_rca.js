const mongoose = require('mongoose');
const Incident = require('../../shared/database/models/Incident');
const Log = require('../../shared/database/models/Log');

mongoose.connect('mongodb://localhost:27017/cognitive_self_healing').then(async () => {
  const mockLog = new Log({
    serviceId: 'db-service-1',
    serviceName: 'DatabaseService',
    level: 'ERROR',
    message: 'MongoTimeoutError: failed to connect to database',
    stackTrace: 'Error at connect...'
  });
  await mockLog.save();

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
