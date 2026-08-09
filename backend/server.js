require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { connectDB, disconnectDB, isDBConnected } = require('./services/db');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const careerRoutes = require('./routes/careerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Trust only the first proxy hop (Railway load balancer) for correct client IP
// detection in rate limiting. Using a count instead of `true` prevents trivial
// IP spoofing via the X-Forwarded-For header.
app.set('trust proxy', 1);

// Debug: Log environment variables (without exposing secrets)
console.log('[Server] Environment check:');
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
console.log('[Server] HUBTEL_CLIENT_ID:', process.env.HUBTEL_CLIENT_ID ? '***set***' : 'NOT SET');
console.log('[Server] HUBTEL_POS_ID:', process.env.HUBTEL_POS_ID || 'NOT SET');
console.log('[Server] BREVO_API_KEY:', process.env.BREVO_API_KEY ? '***set***' : 'NOT SET');
console.log('[Server] JWT_SECRET:', process.env.JWT_SECRET ? '***set***' : 'NOT SET');
console.log('[Server] MONGODB_URI:', process.env.MONGODB_URI ? '***set***' : 'NOT SET');
console.log('[Server] BASE_URL:', process.env.BASE_URL);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
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

// Rate limiting for API routes
app.use('/api', limiter);

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
        version: '2.0.0',
        status: 'running',
        database: isDBConnected() ? 'connected' : 'fallback',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', paymentRoutes);
app.use('/api', productRoutes);
app.use('/api', careerRoutes);
app.use('/api', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.warn('[Server] Starting in fallback mode (no database)');
    }
    
    const PORT = config.port;
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('==========================================');
        console.log(`[Server] Nedhub Careers Platform Started`);
        console.log(`[Server] Environment: ${config.nodeEnv}`);
        console.log(`[Server] Port: ${PORT}`);
        console.log(`[Server] Base URL: ${config.baseUrl}`);
        console.log(`[Server] Database: ${isDBConnected() ? 'Connected (MongoDB)' : 'Fallback mode'}`);
        console.log('==========================================');
        console.log('[Server] Available endpoints:');
        console.log('  GET  /                        - Health check');
        console.log('  POST /api/admin/login        - Admin login (JWT)');
        console.log('  POST /api/admin/logout       - Admin logout');
        console.log('  GET  /api/admin/jobs         - Get all jobs');
        console.log('  POST /api/admin/jobs         - Create job');
        console.log('  PUT  /api/admin/jobs/:id     - Update job');
        console.log('  DELETE /api/admin/jobs/:id   - Archive job');
        console.log('  PUT  /api/admin/jobs/:id/status - Update job status');
        console.log('  GET  /api/admin/dashboard/stats - Get dashboard statistics');
        console.log('  GET  /api/admin/dashboard/analytics - Get analytics');
        console.log('  GET  /api/admin/dashboard/recent-applications - Get recent applications');
        console.log('  GET  /api/admin/profile      - Get admin profile');
        console.log('  PUT  /api/admin/profile      - Update admin profile');
        console.log('  PUT  /api/admin/password     - Change admin password');
        console.log('  GET  /api/admin/settings     - Get platform settings');
        console.log('  PUT  /api/admin/settings     - Update platform settings');
        console.log('  GET  /api/admin/users        - Get all admin users');
        console.log('  POST /api/admin/users        - Create admin user');
        console.log('  GET  /api/careers/jobs       - Get public jobs (frontend)');
        console.log('  GET  /api/careers/settings   - Get public settings');
        console.log('  POST /api/careers/apply      - Submit job application');
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
process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[Server] SIGINT received. Shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
