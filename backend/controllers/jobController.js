const { Job, JOB_TYPES } = require('../models/Job');
const { Application: ApplicationModel, APPLICATION_STATUSES } = require('../models/Application');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { logActivity } = require('../middlewares/auth');
const { isDBConnected } = require('../services/db');

function formatJob(job) {
    return {
        id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        deadline: job.deadline,
        featured: job.featured,
        active: job.active,
        createdBy: job.createdBy,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
    };
}

module.exports = {
    async getAllJobs(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const jobs = await Job.find().sort({ createdAt: -1 });
            const applications = await ApplicationModel.find();
            
            const appCounts = {};
            applications.forEach(app => {
                const jobId = app.jobId ? app.jobId.toString() : null;
                if (jobId) {
                    appCounts[jobId] = (appCounts[jobId] || 0) + 1;
                }
            });
            
            const jobsWithCounts = jobs.map(job => ({
                ...formatJob(job),
                applicationCount: appCounts[job._id.toString()] || 0
            }));
            
            res.json({
                success: true,
                data: jobsWithCounts
            });
        } catch (error) {
            console.error('[JobController] Error fetching jobs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch jobs.'
            });
        }
    },

    async createJob(req, res) {
        try {
            const {
                title,
                department,
                location,
                type,
                description,
                requirements,
                responsibilities,
                deadline,
                featured,
                active
            } = req.body;
            
            if (!title || !location || !type || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: title, location, type, and description are required.'
                });
            }
            
            if (!JOB_TYPES.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job type. Must be one of: ${JOB_TYPES.join(', ')}`
                });
            }
            
            const job = await Job.create({
                title: String(title).trim(),
                department: department ? String(department).trim() : 'General',
                location: String(location).trim(),
                type,
                description: String(description).trim(),
                requirements: Array.isArray(requirements) 
                    ? requirements.map(r => String(r).trim()).filter(r => r)
                    : [],
                responsibilities: Array.isArray(responsibilities)
                    ? responsibilities.map(r => String(r).trim()).filter(r => r)
                    : [],
                deadline: deadline ? new Date(deadline) : null,
                featured: Boolean(featured),
                active: active !== undefined ? Boolean(active) : true,
                createdBy: req.admin ? req.admin.adminId : null
            });
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[0], 'job', job._id.toString(), {
                    title: job.title
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Job created successfully.',
                data: formatJob(job)
            });
        } catch (error) {
            console.error('[JobController] Error creating job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create job.'
            });
        }
    },

    async updateJob(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const job = await Job.findById(id);
            
            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found.'
                });
            }
            
            if (updates.type && !JOB_TYPES.includes(updates.type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job type. Must be one of: ${JOB_TYPES.join(', ')}`
                });
            }
            
            const allowedFields = ['title', 'department', 'location', 'type', 'description', 'requirements', 'responsibilities', 'deadline', 'featured', 'active'];
            
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    if (field === 'requirements' && Array.isArray(updates[field])) {
                        job[field] = updates[field].map(r => String(r).trim()).filter(r => r);
                    } else if (field === 'responsibilities' && Array.isArray(updates[field])) {
                        job[field] = updates[field].map(r => String(r).trim()).filter(r => r);
                    } else if (field === 'featured' || field === 'active') {
                        job[field] = Boolean(updates[field]);
                    } else if (field === 'deadline') {
                        job[field] = updates[field] ? new Date(updates[field]) : null;
                    } else {
                        job[field] = String(updates[field]).trim();
                    }
                }
            });
            
            await job.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[1], 'job', job._id.toString(), {
                    title: job.title
                });
            }
            
            res.json({
                success: true,
                message: 'Job updated successfully.',
                data: formatJob(job)
            });
        } catch (error) {
            console.error('[JobController] Error updating job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update job.'
            });
        }
    },

    async deleteJob(req, res) {
        try {
            const { id } = req.params;
            
            const job = await Job.findById(id);
            
            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found.'
                });
            }
            
            job.active = false;
            await job.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[2], 'job', job._id.toString(), {
                    title: job.title
                });
            }
            
            res.json({
                success: true,
                message: 'Job marked as inactive successfully.'
            });
        } catch (error) {
            console.error('[JobController] Error deleting job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete job.'
            });
        }
    }
};