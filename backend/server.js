/**
 * Nedhub Backend - Hubtel Redirect Checkout Integration
 * Main entry point for the Node.js Express server
 */

require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const config = require('./config');
const paymentRoutes = require('./routes/paymentRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Debug: Log environment variables (without exposing secrets)
console.log('[Server] Environment check:');
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
console.log('[Server] HUBTEL_CLIENT_ID:', process.env.HUBTEL_CLIENT_ID ? '***set***' : 'NOT SET');
console.log('[Server] HUBTEL_POS_ID:', process.env.HUBTEL_POS_ID || 'NOT SET');
console.log('[Server] BASE_URL:', process.env.BASE_URL);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (root)
app.get('/', (req, res) => {
  res.json({
    service: 'Nedhub Payment Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection (optional - for production)
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[Server] MongoDB connected successfully');
    } catch (error) {
      console.warn('[Server] MongoDB connection failed - running without database');
      console.warn('[Server] Error:', error.message);
    }
  } else {
    console.log('[Server] No MongoDB URI provided - running in demo mode');
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  const PORT = config.port;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log(`[Server] Nedhub Payment Backend Started`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log(`[Server] Port: ${PORT}`);
    console.log(`[Server] Base URL: ${config.baseUrl}`);
    console.log('==========================================');
    console.log('[Server] Available endpoints:');
    console.log('  GET  /                       - Health check');
    console.log('  GET  /api/health             - API health check');
    console.log('  POST /api/payments/hubtel/initiate - Initiate payment (main)');
    console.log('  POST /api/pay                - Initiate payment (alternative)');
    console.log('  POST /api/hubtel-callback    - Hubtel callback');
    console.log('  GET  /api/check-status/:clientRef - Check status');
    console.log('  GET  /api/order/:clientRef   - Get order details');
    console.log('==========================================');
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
