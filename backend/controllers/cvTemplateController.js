const { CVTemplate, CV_TEMPLATE_CATEGORIES, CV_TEMPLATE_STATUSES } = require('../models/CVTemplate');
const { CVTemplatePurchase } = require('../models/CVTemplatePurchase');
const { ActivityLog, ACTIVITY_ACTIONS } = require('../models/ActivityLog');
const { logActivity } = require('../middlewares/auth');
const { isDBConnected } = require('../services/db');
const hubtelService = require('../services/hubtelService');

const CV_TEMPLATE_CREATED = ACTIVITY_ACTIONS[26];
const CV_TEMPLATE_UPDATED = ACTIVITY_ACTIONS[27];
const CV_TEMPLATE_ARCHIVED = ACTIVITY_ACTIONS[28];
const CV_TEMPLATE_RESTORED = ACTIVITY_ACTIONS[29];
const CV_TEMPLATE_DOWNLOADED = ACTIVITY_ACTIONS[30];

async function formatCVTemplate(template) {
    return {
        id: template._id,
        name: template.name,
        category: template.category,
        description: template.description,
        thumbnailUrl: template.thumbnailUrl,
        templateFileUrl: template.templateFileUrl,
        price: template.price || 0,
        isPremium: template.price > 0,
        featured: template.featured || false,
        status: template.status,
        downloadCount: template.downloadCount || 0,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
    };
}

