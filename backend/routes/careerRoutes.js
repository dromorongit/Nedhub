/**
 * Career Application Routes
 * Handles job application submissions with Brevo email integration
 */

const express = require('express');
const { Job, JOB_TYPES, JOB_CATEGORIES } = require('../models/Job');
const { Application, APPLICATION_STATUSES } = require('../models/Application');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { CVTemplate, CV_TEMPLATE_CATEGORIES } = require('../models/CVTemplate');
const { CVTemplatePurchase } = require('../models/CVTemplatePurchase');
const { isDBConnected } = require('../services/db');
const { sendJobApplicationEmail, sendApplicationConfirmation } = require('../services/brevoService');
const hubtelService = require('../services/hubtelService');

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
        category: job.category,
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

// Format CV template for public API response
function formatCVTemplate(template) {
    return {
        id: template._id,
        name: template.name,
        category: template.category,
        description: template.description,
        thumbnailUrl: template.thumbnailUrl,
        templateFileUrl: template.templateFileUrl,
        price: template.price || 0,
        isPremium: (template.price || 0) > 0,
        featured: template.featured || false,
        downloadCount: template.downloadCount || 0
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
        
        if (!fullName || !email || !position || !experience || !cvUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide full name, email, position, experience, and CV URL.'
            });
        }
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format.'
            });
        }
        
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
  * @desc Get all active jobs (public endpoint) with optional category filter
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
        
        const { category } = req.query;
        const query = {
            status: 'Published',
            $or: [
                { active: true },
                { active: { $exists: false } }
            ]
        };
        
        if (category && JOB_CATEGORIES.includes(category)) {
            query.category = category;
        }
        
        const jobs = await Job.find(query).sort({ featured: -1, createdAt: -1 });
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


// ==================== CV TEMPLATES PUBLIC ENDPOINT ====================

/**
  * @route GET /api/careers/cv-templates
  * @desc Get all published CV templates (public endpoint)
  * @access Public
  */
router.get('/careers/cv-templates', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const templates = await CVTemplate.find({ status: 'Published' })
            .sort({ featured: -1, createdAt: -1 });
        
        const formattedTemplates = templates.map(formatCVTemplate);
        
        res.json({
            success: true,
            data: formattedTemplates
        });
    } catch (error) {
        console.error('[CareerRoutes] Error fetching CV templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CV templates'
        });
    }
});

/**
  * @route POST /api/careers/cv-templates/:id/download
  * @desc Download template (free) or authorize download (premium)
  * @access Public
  */
router.post('/careers/cv-templates/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const { buyerEmail } = req.body;
        
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const template = await CVTemplate.findById(id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'CV Template not found'
            });
        }
        
        if (template.status !== 'Published') {
            return res.status(400).json({
                success: false,
                message: 'This template is not available for download'
            });
        }
        
        if (template.price === 0) {
            template.downloadCount += 1;
            await template.save();
            
            await ActivityLog.create({
                adminId: null,
                action: ACTIVITY_ACTIONS[30],
                targetType: 'cvtemplate',
                targetId: template._id.toString(),
                metadata: {
                    name: template.name,
                    downloadCount: template.downloadCount
                }
            });
            
            res.json({
                success: true,
                message: 'Download ready.',
                data: {
                    downloadUrl: template.templateFileUrl,
                    isFree: true,
                    downloadCount: template.downloadCount
                }
            });
        } else {
            if (!buyerEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email required for premium template download.'
                });
            }
            
            const purchase = await CVTemplatePurchase.findOne({
                templateId: template._id,
                buyerEmail: buyerEmail.toLowerCase(),
                paymentStatus: 'Paid'
            });
            
            if (!purchase) {
                return res.status(402).json({
                    success: false,
                    message: 'Payment required. Please purchase this template before downloading.'
                });
            }
            
            template.downloadCount += 1;
            await template.save();
            
            purchase.downloadCount += 1;
            await purchase.save();
            
            await ActivityLog.create({
                adminId: null,
                action: ACTIVITY_ACTIONS[30],
                targetType: 'cvtemplate',
                targetId: template._id.toString(),
                metadata: {
                    name: template.name,
                    buyerEmail: buyerEmail,
                    paymentReference: purchase.paymentReference
                }
            });
            
            res.json({
                success: true,
                message: 'Download authorized.',
                data: {
                    downloadUrl: template.templateFileUrl,
                    isFree: false,
                    downloadCount: template.downloadCount
                }
            });
        }
    } catch (error) {
        console.error('[CareerRoutes] Error processing download:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process download'
        });
    }
});

/**
  * @route POST /api/careers/cv-templates/purchase/init
  * @desc Initialize payment for premium template
  * @access Public
  */
router.post('/careers/cv-templates/purchase/init', async (req, res) => {
    try {
        const { templateId, buyerName, buyerEmail } = req.body;
        
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const template = await CVTemplate.findById(templateId);
        
        if (!template || template.status !== 'Published') {
            return res.status(404).json({
                success: false,
                message: 'Template not found or not available.'
            });
        }
        
        if (template.price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'This template is free.'
            });
        }
        
        const clientReference = `cv-${templateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const hubtelResponse = await hubtelService.initiatePayment({
            amount: template.price,
            description: `CV Template: ${template.name}`,
            customerName: buyerName,
            customerEmail: buyerEmail,
            clientReference
        });
        
        await CVTemplatePurchase.createOrUpdatePurchase({
            paymentReference: clientReference,
            templateId: template._id,
            templateName: template.name,
            buyerName,
            buyerEmail,
            amount: template.price
        });
        
        res.status(200).json({
            success: true,
            message: 'Payment initialized.',
            data: {
                clientReference,
                checkoutUrl: hubtelResponse.checkoutUrl,
                amount: template.price,
                templateName: template.name
            }
        });
    } catch (error) {
        console.error('[CareerRoutes] Error initializing template purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment.'
        });
    }
});

/**
  * @route GET /api/careers/cv-templates/authorize/:templateId
  * @desc Check download authorization for premium template
  * @access Public
  */
router.get('/careers/cv-templates/authorize/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { buyerEmail } = req.query;
        
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const template = await CVTemplate.findById(templateId);
        
        if (!template || template.status !== 'Published') {
            return res.status(404).json({
                success: false,
                message: 'Template not found.'
            });
        }
        
        if (template.price === 0) {
            return res.json({
                success: true,
                canDownload: true,
                isFree: true,
                downloadUrl: template.templateFileUrl
            });
        }
        
        if (!buyerEmail) {
            return res.json({
                success: true,
                canDownload: false,
                isFree: false,
                message: 'Email required to verify purchase.'
            });
        }
        
        const purchase = await CVTemplatePurchase.findOne({
            templateId: template._id,
            buyerEmail: buyerEmail.toLowerCase(),
            paymentStatus: 'Paid'
        });
        
        res.json({
            success: true,
            canDownload: !!purchase,
            isFree: false,
            paymentReference: purchase?.paymentReference || null
        });
    } catch (error) {
        console.error('[CareerRoutes] Error checking authorization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check authorization.'
        });
    }
});

module.exports = router;