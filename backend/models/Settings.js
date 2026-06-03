const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        trim: true,
        default: 'Nedhub GH'
    },
    companyLogo: {
        type: String,
        trim: true,
        default: ''
    },
    recruitmentEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'careers@nedhubgh.com'
    },
    contactNumber: {
        type: String,
        trim: true,
        default: ''
    },
    companyAddress: {
        type: String,
        trim: true,
        default: ''
    },
    websiteUrl: {
        type: String,
        trim: true,
        default: ''
    },
    facebookUrl: {
        type: String,
        trim: true,
        default: ''
    },
    instagramUrl: {
        type: String,
        trim: true,
        default: ''
    },
    linkedinUrl: {
        type: String,
        trim: true,
        default: ''
    },
    twitterUrl: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

settingsSchema.statics.updateSettings = async function(updates) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    
    Object.keys(updates).forEach(key => {
        if (this.schema.paths[key]) {
            settings[key] = updates[key];
        }
    });
    
    return await settings.save();
};

module.exports = {
    Settings: mongoose.model('Settings', settingsSchema)
};