module.exports = {
    async getAllCVTemplates(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const templates = await CVTemplate.find().sort({ createdAt: -1 });
            const formattedTemplates = templates.map(formatCVTemplate);
            
            res.json({
                success: true,
                data: formattedTemplates
            });
        } catch (error) {
            console.error('[CVTemplateController] Error fetching templates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch CV templates.'
            });
        }
    },

    async createCVTemplate(req, res) {
        try {
            const { name, category, description, thumbnailUrl, templateFileUrl, featured, status, price } = req.body;
            
            if (!name || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name and category are required.'
                });
            }
            
            if (!CV_TEMPLATE_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid category. Must be one of: ${CV_TEMPLATE_CATEGORIES.join(', ')}`
                });
            }
            
            const parsedPrice = price !== undefined ? Number(price) : 0;
            if (price !== undefined && parsedPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price cannot be negative.'
                });
            }
            
            const template = await CVTemplate.create({
                name: String(name).trim(),
                category,
                description: description ? String(description).trim() : '',
                thumbnailUrl: thumbnailUrl ? String(thumbnailUrl).trim() : '',
                templateFileUrl: templateFileUrl ? String(templateFileUrl).trim() : '',
                featured: Boolean(featured),
                status: status || 'Draft',
                price: parsedPrice,
                createdBy: req.admin ? req.admin.adminId : null
            });
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, CV_TEMPLATE_CREATED, 'cvtemplate', template._id.toString(), {
                    name: template.name,
                    category: template.category,
                    isPremium: template.price > 0
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'CV Template created successfully.',
                data: await formatCVTemplate(template)
            });
        } catch (error) {
            console.error('[CVTemplateController] Error creating template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create CV template.'
            });
        }
    },

    async updateCVTemplate(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const template = await CVTemplate.findById(id);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'CV Template not found.'
                });
            }
            
            if (updates.name !== undefined) {
                template.name = String(updates.name).trim();
            }
            if (updates.category !== undefined) {
                if (!CV_TEMPLATE_CATEGORIES.includes(updates.category)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid category. Must be one of: ${CV_TEMPLATE_CATEGORIES.join(', ')}`
                    });
                }
                template.category = updates.category;
            }
            if (updates.description !== undefined) {
                template.description = String(updates.description).trim();
            }
            if (updates.thumbnailUrl !== undefined) {
                template.thumbnailUrl = String(updates.thumbnailUrl).trim();
            }
            if (updates.templateFileUrl !== undefined) {
                template.templateFileUrl = String(updates.templateFileUrl).trim();
            }
            if (updates.featured !== undefined) {
                template.featured = Boolean(updates.featured);
            }
            if (updates.status !== undefined) {
                if (!CV_TEMPLATE_STATUSES.includes(updates.status)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid status. Must be one of: ${CV_TEMPLATE_STATUSES.join(', ')}`
                    });
                }
                template.status = updates.status;
            }
            if (updates.price !== undefined) {
                const parsedPrice = Number(updates.price);
                if (parsedPrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Price cannot be negative.'
                    });
                }
                template.price = parsedPrice;
            }
            
            await template.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, CV_TEMPLATE_UPDATED, 'cvtemplate', template._id.toString(), {
                    name: template.name
                });
            }
            
            res.json({
                success: true,
                message: 'CV Template updated successfully.',
                data: formatCVTemplate(template)
            });
        } catch (error) {
            console.error('[CVTemplateController] Error updating template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update CV template.'
            });
        }
    },

    async deleteCVTemplate(req, res) {
        try {
            const { id } = req.params;
            
            const template = await CVTemplate.findById(id);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'CV Template not found.'
                });
            }
            
            template.status = 'Archived';
            await template.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, CV_TEMPLATE_ARCHIVED, 'cvtemplate', template._id.toString(), {
                    name: template.name
                });
            }
            
            res.json({
                success: true,
                message: 'CV Template archived successfully.'
            });
        } catch (error) {
            console.error('[CVTemplateController] Error archiving template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive CV template.'
            });
        }
    },

    async restoreCVTemplate(req, res) {
        try {
            const { id } = req.params;
            
            const template = await CVTemplate.findById(id);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'CV Template not found.'
                });
            }
            
            template.status = 'Published';
            await template.save();
            
            if (req.admin?.adminId) {
                await logActivity(req.admin.adminId, CV_TEMPLATE_RESTORED, 'cvtemplate', template._id.toString(), {
                    name: template.name
                });
            }
            
            res.json({
                success: true,
                message: 'CV Template restored successfully.',
                data: formatCVTemplate(template)
            });
        } catch (error) {
            console.error('[CVTemplateController] Error restoring template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restore CV template.'
            });
        }
    },

    async downloadCVTemplate(req, res) {
        try {
            const { id } = req.params;
            
            const template = await CVTemplate.findById(id);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'CV Template not found.'
                });
            }
            
            if (template.status !== 'Published') {
                return res.status(400).json({
                    success: false,
                    message: 'This template is not available for download.'
                });
            }
            
            template.downloadCount += 1;
            await template.save();
            
            await ActivityLog.create({
                adminId: req.admin?.adminId || null,
                action: CV_TEMPLATE_DOWNLOADED,
                targetType: 'cvtemplate',
                targetId: template._id.toString(),
                metadata: {
                    name: template.name,
                    downloadCount: template.downloadCount
                }
            });
            
            res.json({
                success: true,
                message: 'Download counted successfully.',
                data: {
                    downloadUrl: template.templateFileUrl,
                    downloadCount: template.downloadCount
                }
            });
        } catch (error) {
            console.error('[CVTemplateController] Error tracking download:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to track download.'
            });
        }
    },

    async getCVTemplateStats(req, res) {
        try {
            if (!isDBConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Database not available'
                });
            }
            
            const totalTemplates = await CVTemplate.countDocuments();
            const publishedTemplates = await CVTemplate.countDocuments({ status: 'Published' });
            const freeTemplates = await CVTemplate.countDocuments({ status: 'Published', price: 0 });
            const premiumTemplates = await CVTemplate.countDocuments({ status: 'Published', price: { $gt: 0 } });
            const totalDownloads = await CVTemplate.aggregate([
                { $group: { _id: null, total: { $sum: '$downloadCount' } } }
            ]);
            
            const mostDownloaded = await CVTemplate.findOne({ status: 'Published' })
                .sort({ downloadCount: -1 })
                .limit(1);
            
            const totalRevenue = await CVTemplatePurchase.aggregate([
                { $match: { paymentStatus: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const totalPurchases = await CVTemplatePurchase.countDocuments({ paymentStatus: 'Paid' });
            
            const mostPurchasedPipeline = [
                { $match: { paymentStatus: 'Paid' } },
                { $group: { _id: '$templateId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ];
            const mostPurchasedResult = await CVTemplatePurchase.aggregate(mostPurchasedPipeline);
            let mostPurchasedTemplate = null;
            
            if (mostPurchasedResult.length > 0) {
                const template = await CVTemplate.findById(mostPurchasedResult[0]._id);
                if (template) {
                    mostPurchasedTemplate = formatCVTemplate(template);
                    mostPurchasedTemplate.purchaseCount = mostPurchasedResult[0].count;
                }
            }
            
            res.json({
                success: true,
                data: {
                    totalTemplates,
                    publishedTemplates,
                    freeTemplates,
                    premiumTemplates,
                    totalDownloads: totalDownloads[0]?.total || 0,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalPurchases,
                    mostDownloadedTemplate: mostDownloaded ? formatCVTemplate(mostDownloaded) : null,
                    mostPurchasedTemplate
                }
            });
        } catch (error) {
            console.error('[CVTemplateController] Error fetching stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch CV template statistics.'
            });
        }
    },

    async initPayment(req, res) {
        try {
            const { templateId, buyerName, buyerEmail } = req.body;
            
            if (!templateId || !buyerName || !buyerEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: templateId, buyerName, and buyerEmail are required.'
                });
            }
            
            const template = await CVTemplate.findById(templateId);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'CV Template not found.'
                });
            }
            
            if (template.status !== 'Published') {
                return res.status(400).json({
                    success: false,
                    message: 'This template is not available for purchase.'
                });
            }
            
            if (template.price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This template is free. No payment required.'
                });
            }
            
            const clientReference = `cv-${templateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const orderData = {
                amount: template.price,
                description: `CV Template: ${template.name}`,
                customerName: buyerName,
                customerEmail: buyerEmail,
                customerPhone: req.body.buyerPhone || null
            };
            
            const hubtelResponse = await hubtelService.initiatePayment({
                ...orderData,
                clientReference
            });
            
            await CVTemplatePurchase.createOrUpdatePurchase({
                paymentReference: clientReference,
                templateId: template._id,
                templateName: template.name,
                buyerName,
                buyerEmail,
                amount: template.price
            });
            
            res.status(200).json({
                success: true,
                message: 'Payment initialized successfully.',
                data: {
                    clientReference,
                    checkoutUrl: hubtelResponse.checkoutUrl,
                    amount: template.price,
                    templateName: template.name
                }
            });
        } catch (error) {
            console.error('[CVTemplateController] Error initializing payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initialize payment.'
            });
        }
    },

    async verifyPayment(req, res) {
        try {
            const { clientReference } = req.params;
            
            if (!clientReference) {
                return res.status(400).json({
                    success: false,
                    message: 'Client reference is required.'
                });
            }
            
            const purchase = await CVTemplatePurchase.findOne({ paymentReference: clientReference });
            
            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase not found.'
                });
            }
            
            if (purchase.paymentStatus === 'Paid') {
                const template = await CVTemplate.findById(purchase.templateId);
                return res.json({
                    success: true,
                    message: 'Payment already verified.',
                    data: {
                        paymentStatus: 'Paid',
                        templateFileUrl: template?.templateFileUrl,
                        downloadCount: purchase.downloadCount + 1
                    }
                });
            }
            
            const hubtelResponse = await hubtelService.checkTransactionStatus(clientReference);
            
            if (hubtelResponse.status === 'Success' && hubtelResponse.responseCode === '0000') {
                const updatedPurchase = await CVTemplatePurchase.markAsPaid(clientReference, {
                    transactionId: hubtelResponse.data?.transactionId,
                    checkoutId: hubtelResponse.data?.checkoutId
                });
                
                const template = await CVTemplate.findById(purchase.templateId);
                
                res.json({
                    success: true,
                    message: 'Payment verified successfully.',
                    data: {
                        paymentStatus: 'Paid',
                        templateFileUrl: template?.templateFileUrl,
                        downloadCount: updatedPurchase.downloadCount + 1
                    }
                });
            } else {
                res.json({
                    success: true,
                    message: 'Payment pending or failed.',
                    data: {
                        paymentStatus: purchase.paymentStatus,
                        hubtelStatus: hubtelResponse.status,
                        hubtelResponseCode: hubtelResponse.responseCode
                    }
                });
            }
        } catch (error) {
            console.error('[CVTemplateController] Error verifying payment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify payment.'
            });
        }
    },

    async downloadPremium(req, res) {
        try {
            const { clientReference } = req.params;
            const { buyerEmail } = req.body;
            
            if (!clientReference) {
                return res.status(400).json({
                    success: false,
                    message: 'Client reference is required.'
                });
            }
            
            const purchase = await CVTemplatePurchase.findOne({ paymentReference: clientReference });
            
            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase not found.'
                });
            }
            
            if (buyerEmail && buyerEmail.toLowerCase() !== purchase.buyerEmail.toLowerCase()) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized download attempt.'
                });
            }
            
            if (purchase.paymentStatus !== 'Paid') {
                return res.status(402).json({
                    success: false,
                    message: 'Payment not verified. Please complete payment before downloading.'
                });
            }
            
            purchase.downloadCount += 1;
            await purchase.save();
            
            const template = await CVTemplate.findById(purchase.templateId);
            
            template.downloadCount += 1;
            await template.save();
            
            await ActivityLog.create({
                adminId: null,
                action: CV_TEMPLATE_DOWNLOADED,
                targetType: 'cvtemplate',
                targetId: template._id.toString(),
                metadata: {
                    name: template.name,
                    buyerEmail: purchase.buyerEmail,
                    paymentReference: clientReference
                }
            });
            
            res.json({
                success: true,
                message: 'Download authorized.',
                data: {
                    downloadUrl: template.templateFileUrl,
                    downloadCount: template.downloadCount,
                    purchaseDownloadCount: purchase.downloadCount
                }
            });
        } catch (error) {
            console.error('[CVTemplateController] Error authorizing download:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to authorize download.'
            });
        }
    },

    async checkDownloadAuthorization(req, res) {
        try {
            const { templateId } = req.params;
            const { buyerEmail } = req.query;
            
            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    message: 'Template ID is required.'
                });
            }
            
            const template = await CVTemplate.findById(templateId);
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found.'
                });
            }
            
            if (template.price === 0) {
                return res.json({
                    success: true,
                    canDownload: true,
                    isFree: true,
                    downloadUrl: template.templateFileUrl
                });
            }
            
            if (!buyerEmail) {
                return res.json({
                    success: true,
                    canDownload: false,
                    isFree: false,
                    message: 'Email required to verify purchase.'
                });
            }
            
            const purchase = await CVTemplatePurchase.findOne({
                templateId: template._id,
                buyerEmail: buyerEmail.toLowerCase(),
                paymentStatus: 'Paid'
            });
            
            res.json({
                success: true,
                canDownload: !!purchase,
                isFree: false,
                paymentReference: purchase?.paymentReference || null
            });
        } catch (error) {
            console.error('[CVTemplateController] Error checking download authorization:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check download authorization.'
            });
        }
    }
};