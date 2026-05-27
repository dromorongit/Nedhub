/**
 * Career Application Routes
 * Handles job application submissions with Brevo email integration
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { sendJobApplicationEmail, sendApplicationConfirmation } = require('../services/brevoService');

const router = express.Router();

// File path for applications storage
const APPLICATIONS_FILE = path.join(__dirname, '../../data/applications.json');

// Helper: Read JSON file safely
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Helper: Write JSON file safely
async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Helper: Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

        // Prepare application data
        const applicationData = {
            fullName: String(fullName).trim(),
            email: String(email).trim(),
            phone: phone ? String(phone).trim() : '',
            position: String(position).trim(),
            experience: String(experience).trim(),
            linkedin: linkedin ? String(linkedin).trim() : '',
            coverLetter: coverLetter ? String(coverLetter).trim() : '',
            additionalInfo: additionalInfo ? String(additionalInfo).trim() : '',
            cvUrl: String(cvUrl).trim(),
            coverUrl: coverUrl ? String(coverUrl).trim() : ''
        };

        // Save application to JSON file
        const applications = await readJsonFile(APPLICATIONS_FILE);
        const newApplication = {
            id: generateId(),
            jobId: '', // Will be populated if we can match the position
            ...applicationData,
            status: 'Pending',
            submittedAt: new Date().toISOString()
        };
        applications.push(newApplication);
        await writeJsonFile(APPLICATIONS_FILE, applications);

        // Send email to careers team
        const emailResult = await sendJobApplicationEmail(applicationData);

        // Send confirmation email to applicant (non-blocking)
        sendApplicationConfirmation(applicationData).catch(err => {
            console.warn('[CareerRoutes] Confirmation email failed:', err.message);
        });

        return res.status(200).json({
            success: true,
            message: 'Application submitted successfully!',
            data: {
                messageId: emailResult.messageId,
                applicationId: newApplication.id
            }
        });

    } catch (error) {
        console.error('[CareerRoutes] Application submission error:', error);

        // Return safe error message
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
        timestamp: new Date().toISOString()
    });
});

module.exports = router;