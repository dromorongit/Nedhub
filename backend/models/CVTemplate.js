const mongoose = require('mongoose');

const CV_TEMPLATE_CATEGORIES = [
    'Modern',
    'Classic',
    'Creative',
    'Professional',
    'Executive',
    'Basic',
    'Industry-Specific'
];

const CV_TEMPLATE_STATUSES = ['Draft', 'Published', 'Archived'];

const cvTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters']
    },
    category: {
        type: String,
        enum: CV_TEMPLATE_CATEGORIES,
        required: [true, 'Template category is required']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    thumbnailUrl: {
        type: String,
        trim: true,
        required: [true, 'Thumbnail URL is required']
    },
    templateFileUrl: {
        type: String,
        trim: true,
        required: [true, 'Template file URL is required']
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: CV_TEMPLATE_STATUSES,
        default: 'Draft'
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'Download count cannot be negative']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true
});

cvTemplateSchema.index({ status: 1, featured: -1 });
cvTemplateSchema.index({ category: 1 });
cvTemplateSchema.index({ price: 1 });

cvTemplateSchema.virtual('isPremium').get(function() {
    return this.price > 0;
});

cvTemplateSchema.methods.toPublicObject = function() {
    return {
        id: this._id,
        name: this.name,
        category: this.category,
        description: this.description,
        thumbnailUrl: this.thumbnailUrl,
        templateFileUrl: this.templateFileUrl,
        price: this.price,
        isPremium: this.isPremium,
        featured: this.featured,
        status: this.status,
        downloadCount: this.downloadCount,
        createdBy: this.createdBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

cvTemplateSchema.methods.toAdminObject = function() {
    return {
        id: this._id,
        name: this.name,
        category: this.category,
        description: this.description,
        thumbnailUrl: this.thumbnailUrl,
        templateFileUrl: this.templateFileUrl,
        price: this.price,
        isPremium: this.isPremium,
        featured: this.featured,
        status: this.status,
        downloadCount: this.downloadCount,
        createdBy: this.createdBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = {
    CVTemplate: mongoose.model('CVTemplate', cvTemplateSchema),
    CV_TEMPLATE_CATEGORIES,
    CV_TEMPLATE_STATUSES
};
