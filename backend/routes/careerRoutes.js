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
const { sendJobApplicationEmail, sendApplicationConfirmation, sanitizeBrevoError } = require('../services/brevoService');
const hubtelService = require('../services/hubtelService');

const router = express.Router();

// Format job for public API response
function formatJobPublic(job) {
    const safeStatus = job.status || 'Draft';
    const safeCategory = job.category || 'Other Jobs';
    const safeType = job.type || 'Full-Time';
    const isActive = job.active !== false && safeStatus === 'Published';
    const safeApplicationMethod = job.applicationMethod || 'internal';
    const safeApplicationUrl = job.applicationUrl || '';
    const isEmailDestination = safeApplicationMethod === 'external' && 
        safeApplicationUrl && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(safeApplicationUrl);
    return {
        id: job._id,
        title: job.title || '',
        department: job.department || 'General',
        category: safeCategory,
        location: job.location || '',
        type: safeType,
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        icon: job.icon || getIconForJob(job),
        salary: 'Competitive',
        deadline: job.deadline || null,
        active: isActive,
        status: safeStatus,
        applicationMethod: safeApplicationMethod,
        companyName: job.companyName || '',
        companyLogo: job.companyLogo || '',
        applicationUrl: safeApplicationUrl,
        isEmailDestination: isEmailDestination || false,
        source: job.source || ''
    };
}

