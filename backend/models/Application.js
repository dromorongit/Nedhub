const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'];

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        default: null
    },
    applicantName: {
        type: String,
        required: [true, 'Applicant name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format']
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    linkedin: {
        type: String,
        trim: true,
        default: ''
    },
    yearsOfExperience: {
        type: String,
        trim: true,
        required: true
    },
    coverLetter: {
        type: String,
        trim: true,
        default: ''
    },
    cvUrl: {
        type: String,
        required: [true, 'CV URL is required'],
        trim: true
    },
    coverLetterFileUrl: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: APPLICATION_STATUSES,
        default: 'pending'
    },
    position: {
        type: String,
        trim: true,
        default: ''
    },
    emailStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    emailError: {
        type: String,
        default: ''
    },
    emailSentAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ emailStatus: 1 });

module.exports = {
    Application: mongoose.model('Application', applicationSchema),
    APPLICATION_STATUSES
};