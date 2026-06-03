require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');
const { Admin, ADMIN_ROLES } = require('../models/Admin');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { isDBConnected } = require('../services/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function validatePasswordStrength(password) {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }
    return { valid: true };
}

async function handleOwnerRegistration(req, res) {
    const { fullName, email, username, password, confirmPassword } = req.body;
    
    if (!fullName || !email || !username || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required: fullName, email, username, password, and confirmPassword.'
        });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match.'
        });
    }
    
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({
            success: false,
            message: passwordValidation.message
        });
    }
    
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Registration service unavailable.'
            });
        }
        
        const adminCount = await Admin.getAdminCount();
        if (adminCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'Registration is disabled. Admin accounts already exist.'
            });
        }
        
        const existingEmail = await Admin.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });
        }
        
        const existingUsername = await Admin.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists.'
            });
        }
        
        const passwordHash = await require('bcryptjs').hash(password, 12);
        
        const admin = await Admin.create({
            fullName: String(fullName).trim(),
            email: String(email).toLowerCase().trim(),
            username: String(username).toLowerCase().trim(),
            passwordHash,
            role: 'owner',
            isActive: true
        });
        
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = generateToken(admin);
        
        await logActivity(admin._id, ACTIVITY_ACTIONS[11], 'admin', admin._id.toString(), {
            email: admin.email,
            role: admin.role
        });
        
        const adminObj = admin.toSafeObject();
        
        res.status(201).json({
            success: true,
            message: 'Owner account created successfully. Welcome to Nedhub!',
            token,
            admin: adminObj
        });
    } catch (error) {
        console.error('[Auth] Registration error:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
}

function generateToken(admin) {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    
    const payload = {
        adminId: admin._id,
        email: admin.email,
        role: admin.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.verify(token, JWT_SECRET);
}

async function logActivity(adminId, action, targetType = null, targetId = null, metadata = {}) {
    if (!isDBConnected()) return;
    
    try {
        await ActivityLog.create({
            adminId,
            action,
            targetType,
            targetId,
            metadata
        });
    } catch (error) {
        console.error('[Auth] Failed to log activity:', error.message);
    }
}

function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Admin authentication required.'
        });
    }
    
    const token = authHeader.substring(7);
    
    if (!JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: 'Authentication service not configured.'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(403).json({
            success: false,
            message: 'Invalid token.'
        });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }
        
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions for this action.'
            });
        }
        
        next();
    };
}

async function handleAdminLogin(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required.'
        });
    }
    
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Authentication service unavailable.'
            });
        }
        
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }
        
        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is disabled.'
            });
        }
        
        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }
        
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = generateToken(admin);
        
        await logActivity(admin._id, ACTIVITY_ACTIONS[9], 'admin', admin._id.toString(), {
            email: admin.email,
            role: admin.role
        });
        
        const adminObj = admin.toSafeObject();
        
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            admin: adminObj
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
}

async function handleAdminLogout(req, res) {
    try {
        if (req.admin?.adminId && isDBConnected()) {
            await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[10], 'admin', req.admin.adminId, {});
        }
    } catch (error) {
        console.error('[Auth] Logout log error:', error.message);
    }
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
}

module.exports = {
    generateToken,
    verifyToken,
    requireAdminAuth,
    requireRole,
    handleAdminLogin,
    handleAdminLogout,
    logActivity,
    handleOwnerRegistration,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    ACTIVITY_ACTIONS
};