// Format CV template for public API response
function formatCVTemplate(template) {
    return {
        id: template._id,
        name: template.name || 'Untitled Template',
        category: template.category || 'Professional',
        description: template.description || '',
        thumbnailUrl: template.thumbnailUrl || '',
        templateFileUrl: template.templateFileUrl || '',
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
 *
 * Flow:
 *   1. Validate submitted application data
 *   2. Validate uploaded file URLs (CV, cover letter)
 *   3. Save the application record to MongoDB (emailStatus = pending)
 *   4. Attempt to send the application email through Brevo
 *   5. Attempt to send applicant confirmation email (best-effort)
 *   6. Return a definitive HTTP response to the frontend
 *
 * Email failures never invalidate an already-saved application.
 */
router.post('/careers/apply', async (req, res) => {
    console.log('[CareerRoutes] Application submission started');
    console.log('[CareerRoutes] Applicant email domain:', (req.body?.email || '').split('@')[1] || 'unknown');

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

        // === 1. Validate submitted application data ===
        if (!fullName || !email || !position || !experience || !cvUrl) {
            console.warn('[CareerRoutes] Validation failed: missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide full name, email, position, experience, and CV URL.'
            });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            console.warn('[CareerRoutes] Validation failed: invalid email format');
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format.'
            });
        }

        // === 2. Validate uploaded file URLs ===
        const urlRegex = /^(https?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+%=]/;
        if (!urlRegex.test(cvUrl)) {
            console.warn('[CareerRoutes] Validation failed: invalid CV URL format');
            return res.status(400).json({
                success: false,
                message: 'Invalid CV URL format.'
            });
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

        // === 3. Save the application record to MongoDB ===
        let createdApp = null;

        if (isDBConnected()) {
            let jobId = null;
            try {
                const job = await Job.findOne({ title: position.trim() });
                if (job) {
                    jobId = job._id;
                }
            } catch (jobLookupError) {
                console.warn('[CareerRoutes] Job lookup failed:', jobLookupError.message);
            }

            try {
                createdApp = await Application.create({
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
                    position: applicationData.position,
                    emailStatus: 'pending'
                });

                console.log('[CareerRoutes] Application created in MongoDB:', createdApp._id);

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
            } catch (saveError) {
                console.error('[CareerRoutes] Failed to save application to MongoDB:', saveError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Application could not be submitted. Please try again.'
                });
            }
        }

        // === 4. Attempt to send the application email through Brevo ===
        let emailSuccess = false;

        if (createdApp) {
            try {
                const emailResult = await sendJobApplicationEmail(applicationData);

                if (emailResult && emailResult.success) {
                    emailSuccess = true;
                    createdApp.emailStatus = 'sent';
                    createdApp.emailSentAt = new Date();
                    await createdApp.save();
                    console.log('[CareerRoutes] Brevo email sent successfully for application:', createdApp._id);
                } else {
                    emailSuccess = false;
                    const safeError = (emailResult && emailResult.error)
                        ? emailResult.error
                        : 'Failed to send application email';
                    createdApp.emailStatus = 'failed';
                    createdApp.emailError = safeError;
                    await createdApp.save();
                    console.warn('[CareerRoutes] Brevo email failed for application', String(createdApp._id), '-', safeError);
                }
            } catch (emailError) {
                emailSuccess = false;
                const safeError = sanitizeBrevoError(emailError).safeMessage;
                createdApp.emailStatus = 'failed';
                createdApp.emailError = safeError;
                try { await createdApp.save(); } catch (updateError) {
                    console.error('[CareerRoutes] Failed to update email status:', updateError.message);
                }
                console.warn('[CareerRoutes] Brevo email errored for application', String(createdApp._id), '-', safeError);
            }
        } else {
            // Database fallback mode – attempt email best-effort
            try {
                const emailResult = await sendJobApplicationEmail(applicationData);
                if (emailResult && emailResult.success) {
                    console.log('[CareerRoutes] Brevo email sent (DB fallback mode, no tracking)');
                } else {
                    console.warn('[CareerRoutes] Brevo email failed (DB fallback mode):', (emailResult && emailResult.error) || 'unknown error');
                }
            } catch (emailError) {
                console.warn('[CareerRoutes] Brevo email errored (DB fallback mode):', sanitizeBrevoError(emailError).safeMessage);
            }
        }

        // === 5. Attempt to send applicant confirmation email (best-effort) ===
        try {
            const confirmResult = await sendApplicationConfirmation(applicationData);
            if (confirmResult && confirmResult.success) {
                console.log('[CareerRoutes] Confirmation email sent for application', createdApp ? String(createdApp._id) : '(no DB)');
            } else {
                console.warn('[CareerRoutes] Confirmation email failed (non-blocking):', (confirmResult && confirmResult.error) || 'unknown error');
            }
        } catch (confirmError) {
            console.warn('[CareerRoutes] Confirmation email errored (non-blocking):', sanitizeBrevoError(confirmError).safeMessage);
        }

        // === 6. Return a definitive HTTP response to the frontend ===
        if (!createdApp) {
            // Database fallback mode – no application stored, but email was attempted
            return res.status(200).json({
                success: true,
                message: 'Application submitted successfully! We will contact you soon.'
            });
        }

        if (emailSuccess) {
            return res.status(200).json({
                success: true,
                message: 'Application submitted successfully and notification email sent.'
            });
        }

        // Application was saved to MongoDB, but email delivery failed.
        // Per policy: do NOT tell the applicant the application failed.
        return res.status(202).json({
            success: true,
            message: 'Application received successfully, but email notification is temporarily unavailable.'
        });

    } catch (error) {
        console.error('[CareerRoutes] Unexpected error in application submission:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Application could not be submitted. Please try again.'
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
        console.error('[CareerRoutes] Failed to fetch public jobs:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        });
    }
});

/**
   * @route GET /api/careers/jobs/:id
   * @desc Get a single job by ID (public endpoint)
   * @access Public
   */
 router.get('/careers/jobs/:id', async (req, res) => {
    try {
         if (!isDBConnected()) {
             return res.status(503).json({
                 success: false,
                 message: 'Service temporarily unavailable'
             });
         }
         
         const { id } = req.params;
         const job = await Job.findById(id);
         
         if (!job) {
             return res.status(404).json({
                 success: false,
                 message: 'Job not found'
             });
         }
         
         res.json({
             success: true,
             data: formatJobPublic(job)
         });
} catch (error) {
        console.error('[CareerRoutes] Failed to fetch public job by ID:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job'
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
        console.error('[CareerRoutes] Failed to fetch settings:', error);
        console.error(error.stack);
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
    return iconMap[job && job.title] || 'fa-briefcase';
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
        console.error('[CareerRoutes] Failed to fetch CV templates:', error);
        console.error(error.stack);
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
        console.error('[CareerRoutes] Failed to process CV template download:', error);
        console.error(error.stack);
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
        console.error('[CareerRoutes] Failed to initialize template purchase:', error);
        console.error(error.stack);
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
        console.error('[CareerRoutes] Failed to check authorization:', error);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to check authorization.'
        });
    }
});

module.exports = router;