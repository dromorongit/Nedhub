const express = require('express');
const { requireAdminAuth, handleAdminLogin, handleAdminLogout, handleOwnerRegistration, ACTIVITY_ACTIONS, logActivity } = require('../middlewares/auth');
const jobController = require('../controllers/jobController');
const applicationController = require('../controllers/applicationController');
const adminController = require('../controllers/adminController');
const { Admin } = require('../models/Admin');

const router = express.Router();

// ==================== REGISTRATION ROUTE ====================

/**
 * @route POST /api/admin/register
 * @desc Owner registration (first admin only)
 * @access Public (only when no admins exist)
 */
router.post('/admin/register', handleOwnerRegistration);

// ==================== AUTH ROUTES ====================

/**
 * @route POST /api/admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/admin/login', handleAdminLogin);

/**
 * @route POST /api/admin/logout
 * @desc Admin logout
 * @access Private
 */
router.post('/admin/logout', requireAdminAuth, handleAdminLogout);

// ==================== JOB MANAGEMENT ROUTES ====================

/**
 * @route GET /api/admin/jobs
 * @desc Get all jobs (admin view - includes inactive)
 * @access Private (Owner, Admin)
 */
router.get('/admin/jobs', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view jobs.'
        });
    }
    return jobController.getAllJobs(req, res, next);
});

/**
 * @route POST /api/admin/jobs
 * @desc Create a new job
 * @access Private (Owner, Admin)
 */
router.post('/admin/jobs', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can create jobs.'
        });
    }
    return jobController.createJob(req, res, next);
});

/**
 * @route PUT /api/admin/jobs/:id
 * @desc Update a job
 * @access Private (Owner, Admin)
 */
router.put('/admin/jobs/:id', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can update jobs.'
        });
    }
    return jobController.updateJob(req, res, next);
});

/**
 * @route DELETE /api/admin/jobs/:id
 * @desc Delete a job (soft delete - mark as inactive)
 * @access Private (Owner, Admin)
 */
router.delete('/admin/jobs/:id', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can delete jobs.'
        });
    }
    return jobController.deleteJob(req, res, next);
});

// ==================== APPLICATION MANAGEMENT ROUTES ====================

/**
 * @route GET /api/admin/applications
 * @desc Get all applications
 * @access Private (Owner, Admin)
 */
router.get('/admin/applications', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view applications.'
        });
    }
    return applicationController.getAllApplications(req, res, next);
});

/**
 * @route PUT /api/admin/applications/:id/status
 * @desc Update application status
 * @access Private (Owner, Admin)
 */
router.put('/admin/applications/:id/status', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can update applications.'
        });
    }
    return applicationController.updateApplicationStatus(req, res, next);
});

/**
 * @route GET /api/admin/applications/:id
 * @desc Get single application
 * @access Private (Owner, Admin)
 */
router.get('/admin/applications/:id', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view applications.'
        });
    }
    return applicationController.getApplicationById(req, res, next);
});

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * @route GET /api/admin/users
 * @desc Get all admin users
 * @access Private (Owner only)
 */
router.get('/admin/users', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can manage users.'
        });
    }
    return adminController.getAllAdmins(req, res, next);
});

/**
 * @route POST /api/admin/users
 * @desc Create a new admin user
 * @access Private (Owner only)
 */
router.post('/admin/users', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can create users.'
        });
    }
    return adminController.createAdmin(req, res, next);
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update an admin user
 * @access Private (Owner only)
 */
router.put('/admin/users/:id', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can update users.'
        });
    }
    return adminController.updateAdmin(req, res, next);
});

/**
 * @route PUT /api/admin/users/:id/status
 * @desc Toggle admin user status (enable/disable)
 * @access Private (Owner only)
 */
router.put('/admin/users/:id/status', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can manage user status.'
        });
    }
    return adminController.toggleAdminStatus(req, res, next);
});

/**
 * @route PUT /api/admin/users/:id/password
 * @desc Reset admin user password
 * @access Private (Owner only)
 */
router.put('/admin/users/:id/password', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can reset passwords.'
        });
    }
    return adminController.resetAdminPassword(req, res, next);
});

/**
 * @route PUT /api/admin/users/:id/role
 * @desc Change admin user role
 * @access Private (Owner only)
 */
router.put('/admin/users/:id/role', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can change roles.'
        });
    }
    return adminController.changeAdminRole(req, res, next);
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete an admin user
 * @access Private (Owner only)
 */
router.delete('/admin/users/:id', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can delete users.'
        });
    }
    return adminController.deleteAdmin(req, res, next);
});

// ==================== JOB STATUS ROUTES ====================

/**
 * @route PUT /api/admin/jobs/:id/status
 * @desc Update job status (Draft/Published/Archived)
 * @access Private (Owner, Admin)
 */
router.put('/admin/jobs/:id/status', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can update job status.'
        });
    }
    return jobController.updateJobStatus(req, res, next);
});

// ==================== DASHBOARD ROUTES ====================

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Owner, Admin)
 */
router.get('/admin/dashboard/stats', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view dashboard stats.'
        });
    }
    return jobController.getDashboardStats(req, res, next);
});

/**
 * @route GET /api/admin/dashboard/analytics
 * @desc Get analytics data
 * @access Private (Owner, Admin)
 */
router.get('/admin/dashboard/analytics', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view analytics.'
        });
    }
    return jobController.getAnalytics(req, res, next);
});

/**
 * @route GET /api/admin/dashboard/recent-applications
 * @desc Get recent applications
 * @access Private (Owner, Admin)
 */
router.get('/admin/dashboard/recent-applications', requireAdminAuth, (req, res, next) => {
    if (!['owner', 'admin'].includes(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners and admins can view applications.'
        });
    }
    return jobController.getRecentApplications(req, res, next);
});

// ==================== PROFILE ROUTES ====================

/**
 * @route GET /api/admin/profile
 * @desc Get admin profile
 * @access Private
 */
router.get('/admin/profile', requireAdminAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.adminId).select('-passwordHash');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile.' });
    }
});

/**
 * @route PUT /api/admin/profile
 * @desc Update admin profile
 * @access Private
 */
router.put('/admin/profile', requireAdminAuth, adminController.updateProfile.bind(adminController));

/**
 * @route PUT /api/admin/password
 * @desc Change admin password
 * @access Private
 */
router.put('/admin/password', requireAdminAuth, adminController.changePassword.bind(adminController));

/**
 * @route GET /api/admin/settings
 * @desc Get platform settings
 * @access Private (Owner only)
 */
router.get('/admin/settings', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can manage settings.'
        });
    }
    return adminController.getSettings(req, res, next);
});

/**
 * @route PUT /api/admin/settings
 * @desc Update platform settings
 * @access Private (Owner only)
 */
router.put('/admin/settings', requireAdminAuth, (req, res, next) => {
    if (req.admin.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only owners can manage settings.'
        });
    }
    return adminController.updateSettings(req, res, next);
});

// ==================== HEALTH CHECK ====================

/**
 * @route GET /api/admin/health
 * @desc Admin API health check
 * @access Public
 */
router.get('/admin/health', async (req, res) => {
    const { Admin } = require('../models/Admin');
    const adminCount = await Admin.getAdminCount();
    res.json({
        service: 'Admin API',
        status: 'operational',
        adminCount,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;