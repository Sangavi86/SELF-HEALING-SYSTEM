require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Proxy routes
app.use('/api/monitoring', createProxyMiddleware({ 
  target: 'http://localhost:5001', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/monitoring': '', // remove base path
  },
}));

app.use('/api/anomaly', createProxyMiddleware({ 
  target: 'http://localhost:5003', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/anomaly': '', // remove base path
  },
}));

app.use('/api/rootcause', createProxyMiddleware({ 
  target: 'http://localhost:5005', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/rootcause': '', // remove base path
  },
}));

app.use('/api/healing', createProxyMiddleware({ 
  target: 'http://localhost:5006', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/healing': '', // remove base path
  },
}));

// Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
