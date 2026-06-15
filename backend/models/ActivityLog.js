const mongoose = require('mongoose');

const ACTIVITY_ACTIONS = [
    'JOB_CREATED',
    'JOB_UPDATED',
    'JOB_DELETED',
    'APPLICATION_SUBMITTED',
    'APPLICATION_REVIEWED',
    'APPLICATION_SHORTLISTED',
    'APPLICATION_INTERVIEWED',
    'APPLICATION_HIRED',
    'APPLICATION_REJECTED',
    'ADMIN_LOGIN',
    'ADMIN_LOGOUT',
    'OWNER_REGISTERED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DISABLED',
    'USER_REACTIVATED',
    'PASSWORD_RESET',
    'USER_ROLE_CHANGED',
    'INTERNAL_JOB_CREATED',
    'EXTERNAL_JOB_CREATED',
    'JOB_PUBLISHED',
    'JOB_ARCHIVED',
    'JOB_FEATURED',
    'PROFILE_UPDATED',
    'PASSWORD_CHANGED',
    'SETTINGS_UPDATED',
    'CV_TEMPLATE_CREATED',
    'CV_TEMPLATE_UPDATED',
    'CV_TEMPLATE_ARCHIVED',
    'CV_TEMPLATE_RESTORED',
    'CV_TEMPLATE_DOWNLOADED'
];

const activityLogSchema = new mongoose.Schema({
adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false
    },
    action: {
        type: String,
        enum: ACTIVITY_ACTIONS,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        trim: true
    },
    targetId: {
        type: String,
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = {
    ActivityLog: mongoose.model('ActivityLog', activityLogSchema),
    ACTIVITY_ACTIONS
};
