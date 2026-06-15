const mongoose = require('mongoose');

const CV_TEMPLATE_PURCHASE_STATUSES = ['Pending', 'Paid', 'Failed', 'Cancelled'];

const cvTemplatePurchaseSchema = new mongoose.Schema({
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CVTemplate',
        required: [true, 'Template ID is required']
    },
    templateName: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true
    },
    buyerName: {
        type: String,
        required: [true, 'Buyer name is required'],
        trim: true
    },
    buyerEmail: {
        type: String,
        required: [true, 'Buyer email is required'],
        trim: true,
        lowercase: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    paymentReference: {
        type: String,
        required: true,
        unique: true
    },
    paymentStatus: {
        type: String,
        enum: CV_TEMPLATE_PURCHASE_STATUSES,
        default: 'Pending',
        index: true
    },
    transactionId: {
        type: String,
        default: null
    },
    checkoutId: {
        type: String,
        default: null
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'Download count cannot be negative']
    }
}, {
    timestamps: true
});

cvTemplatePurchaseSchema.index({ buyerEmail: 1 });
cvTemplatePurchaseSchema.index({ paymentStatus: 1, createdAt: -1 });

cvTemplatePurchaseSchema.statics.createOrUpdatePurchase = async function(purchaseData) {
    const { paymentReference, templateId, templateName, buyerName, buyerEmail, amount } = purchaseData;

    let purchase = await this.findOne({ paymentReference });

    if (purchase) {
        purchase.amount = amount;
        purchase.buyerName = buyerName;
        purchase.buyerEmail = buyerEmail;
        await purchase.save();
    } else {
        purchase = await this.create({
            paymentReference,
            templateId,
            templateName,
            buyerName,
            buyerEmail,
            amount,
            paymentStatus: 'Pending'
        });
    }

    return purchase;
};

cvTemplatePurchaseSchema.statics.markAsPaid = async function(paymentReference, paymentData) {
    const { transactionId, checkoutId } = paymentData;

    const purchase = await this.findOneAndUpdate(
        { paymentReference },
        {
            paymentStatus: 'Paid',
            transactionId,
            checkoutId,
            paidAt: new Date()
        },
        { new: true }
    );

    return purchase;
};

cvTemplatePurchaseSchema.statics.findByReference = async function(paymentReference) {
    return await this.findOne({ paymentReference });
};

cvTemplatePurchaseSchema.statics.findByEmailAndTemplate = async function(buyerEmail, templateId) {
    return await this.findOne({
        buyerEmail: buyerEmail.toLowerCase(),
        templateId,
        paymentStatus: 'Paid'
    });
};

const CVTemplatePurchase = mongoose.model('CVTemplatePurchase', cvTemplatePurchaseSchema);

module.exports = {
    CVTemplatePurchase,
    CV_TEMPLATE_PURCHASE_STATUSES
};