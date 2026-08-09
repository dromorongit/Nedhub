const { Job } = require('../models/Job');
const { Application, APPLICATION_STATUSES } = require('../models/Application');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { logActivity } = require('../middlewares/auth');
const { isDBConnected } = require('../services/db');

module.exports = {
    async getAllApplications(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const applications = await Application.find().populate('jobId', 'title');
            
            const formattedApps = applications.map(app => ({
                id: app._id,
                jobId: app.jobId ? app.jobId._id : null,
                positionName: app.jobId ? app.jobId.title : app.position || 'Unknown Position',
                applicantName: app.applicantName,
                email: app.email,
                phone: app.phone,
                linkedin: app.linkedin,
                yearsOfExperience: app.yearsOfExperience,
                coverLetter: app.coverLetter,
                cvUrl: app.cvUrl,
                coverLetterFileUrl: app.coverLetterFileUrl,
                status: app.status,
                emailStatus: app.emailStatus,
                emailError: app.emailError,
                emailSentAt: app.emailSentAt,
                submittedAt: app.createdAt,
                updatedAt: app.updatedAt
            }));
            
            res.json({
                success: true,
                data: formattedApps
            });
        } catch (error) {
            console.error('[ApplicationController] Error fetching applications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch applications.'
            });
        }
    },

    async getApplicationById(req, res) {
        try {
            const { id } = req.params;
            
            const application = await Application.findById(id).populate('jobId', 'title');
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found.'
                });
            }
            
            const formattedApp = {
                id: application._id,
                jobId: application.jobId ? application.jobId._id : null,
                positionName: application.jobId ? application.jobId.title : application.position || 'Unknown Position',
                applicantName: application.applicantName,
                email: application.email,
                phone: application.phone,
                linkedin: application.linkedin,
                yearsOfExperience: application.yearsOfExperience,
                coverLetter: application.coverLetter,
                cvUrl: application.cvUrl,
                coverLetterFileUrl: application.coverLetterFileUrl,
                status: application.status,
                emailStatus: application.emailStatus,
                emailError: application.emailError,
                emailSentAt: application.emailSentAt,
                submittedAt: application.createdAt,
                updatedAt: application.updatedAt
            };
            
            res.json({
                success: true,
                data: formattedApp
            });
        } catch (error) {
            console.error('[ApplicationController] Error fetching application:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application.'
            });
        }
    },

    async updateApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !APPLICATION_STATUSES.includes(status.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${APPLICATION_STATUSES.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
                });
            }
            
            const application = await Application.findById(id);
            
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found.'
                });
            }
            
            const oldStatus = application.status;
            application.status = status.toLowerCase();
            await application.save();
            
            const actionMap = {
                reviewed: ACTIVITY_ACTIONS[4],
                shortlisted: ACTIVITY_ACTIONS[5],
                interviewed: ACTIVITY_ACTIONS[6],
                hired: ACTIVITY_ACTIONS[7],
                rejected: ACTIVITY_ACTIONS[8]
            };
            
            if (req.admin?.adminId && actionMap[application.status]) {
                await logActivity(req.admin.adminId, actionMap[application.status], 'application', application._id.toString(), {
                    oldStatus,
                    newStatus: application.status
                });
            }
            
            res.json({
                success: true,
                message: 'Application status updated successfully.',
                data: {
                    id: application._id,
                    status: application.status
                }
            });
        } catch (error) {
            console.error('[ApplicationController] Error updating application status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update application status.'
            });
        }
    }
};