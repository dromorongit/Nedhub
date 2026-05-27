/**
 * Admin Routes
 * Handles job management and application viewing for admin panel
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { requireAdminAuth, handleAdminLogin, handleAdminLogout } = require('../middlewares/adminAuth');

const router = express.Router();

// File paths
const JOBS_FILE = path.join(__dirname, '../../data/jobs.json');
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
 * @access Public
 */
router.post('/admin/logout', handleAdminLogout);

// ==================== JOB MANAGEMENT ROUTES ====================

/**
 * @route GET /api/admin/jobs
 * @desc Get all jobs (admin view - includes inactive)
 * @access Private (Admin)
 */
router.get('/admin/jobs', requireAdminAuth, async (req, res) => {
    try {
        const jobs = await readJsonFile(JOBS_FILE);
        const applications = await readJsonFile(APPLICATIONS_FILE);
        
        // Count applications per job
        const appCounts = {};
        applications.forEach(app => {
            const jobId = app.jobId || app.position;
            if (jobId) {
                appCounts[jobId] = (appCounts[jobId] || 0) + 1;
            }
        });
        
        // Add application count to each job
        const jobsWithCounts = jobs.map(job => ({
            ...job,
            applicationCount: appCounts[job.id] || appCounts[job.title] || 0
        }));
        
        res.json({
            success: true,
            data: jobsWithCounts
        });
    } catch (error) {
        console.error('[AdminRoutes] Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs.'
        });
    }
});

/**
 * @route POST /api/admin/jobs
 * @desc Create a new job
 * @access Private (Admin)
 */
router.post('/admin/jobs', requireAdminAuth, async (req, res) => {
    try {
        const {
            title,
            department,
            location,
            type,
            description,
            requirements,
            deadline,
            featured,
            active
        } = req.body;

        // Validate required fields
        if (!title || !location || !type || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, location, type, and description are required.'
            });
        }

        // Validate job type
        const validTypes = ['Full-Time', 'Part-Time', 'Remote', 'Contract', 'Internship'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid job type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Read existing jobs
        const jobs = await readJsonFile(JOBS_FILE);

        // Create new job
        const newJob = {
            id: generateId(),
            title: String(title).trim(),
            department: department ? String(department).trim() : 'General',
            location: String(location).trim(),
            type: type,
            description: String(description).trim(),
            requirements: Array.isArray(requirements) 
                ? requirements.map(r => String(r).trim()).filter(r => r)
                : [],
            deadline: deadline || null,
            featured: Boolean(featured),
            active: active !== undefined ? Boolean(active) : true,
            postedDate: new Date().toISOString().split('T')[0]
        };

        // Add to jobs array
        jobs.push(newJob);

        // Write back to file
        await writeJsonFile(JOBS_FILE, jobs);

        res.status(201).json({
            success: true,
            message: 'Job created successfully.',
            data: newJob
        });
    } catch (error) {
        console.error('[AdminRoutes] Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job.'
        });
    }
});

/**
 * @route PUT /api/admin/jobs/:id
 * @desc Update a job
 * @access Private (Admin)
 */
router.put('/admin/jobs/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Read existing jobs
        const jobs = await readJsonFile(JOBS_FILE);
        const jobIndex = jobs.findIndex(job => job.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }

        // Validate job type if provided
        if (updates.type) {
            const validTypes = ['Full-Time', 'Part-Time', 'Remote', 'Contract', 'Internship'];
            if (!validTypes.includes(updates.type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job type. Must be one of: ${validTypes.join(', ')}`
                });
            }
        }

        // Update job (only allow specific fields)
        const allowedFields = ['title', 'department', 'location', 'type', 'description', 'requirements', 'deadline', 'featured', 'active'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'requirements' && Array.isArray(updates[field])) {
                    jobs[jobIndex][field] = updates[field].map(r => String(r).trim()).filter(r => r);
                } else if (field === 'featured' || field === 'active') {
                    jobs[jobIndex][field] = Boolean(updates[field]);
                } else {
                    jobs[jobIndex][field] = String(updates[field]).trim();
                }
            }
        });

        // Write back to file
        await writeJsonFile(JOBS_FILE, jobs);

        res.json({
            success: true,
            message: 'Job updated successfully.',
            data: jobs[jobIndex]
        });
    } catch (error) {
        console.error('[AdminRoutes] Error updating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update job.'
        });
    }
});

/**
 * @route DELETE /api/admin/jobs/:id
 * @desc Delete a job (soft delete - mark as inactive)
 * @access Private (Admin)
 */
router.delete('/admin/jobs/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Read existing jobs
        const jobs = await readJsonFile(JOBS_FILE);
        const jobIndex = jobs.findIndex(job => job.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }

        // Soft delete - mark as inactive
        jobs[jobIndex].active = false;

        // Write back to file
        await writeJsonFile(JOBS_FILE, jobs);

        res.json({
            success: true,
            message: 'Job marked as inactive successfully.'
        });
    } catch (error) {
        console.error('[AdminRoutes] Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job.'
        });
    }
});

// ==================== APPLICATION MANAGEMENT ROUTES ====================

/**
 * @route GET /api/admin/applications
 * @desc Get all applications
 * @access Private (Admin)
 */
router.get('/admin/applications', requireAdminAuth, async (req, res) => {
    try {
        const applications = await readJsonFile(APPLICATIONS_FILE);
        
        // Get jobs for position names
        const jobs = await readJsonFile(JOBS_FILE);
        const jobMap = {};
        jobs.forEach(job => {
            jobMap[job.id] = job.title;
        });

        // Add position name to applications
        const applicationsWithPosition = applications.map(app => ({
            ...app,
            positionName: jobMap[app.jobId] || app.position || 'Unknown Position'
        }));

        res.json({
            success: true,
            data: applicationsWithPosition
        });
    } catch (error) {
        console.error('[AdminRoutes] Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications.'
        });
    }
});

/**
 * @route PUT /api/admin/applications/:id/status
 * @desc Update application status
 * @access Private (Admin)
 */
router.put('/admin/applications/:id/status', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Read existing applications
        const applications = await readJsonFile(APPLICATIONS_FILE);
        const appIndex = applications.findIndex(app => app.id === id);

        if (appIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Application not found.'
            });
        }

        // Update status
        applications[appIndex].status = status;
        applications[appIndex].updatedAt = new Date().toISOString();

        // Write back to file
        await writeJsonFile(APPLICATIONS_FILE, applications);

        res.json({
            success: true,
            message: 'Application status updated successfully.',
            data: applications[appIndex]
        });
    } catch (error) {
        console.error('[AdminRoutes] Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status.'
        });
    }
});

/**
 * @route GET /api/admin/applications/:id
 * @desc Get single application
 * @access Private (Admin)
 */
router.get('/admin/applications/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const applications = await readJsonFile(APPLICATIONS_FILE);
        const application = applications.find(app => app.id === id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found.'
            });
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('[AdminRoutes] Error fetching application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application.'
        });
    }
});

module.exports = router;