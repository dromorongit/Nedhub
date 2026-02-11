/**
 * Nedhub Backend Server
 * Main entry point for the API server
 * 
 * Features:
 * - Hubtel Payment Integration (Ghana)
 * - CV Templates E-commerce
 * - Order Management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Parse JSON bodies (but not for webhooks - raw body needed)
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/hubtel/callback') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Serve static files (for downloaded templates)
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Nedhub API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        paymentGateway: 'Hubtel'
    });
});

// Payment routes (Hubtel integration)
app.use('/api/payments', paymentRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// =============================================================================
// PAYMENT WEBHOOKS
// =============================================================================

/**
 * Hubtel Payment Callback
 * Hubtel sends payment results to this endpoint
 */
app.post('/api/payments/hubtel/callback', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('\n========================================');
    console.log('[HUBTEL CALLBACK] Payment callback received');
    console.log('========================================\n');
    
    // The actual handling is done in routes/payment.js
    // This route is already mounted with the payment routes
    
    res.status(200).json({ received: true });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS not allowed',
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Check if Hubtel credentials are configured
const hubtelConfigured = process.env.HUBTEL_POS_SALES_ID && process.env.HUBTEL_API_KEY;
const envWarning = !hubtelConfigured ? '\n⚠️  WARNING: Hubtel credentials not configured!\n   Copy .env.example to .env and add your credentials\n' : '';

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Nedhub Backend Server Started Successfully!                ║
║                                                                ║
║   Server:      http://localhost:${PORT}                          ║
║   API Base:    http://localhost:${PORT}/api                      ║
║   Health:      http://localhost:${PORT}/api/health               ║
║                                                                ║
║   Payment Gateway: ${hubtelConfigured ? '✓ Hubtel Configured' : '✗ Not Configured'}
║${envWarning}║   Mode:        ${process.env.NODE_ENV || 'development'}                                 ║
║                                                                ║
║   Endpoints:                                                   ║
║   • POST /api/payments/hubtel/initiate   - Start payment       ║
║   • POST /api/payments/hubtel/callback    - Hubtel webhook      ║
║   • GET  /api/payments/hubtel/status/:ref - Check status        ║
║   • GET  /api/products                   - List products        ║
║   • POST /api/orders/create              - Create order        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
