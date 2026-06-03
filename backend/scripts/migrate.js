require('dotenv').config({ path: '../.env' });
const { connectDB } = require('../services/db');
const { Job, JOB_TYPES } = require('../models/Job');
const { Application, APPLICATION_STATUSES } = require('../models/Application');
const { Admin, ADMIN_ROLES } = require('../models/Admin');
const fs = require('fs').promises;
const path = require('path');

const JOBS_FILE = path.join(__dirname, '../../data/jobs.json');
const APPLICATIONS_FILE = path.join(__dirname, '../../data/applications.json');

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

async function migrateJobs() {
    console.log('[Migration] Starting jobs migration...');
    
    const jobs = await readJsonFile(JOBS_FILE);
    const count = await Job.countDocuments();
    
    if (count > 0) {
        console.log(`[Migration] Jobs already exist in database (${count} records)`);
        return;
    }
    
    const iconMap = {
        'Senior Recruitment Consultant': 'fa-user-tie',
        'Data Analyst': 'fa-chart-line',
        'Training Coordinator': 'fa-graduation-cap',
        'Marketing Specialist': 'fa-bullhorn',
        'HR Officer': 'fa-users',
        'IT Support Specialist': 'fa-laptop-code'
    };
    
    let createdCount = 0;
    
    for (const job of jobs) {
        try {
            await Job.create({
                title: job.title,
                department: job.department || 'General',
                location: job.location,
                type: JOB_TYPES.includes(job.type) ? job.type : 'Full-Time',
                description: job.description,
                requirements: job.requirements || [],
                deadline: job.deadline ? new Date(job.deadline) : null,
                featured: job.featured || false,
                active: job.active !== false,
                createdBy: null,
                icon: iconMap[job.title] || 'fa-briefcase'
            });
            createdCount++;
        } catch (error) {
            console.error(`[Migration] Failed to migrate job ${job.id}:`, error.message);
        }
    }
    
    console.log(`[Migration] Migrated ${createdCount} jobs`);
}

async function migrateApplications() {
    console.log('[Migration] Starting applications migration...');
    
    const applications = await readJsonFile(APPLICATIONS_FILE);
    const count = await Application.countDocuments();
    
    if (count > 0) {
        console.log(`[Migration] Applications already exist in database (${count} records)`);
        return;
    }
    
    let createdCount = 0;
    
    for (const app of applications) {
        try {
            const job = await Job.findOne({ title: app.position });
            
            await Application.create({
                jobId: job ? job._id : null,
                applicantName: app.fullName,
                email: app.email,
                phone: app.phone || '',
                linkedin: app.linkedin || '',
                yearsOfExperience: app.experience,
                coverLetter: app.coverLetter || '',
                cvUrl: app.cvUrl,
                coverLetterFileUrl: app.coverUrl || '',
                status: APPLICATION_STATUSES.includes(app.status?.toLowerCase()) ? app.status.toLowerCase() : 'pending'
            });
            createdCount++;
        } catch (error) {
            console.error(`[Migration] Failed to migrate application ${app.id}:`, error.message);
        }
    }
    
    console.log(`[Migration] Migrated ${createdCount} applications`);
}

async function migrateAdminRoles() {
    console.log('[Migration] Checking for admin role migration...');
    
    const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
    
    if (superAdminCount > 0) {
        console.log(`[Migration] Found ${superAdminCount} super_admin account(s), migrating to owner...`);
        await Admin.updateMany({ role: 'super_admin' }, { $set: { role: 'owner' } });
        console.log('[Migration] Admin roles migrated successfully');
    } else {
        console.log('[Migration] No super_admin accounts found, no migration needed');
    }
}

async function runMigration() {
    console.log('[Migration] Starting database migration...');
    
    await connectDB();
    await migrateJobs();
    await migrateApplications();
    await migrateAdminRoles();
    
    console.log('[Migration] Migration complete');
    process.exit(0);
}

runMigration().catch(error => {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
});