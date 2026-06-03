const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_ROLES = ['owner', 'admin'];
const ADMIN_ROLE_ENUM = ADMIN_ROLES;

const adminSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ADMIN_ROLE_ENUM,
        default: 'admin',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

adminSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
};

adminSchema.methods.toSafeObject = function() {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

adminSchema.statics.findByCredentials = async function(email, password) {
    const admin = await this.findOne({ email, isActive: true });
    if (!admin) return null;
    
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return null;
    
    return admin;
};

adminSchema.statics.getAdminCount = async function() {
    return await this.countDocuments();
};

adminSchema.statics.getActiveOwnerCount = async function() {
    return await this.countDocuments({ role: 'owner', isActive: true });
};

module.exports = {
    Admin: mongoose.model('Admin', adminSchema),
    ADMIN_ROLES
};