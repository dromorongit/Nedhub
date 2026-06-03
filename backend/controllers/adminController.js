const { Admin, ADMIN_ROLES } = require('../models/Admin');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { logActivity } = require('../middlewares/auth');
const { isDBConnected } = require('../services/db');
const bcrypt = require('bcryptjs');

module.exports = {
    async getAllAdmins(req, res) {
    async getAllAdmins(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const admins = await Admin.find().select('-passwordHash');
            
            res.json({
                success: true,
                data: admins
            });
        } catch (error) {
            console.error('[AdminController] Error fetching admins:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch admins.'
            });
        }
    },

    async createAdmin(req, res) {
        try {
            const { fullName, email, username, password, role } = req.body;
            
            if (!fullName || !email || !username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: fullName, email, username, and password are required.'
                });
            }
            
            if (!ADMIN_ROLES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${ADMIN_ROLES.join(', ')}`
                });
            }
            
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long.'
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
            
            const passwordHash = await bcrypt.hash(password, 12);
            
            const admin = await Admin.create({
                fullName: String(fullName).trim(),
                email: email.toLowerCase().trim(),
                username: username.toLowerCase().trim(),
                passwordHash,
                role,
                isActive: true
            });
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[12], 'admin', admin._id.toString(), {
                    email: admin.email,
                    role: admin.role
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Admin created successfully.',
                data: admin.toSafeObject()
            });
        } catch (error) {
            console.error('[AdminController] Error creating admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create admin.'
            });
        }
    },

    async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { fullName, email, username } = req.body;
            
            const admin = await Admin.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            if (fullName) admin.fullName = String(fullName).trim();
            if (email) admin.email = email.toLowerCase().trim();
            if (username) admin.username = username.toLowerCase().trim();
            
            await admin.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[13], 'admin', admin._id.toString(), {
                    email: admin.email
                });
            }
            
            res.json({
                success: true,
                message: 'Admin updated successfully.',
                data: admin.toSafeObject()
            });
        } catch (error) {
            console.error('[AdminController] Error updating admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update admin.'
            });
        }
    },

    async toggleAdminStatus(req, res) {
        try {
            const { id } = req.params;
            
            const admin = await Admin.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            if (admin.role === 'owner' && admin.isActive) {
                const otherActiveOwners = await Admin.countDocuments({ 
                    role: 'owner', 
                    isActive: true,
                    _id: { $ne: id } 
                });
                
                if (otherActiveOwners === 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot disable the only active owner account. Create another active owner first.'
                    });
                }
            }
            
            admin.isActive = !admin.isActive;
            await admin.save();
            
            const action = admin.isActive ? ACTIVITY_ACTIONS[15] : ACTIVITY_ACTIONS[14];
            const actionLabel = admin.isActive ? 'reactivated' : 'disabled';
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, action, 'admin', admin._id.toString(), {
                    email: admin.email,
                    isActive: admin.isActive
                });
            }
            
            res.json({
                success: true,
                message: `Admin ${actionLabel} successfully.`,
                data: admin.toSafeObject()
            });
        } catch (error) {
            console.error('[AdminController] Error toggling admin status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update admin status.'
            });
        }
    },

    async resetAdminPassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            
            if (!password || password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters.'
                });
            }
            
            if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain uppercase, lowercase, and numeric characters.'
                });
            }
            
            const admin = await Admin.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            admin.passwordHash = await bcrypt.hash(password, 12);
            await admin.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[16], 'admin', admin._id.toString(), {
                    email: admin.email
                });
            }
            
            res.json({
                success: true,
                message: 'Password reset successfully.'
            });
        } catch (error) {
            console.error('[AdminController] Error resetting admin password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password.'
            });
        }
    },

    async changeAdminRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!ADMIN_ROLES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${ADMIN_ROLES.join(', ')}`
                });
            }
            
            const admin = await Admin.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            const actingAdminId = req.admin.adminId;
            
            if (admin.role === 'owner' && role !== 'owner') {
                const activeOwnerCount = await Admin.countDocuments({ role: 'owner', isActive: true });
                if (activeOwnerCount <= 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot demote the only active owner account. Ensure another active owner exists first.'
                    });
                }
            }
            
            const oldRole = admin.role;
            admin.role = role;
            await admin.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[17], 'admin', admin._id.toString(), {
                    email: admin.email,
                    oldRole: oldRole,
                    newRole: role
                });
            }
            
            res.json({
                success: true,
                message: 'Admin role updated successfully.',
                data: admin.toSafeObject()
            });
        } catch (error) {
            console.error('[AdminController] Error changing admin role:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change admin role.'
            });
        }
    },

    async deleteAdmin(req, res) {
        try {
            const { id } = req.params;
            
            const admin = await Admin.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            if (admin.role === 'owner' && admin.isActive) {
                const activeOwnerCount = await Admin.countDocuments({ role: 'owner', isActive: true });
                if (activeOwnerCount <= 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot delete the only active owner account. Ensure another active owner exists first.'
                    });
                }
            }
            
            await admin.deleteOne();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[14], 'admin', id, {
                    email: admin.email,
                    role: admin.role
                });
            }
            
            res.json({
                success: true,
                message: 'Admin deleted successfully.'
            });
        } catch (error) {
            console.error('[AdminController] Error deleting admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete admin.'
            });
        }
    },

    // ==================== PROFILE MANAGEMENT ====================

    async getProfile(req, res) {
        try {
            const admin = await Admin.findById(req.admin.adminId).select('-passwordHash');
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            res.json({
                success: true,
                data: admin
            });
        } catch (error) {
            console.error('[AdminController] Error fetching profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile.'
            });
        }
    },

    async updateProfile(req, res) {
        try {
            const { fullName, email, username } = req.body;
            
            const admin = await Admin.findById(req.admin.adminId);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            if (fullName) admin.fullName = String(fullName).trim();
            if (email) admin.email = String(email).toLowerCase().trim();
            if (username) admin.username = String(username).toLowerCase().trim();
            
            await admin.save();
            
            await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[22], 'admin', admin._id.toString(), {
                email: admin.email
            });
            
            res.json({
                success: true,
                message: 'Profile updated successfully.',
                data: admin.toSafeObject()
            });
        } catch (error) {
            console.error('[AdminController] Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile.'
            });
        }
    },

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const adminId = req.admin.adminId;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required.'
                });
            }
            
            const admin = await Admin.findById(adminId);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found.'
                });
            }
            
            const isMatch = await admin.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect.'
                });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long.'
                });
            }
            
            if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain uppercase, lowercase, and numeric characters.'
                });
            }
            
            admin.passwordHash = await bcrypt.hash(newPassword, 12);
            await admin.save();
            
            await logActivity(adminId, ACTIVITY_ACTIONS[23], 'admin', adminId, {
                email: admin.email
            });
            
            res.json({
                success: true,
                message: 'Password changed successfully.'
            });
        } catch (error) {
            console.error('[AdminController] Error changing password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password.'
            });
        }
    },

    // ==================== SETTINGS MANAGEMENT ====================

    async getSettings(req, res) {
        try {
            const { Settings } = require('../models/Settings');
            const settings = await Settings.getSettings();
            
            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('[AdminController] Error fetching settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch settings.'
            });
        }
    },

    async updateSettings(req, res) {
        try {
            const updates = req.body;
            const { Settings } = require('../models/Settings');
            const settings = await Settings.updateSettings(updates);
            
            await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[24], 'settings', settings._id.toString(), {});
            
            res.json({
                success: true,
                message: 'Settings updated successfully.',
                data: settings
            });
        } catch (error) {
            console.error('[AdminController] Error updating settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings.'
            });
        }
    }
};