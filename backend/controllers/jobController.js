const { Job, JOB_TYPES, JOB_STATUSES, APPLICATION_METHODS, JOB_CATEGORIES } = require('../models/Job');
const { Application: ApplicationModel, APPLICATION_STATUSES } = require('../models/Application');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { logActivity } = require('../middlewares/auth');
const { isDBConnected } = require('../services/db');

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isValidEmail(value) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
}

function validateApplicationDestination(value) {
    if (!value || String(value).trim() === '') return false;
    return isValidUrl(value) || isValidEmail(value);
}

function formatJob(job) {
    const isActive = job.active !== false && job.status === 'Published';
    const isArchived = job.status === 'Archived';
    const isEmailDestination = job.applicationMethod === 'external' && isValidEmail(job.applicationUrl);
    return {
        id: job._id,
        title: job.title,
        department: job.department,
        category: job.category,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        deadline: job.deadline,
        featured: job.featured,
        active: isActive,
        archived: isArchived,
        status: job.status,
        applicationMethod: job.applicationMethod,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        applicationUrl: job.applicationUrl,
        isEmailDestination: isEmailDestination,
        source: job.source,
        createdBy: job.createdBy,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
    };
}

async function checkExpiredJobs() {
    if (!isDBConnected()) return;
    
    try {
        const now = new Date();
        await Job.updateMany(
            { deadline: { $lt: now }, status: 'Published' },
            { $set: { status: 'Archived', active: false } }
        );
    } catch (error) {
        console.error('[JobController] Error checking expired jobs:', error.message);
    }
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
                category,
                location,
                type,
                description,
                requirements,
                responsibilities,
                deadline,
                featured,
                status,
                applicationMethod,
                companyName,
                companyLogo,
                applicationUrl,
                source
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
            
            if (!category || !JOB_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job category. Must be one of: ${JOB_CATEGORIES.join(', ')}`
                });
            }
            
            const appMethod = applicationMethod || 'internal';
            if (!APPLICATION_METHODS.includes(appMethod)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid application method. Must be one of: ${APPLICATION_METHODS.join(', ')}`
                });
            }
            
            if (appMethod === 'external') {
                if (!companyName || String(companyName).trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: 'Company name is required for external jobs.'
                    });
                }
                if (!applicationUrl || String(applicationUrl).trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: 'Application destination is required for external jobs.'
                    });
                }
                if (!validateApplicationDestination(applicationUrl)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Application destination must be a valid URL or email address.'
                    });
                }
            }
            
            const job = await Job.create({
                title: String(title).trim(),
                department: department ? String(department).trim() : 'General',
                category: category,
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
                active: true,
                status: status || 'Published',
                applicationMethod: appMethod,
                companyName: companyName ? String(companyName).trim() : '',
                companyLogo: companyLogo ? String(companyLogo).trim() : '',
                applicationUrl: applicationUrl ? String(applicationUrl).trim() : '',
                source: source ? String(source).trim() : '',
                createdBy: req.admin ? req.admin.adminId : null
            });
            
            if (req.admin?.adminId) {
                const activityAction = appMethod === 'external' ? ACTIVITY_ACTIONS[18] : ACTIVITY_ACTIONS[19];
                await logActivity(req.admin.adminId, activityAction, 'job', job._id.toString(), {
                    title: job.title,
                    applicationMethod: appMethod
                });
            }
            
            checkExpiredJobs();
            
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
            
            if (updates.category && !JOB_CATEGORIES.includes(updates.category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job category. Must be one of: ${JOB_CATEGORIES.join(', ')}`
                });
            }
            
            if (updates.status && !JOB_STATUSES.includes(updates.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid job status. Must be one of: ${JOB_STATUSES.join(', ')}`
                });
            }
            
            const allowedFields = ['title', 'department', 'category', 'location', 'type', 'description', 'requirements', 'responsibilities', 'deadline', 'featured', 'active', 'status', 'applicationMethod', 'companyName', 'companyLogo', 'applicationUrl', 'source'];
            
            // Validate applicationUrl for external jobs
            const targetAppMethod = updates.applicationMethod || job.applicationMethod;
            if (updates.applicationUrl !== undefined) {
                if (targetAppMethod === 'external') {
                    if (!updates.applicationUrl || String(updates.applicationUrl).trim() === '') {
                        return res.status(400).json({
                            success: false,
                            message: 'Application destination is required for external jobs.'
                        });
                    }
                    if (!validateApplicationDestination(updates.applicationUrl)) {
                        return res.status(400).json({
                            success: false,
                            message: 'Application destination must be a valid URL or email address.'
                        });
                    }
                }
            }
            
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    if (field === 'requirements' && Array.isArray(updates[field])) {
                        job[field] = updates[field].map(r => String(r).trim()).filter(r => r);
                    } else if (field === 'responsibilities' && Array.isArray(updates[field])) {
                        job[field] = updates[field].map(r => String(r).trim()).filter(r => r);
                    } else if (field === 'featured' || field === 'active') {
                        job[field] = Boolean(updates[field]);
                    } else if (field === 'status') {
                        job[field] = updates[field];
                    } else if (field === 'applicationMethod') {
                        job[field] = updates[field];
                    } else if (field === 'deadline') {
                        job[field] = updates[field] ? new Date(updates[field]) : null;
                    } else if (field === 'companyLogo' || field === 'applicationUrl') {
                        job[field] = updates[field] ? String(updates[field]).trim() : '';
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
            
            checkExpiredJobs();
            
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
            
            job.status = 'Archived';
            job.active = false;
            await job.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, ACTIVITY_ACTIONS[2], 'job', job._id.toString(), {
                    title: job.title
                });
            }
            
            res.json({
                success: true,
                message: 'Job archived successfully.'
            });
        } catch (error) {
            console.error('[JobController] Error archiving job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive job.'
            });
        }
    },

    async updateJobStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !JOB_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${JOB_STATUSES.join(', ')}`
                });
            }
            
            const job = await Job.findById(id);
            
            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found.'
                });
            }
            
            const oldStatus = job.status;
            job.status = status;
            job.active = status === 'Published';
            await job.save();
            
            if (req.admin?.adminId) {
                const activityAction = status === 'Published' ? ACTIVITY_ACTIONS[20] : 
                    status === 'Archived' ? ACTIVITY_ACTIONS[21] : ACTIVITY_ACTIONS[0];
                await logActivity(req.admin.adminId, activityAction, 'job', job._id.toString(), {
                    title: job.title,
                    oldStatus,
                    newStatus: status
                });
            }
            
            res.json({
                success: true,
                message: `Job ${status.toLowerCase()} successfully.`,
                data: formatJob(job)
            });
        } catch (error) {
            console.error('[JobController] Error updating job status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update job status.'
            });
        }
    },

    async getDashboardStats(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const totalJobs = await Job.countDocuments();
            const activeJobs = await Job.countDocuments({ 
                status: 'Published', 
                $or: [{ active: true }, { active: { $exists: false } }] 
            });
            const internalJobs = await Job.countDocuments({ 
                applicationMethod: 'internal', 
                status: 'Published',
                $or: [{ active: true }, { active: { $exists: false } }]
            });
            const externalJobs = await Job.countDocuments({ 
                applicationMethod: 'external', 
                status: 'Published',
                $or: [{ active: true }, { active: { $exists: false } }]
            });
            
            const applicationCounts = await ApplicationModel.countDocuments();
            const pendingApps = await ApplicationModel.countDocuments({ status: 'pending' });
            const shortlistedApps = await ApplicationModel.countDocuments({ status: 'shortlisted' });
            
            res.json({
                success: true,
                data: {
                    totalJobs,
                    activeJobs,
                    internalJobs,
                    externalJobs,
                    totalApplications: applicationCounts,
                    pendingApplications: pendingApps,
                    shortlistedApplications: shortlistedApps
                }
            });
        } catch (error) {
            console.error('[JobController] Error fetching dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics.'
            });
        }
    },

    async getAnalytics(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const applicationsByMonth = await ApplicationModel.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ]);
            
            const applicationsByJob = await ApplicationModel.aggregate([
                { $match: { jobId: { $ne: null } } },
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'jobId',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                { $unwind: '$job' },
                {
                    $group: {
                        _id: '$job.title',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            
            const mostAppliedJobs = await ApplicationModel.aggregate([
                { $match: { jobId: { $ne: null } } },
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'jobId',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                { $unwind: '$job' },
                {
                    $group: {
                        _id: '$job._id',
                        title: { $first: '$job.title' },
                        count: { $sum: 1 },
                        applicationMethod: { $first: '$job.applicationMethod' }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            
            const activeJobsCount = await Job.countDocuments({ 
                status: 'Published',
                $or: [{ active: true }, { active: { $exists: false } }]
            });
            const externalJobsCount = await Job.countDocuments({ 
                applicationMethod: 'external', 
                status: 'Published',
                $or: [{ active: true }, { active: { $exists: false } }]
            });
            
            res.json({
                success: true,
                data: {
                    applicationsByMonth,
                    applicationsByJob,
                    mostAppliedJobs,
                    activeJobsCount,
                    externalJobsCount
                }
            });
        } catch (error) {
            console.error('[JobController] Error fetching analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch analytics.'
            });
        }
    },

    async getRecentApplications(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const recentApps = await ApplicationModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('jobId', 'title');
            
            const formattedApps = recentApps.map(app => ({
                id: app._id,
                applicantName: app.applicantName,
                positionName: app.jobId ? app.jobId.title : app.position,
                status: app.status,
                emailStatus: app.emailStatus,
                submittedAt: app.createdAt
            }));
            
            res.json({
                success: true,
                data: formattedApps
            });
        } catch (error) {
            console.error('[JobController] Error fetching recent applications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent applications.'
            });
        }
    },

    async getJobsByCategoryStats(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const jobsByCategory = await Job.aggregate([
                { $match: { status: 'Published' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            res.json({
                success: true,
                data: jobsByCategory
            });
        } catch (error) {
            console.error('[JobController] Error fetching jobs by category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category statistics.'
            });
        }
    },

    async getApplicationsByCategoryStats(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const applicationsByCategory = await ApplicationModel.aggregate([
                { $match: { jobId: { $ne: null } } },
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'jobId',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                { $unwind: '$job' },
                { $group: { _id: '$job.category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            res.json({
                success: true,
                data: applicationsByCategory
            });
        } catch (error) {
            console.error('[JobController] Error fetching applications by category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application category statistics.'
            });
        }
    }
};