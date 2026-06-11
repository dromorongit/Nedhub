/**
 * Career Application Routes
 * Handles job application submissions with Brevo email integration
 */

const express = require('express');
const { Job, JOB_TYPES } = require('../models/Job');
const { Application, APPLICATION_STATUSES } = require('../models/Application');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { isDBConnected } = require('../services/db');
const { sendJobApplicationEmail, sendApplicationConfirmation } = require('../services/brevoService');

const router = express.Router();

// Format job for public API response
function formatJobPublic(job) {
    const isActive = job.active !== false && job.status === 'Published';
    const isEmailDestination = job.applicationMethod === 'external' && 
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(job.applicationUrl);
    return {
        id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities || [],
        icon: job.icon || getIconForJob(job),
        salary: 'Competitive',
        deadline: job.deadline,
        active: isActive,
        status: job.status,
        applicationMethod: job.applicationMethod,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        applicationUrl: job.applicationUrl,
        isEmailDestination: isEmailDestination,
        source: job.source
    };
}

/**
 * @route POST /api/careers/apply
 * @desc Submit a job application
 * @access Public
 */
router.post('/careers/apply', async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            position,
            experience,
            linkedin,
            coverLetter,
            additionalInfo,
            cvUrl,
            coverUrl
        } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !position || !experience || !cvUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide full name, email, position, experience, and CV URL.'
            });
        }
        
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format.'
            });
        }
        
        // Validate URL format
        const urlRegex = /^(https?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+%=]/;
        if (!urlRegex.test(cvUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CV URL format.'
            });
        }
        
        let jobId = null;
        if (isDBConnected()) {
            const job = await Job.findOne({ title: position.trim() });
            if (job) {
                jobId = job._id;
            }
        }
        
        const applicationData = {
            fullName: String(fullName).trim(),
            email: String(email).trim().toLowerCase(),
            phone: phone ? String(phone).trim() : '',
            position: String(position).trim(),
            experience: String(experience).trim(),
            linkedin: linkedin ? String(linkedin).trim() : '',
            coverLetter: coverLetter ? String(coverLetter).trim() : '',
            additionalInfo: additionalInfo ? String(additionalInfo).trim() : '',
            cvUrl: String(cvUrl).trim(),
            coverUrl: coverUrl ? String(coverUrl).trim() : ''
        };

        if (isDBConnected()) {
            const createdApp = await Application.create({
                jobId,
                applicantName: applicationData.fullName,
                email: applicationData.email,
                phone: applicationData.phone,
                linkedin: applicationData.linkedin,
                yearsOfExperience: applicationData.experience,
                coverLetter: applicationData.coverLetter,
                cvUrl: applicationData.cvUrl,
                coverLetterFileUrl: applicationData.coverUrl,
                status: APPLICATION_STATUSES[0],
                position: applicationData.position
            });

            await ActivityLog.create({
                adminId: null,
                action: ACTIVITY_ACTIONS[3],
                targetType: 'application',
                targetId: createdApp._id.toString(),
                metadata: {
                    jobTitle: applicationData.position,
                    applicantEmail: applicationData.email
                }
            });
        }
        
        const emailResult = await sendJobApplicationEmail(applicationData);
        
        sendApplicationConfirmation(applicationData).catch(err => {
            console.warn('[CareerRoutes] Confirmation email failed:', err.message);
        });
        
        return res.status(200).json({
            success: true,
            message: 'Application submitted successfully!',
            data: {
                messageId: emailResult.messageId
            }
        });
        
    } catch (error) {
        console.error('[CareerRoutes] Application submission error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to submit application. Please try again or contact careers@nedhubgh.com directly.'
        });
    }
});

/**
 * @route GET /api/careers/health
 * @desc Health check for career application service
 * @access Public
 */
router.get('/careers/health', (req, res) => {
    res.json({
        service: 'Career Application API',
        status: 'operational',
        database: isDBConnected() ? 'connected' : 'fallback',
        timestamp: new Date().toISOString()
    });
});

// ==================== PUBLIC JOBS ENDPOINT ====================

/**
 * @route GET /api/careers/jobs
 * @desc Get all active jobs (public endpoint)
 * @access Public
 */
router.get('/careers/jobs', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const jobs = await Job.find({
            status: 'Published',
            $or: [
                { active: true },
                { active: { $exists: false } }
            ]
        }).sort({ featured: -1, createdAt: -1 });
        const formattedJobs = jobs.map(formatJobPublic);
        
        res.json({
            success: true,
            data: formattedJobs
        });
    } catch (error) {
        console.error('[CareerRoutes] Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        });
    }
});

/**
 * @route GET /api/careers/settings
 * @desc Get public settings (for footer, contact info, etc)
 * @access Public
 */
router.get('/careers/settings', async (req, res) => {
    try {
        const { Settings } = require('../models/Settings');
        const settings = await Settings.getSettings();
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('[CareerRoutes] Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
});

// ==================== JOB ICON HELPER ====================

function getIconForJob(job) {
    const iconMap = {
        'Senior Recruitment Consultant': 'fa-user-tie',
        'Data Analyst': 'fa-chart-line',
        'Training Coordinator': 'fa-graduation-cap',
        'Marketing Specialist': 'fa-bullhorn',
        'HR Officer': 'fa-users',
        'IT Support Specialist': 'fa-laptop-code'
    };
    return iconMap[job.title] || 'fa-briefcase';
}

module.exports = router;