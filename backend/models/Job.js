const mongoose = require('mongoose');

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Contract', 'Internship'];
const JOB_TYPE_ENUM = JOB_TYPES;

const JOB_STATUSES = ['Draft', 'Published', 'Archived'];
const JOB_STATUS_ENUM = JOB_STATUSES;

const APPLICATION_METHODS = ['internal', 'external'];
const APPLICATION_METHOD_ENUM = APPLICATION_METHODS;

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters']
    },
    department: {
        type: String,
        trim: true,
        default: 'General'
    },
    location: {
        type: String,
        required: [true, 'Job location is required'],
        trim: true
    },
    type: {
        type: String,
        enum: JOB_TYPE_ENUM,
        required: [true, 'Job type is required']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters']
    },
    requirements: [{
        type: String,
        trim: true
    }],
    responsibilities: [{
        type: String,
        trim: true
    }],
    deadline: {
        type: Date,
        default: null
    },
    featured: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: JOB_STATUS_ENUM,
        default: 'Published'
    },
    applicationMethod: {
        type: String,
        enum: APPLICATION_METHOD_ENUM,
        default: 'internal'
    },
    companyName: {
        type: String,
        trim: true,
        default: ''
    },
    companyLogo: {
        type: String,
        trim: true,
        default: ''
    },
    applicationUrl: {
        type: String,
        trim: true,
        default: ''
    },
    source: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    icon: {
        type: String,
        trim: true,
        default: 'fa-briefcase'
    }
}, {
    timestamps: true
});

jobSchema.index({ status: 1, featured: -1 });
jobSchema.index({ applicationMethod: 1 });

jobSchema.pre('validate', function(next) {
    if (this.applicationMethod === 'external') {
        if (!this.companyName || this.companyName.trim() === '') {
            this.invalidate('companyName', 'Company name is required for external jobs');
        }
        if (!this.applicationUrl || this.applicationUrl.trim() === '') {
            this.invalidate('applicationUrl', 'Application destination is required for external jobs');
        }
        // Validate as either URL or email
        const urlPattern = /^https?:\/\/.+/i;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!urlPattern.test(this.applicationUrl) && !emailPattern.test(this.applicationUrl)) {
            this.invalidate('applicationUrl', 'Application destination must be a valid URL (https://...) or email address');
        }
    }
    next();
});

jobSchema.virtual('isActive').get(function() {
    return this.active !== false && this.status === 'Published';
});

jobSchema.methods.toPublicObject = function() {
    const isEmailDestination = this.applicationMethod === 'external' && 
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.applicationUrl);
    return {
        id: this._id,
        title: this.title,
        department: this.department,
        location: this.location,
        type: this.type,
        description: this.description,
        requirements: this.requirements,
        responsibilities: this.responsibilities,
        deadline: this.deadline,
        featured: this.featured,
        active: this.active !== false && this.status === 'Published',
        status: this.status,
        applicationMethod: this.applicationMethod,
        companyName: this.companyName,
        companyLogo: this.companyLogo,
        applicationUrl: this.applicationUrl,
        isEmailDestination: isEmailDestination,
        source: this.source,
        createdBy: this.createdBy,
        icon: this.icon,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = {
    Job: mongoose.model('Job', jobSchema),
    JOB_TYPES,
    JOB_STATUSES,
    APPLICATION_METHODS
};