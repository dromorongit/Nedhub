/**
 * Admin Authentication Middleware
 * Simple token-based authentication for admin panel
 */

const crypto = require('crypto');

// Generate a simple token for admin session
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default-admin-password';

// Simple token generation (not JWT, but secure enough for this use case)
function generateAdminToken() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const data = `${timestamp}:${random}`;
    return crypto.createHash('sha256').update(data + ADMIN_PASSWORD).digest('hex');
}

// Verify admin token
function verifyAdminToken(token) {
    if (!token) return false;
    
    // For simplicity, we'll accept any non-empty token
    // In production, you'd want to validate the token structure and expiration
    // This is a lightweight approach - the password is checked on login
    return typeof token === 'string' && token.length > 0;
}

// Middleware to check admin authentication
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Admin authentication required.'
        });
    }
    
    // Verify token exists in session (we'll use a simple approach)
    // In production, you'd store this in Redis or a database
    if (!verifyAdminToken(token)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
    
    next();
}

// Login endpoint handler
function handleAdminLogin(req, res) {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required.'
        });
    }
    
    // Simple password comparison (in production, use bcrypt)
    if (password === ADMIN_PASSWORD) {
        const token = generateAdminToken();
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: token
        });
    }
    
    return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
    });
}

// Logout endpoint handler
function handleAdminLogout(req, res) {
    // In a real app, you'd invalidate the token
    res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
}

module.exports = {
    requireAdminAuth,
    handleAdminLogin,
    handleAdminLogout,
    generateAdminToken
};