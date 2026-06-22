const mongoose = require('mongoose');
const SystemMetrics = require('./backend/shared/database/models/SystemMetrics');

mongoose.connect('mongodb://localhost:27017/cognitive_self_healing').then(async () => {
  const metric = new SystemMetrics({
    serviceId: 'fake-anomaly-test',
    cpuUsage: 99.5,
    memoryUsage: 98.2,
    diskUsage: 85,
    networkIn: 5000000,
    networkOut: 5000000,
    networkUsage: 10000000,
    uptime: 12345,
    hostName: 'TestHost',
    osPlatform: 'TestOS'
  });
  await metric.save();
  console.log('Fake anomaly metric inserted.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
