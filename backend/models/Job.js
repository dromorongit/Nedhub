const mongoose = require('mongoose');

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Contract', 'Internship'];
const JOB_TYPE_ENUM = JOB_TYPES;

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

jobSchema.index({ active: 1, featured: -1 });

jobSchema.methods.toPublicObject = function() {
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
        active: this.active,
        createdBy: this.createdBy,
        icon: this.icon,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = {
    Job: mongoose.model('Job', jobSchema),
    JOB_TYPES
};