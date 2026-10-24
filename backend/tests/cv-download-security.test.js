'use strict';
process.env.CV_DOWNLOAD_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const assert = require('node:assert');

// Mock db
const dbPath = require.resolve('../services/db');
require.cache[dbPath] = { exports: { isDBConnected: () => true } };

// Mock CVTemplate model
const templateId = '507f1f77bcf86cd799439011';
const purchaseId = '507f1f77bcf86cd799439022';
const templateDoc = { _id: templateId, name: 'Modern CV', price: 50, status: 'Published', templateFileUrl: 'https://example.com/secret.docx', downloadCount: 0, save: async function () { return this; } };
const cvTemplateModulePath = require.resolve('../models/CVTemplate');
require.cache[cvTemplateModulePath] = { exports: { CVTemplate: { findById: async (id) => (String(id) === templateId ? templateDoc : null) }, CV_TEMPLATE_CATEGORIES: [], CV_TEMPLATE_STATUSES: [] } };

// Mock purchase
let purchaseDoc = { _id: purchaseId, templateId: templateId, buyerEmail: 'buyer@example.com', paymentStatus: 'Paid', paymentReference: 'cv-ref-1', downloadCount: 0, save: async function () { return this; } };
const purchaseModulePath = require.resolve('../models/CVTemplatePurchase');
require.cache[purchaseModulePath] = {
    exports: {
        CVTemplatePurchase: {
            findOne: async (q) => {
                if (q && q.paymentReference === 'cv-ref-1' && String(q.templateId) === templateId) return purchaseDoc;
                if (q && q.paymentReference === 'cv-ref-1') return purchaseDoc;
                return null;
            },
            markAsPaid: async (ref, data) => { purchaseDoc.paymentStatus = 'Paid'; purchaseDoc.transactionId = data.transactionId; return purchaseDoc; }
        },
        CV_TEMPLATE_PURCHASE_STATUSES: []
    }
};

// Mock download token model
const tokenStore = new Map();
const downloadTokenModulePath = require.resolve('../models/CVTemplateDownloadToken');
require.cache[downloadTokenModulePath] = {
    exports: {
        CVDownloadToken: {
            create: async (data) => { tokenStore.set(data.tokenHash, { ...data, uses: 0 }); return data; },
            findOne: async (q) => tokenStore.get(q.tokenHash) || null
        },
        createDownloadToken: async ({ purchaseId, templateId }) => {
            const crypto = require('crypto');
            const secret = 'test-secret';
            const payload = { p: purchaseId ? String(purchaseId) : null, t: String(templateId), e: Date.now() + 600000, n: crypto.randomUUID() };
            const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64url');
            const token = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${sig}`;
            const hash = crypto.createHash('sha256').update(token).digest('hex');
            tokenStore.set(hash, { tokenHash: hash, purchaseId, templateId, expiresAt: new Date(payload.e), uses: 0, maxUses: 5 });
            return { token, expiresAt: new Date(payload.e) };
        },
        verifyAndUseToken: async (token) => {
            const crypto = require('crypto');
            const secret = 'test-secret';
            const parts = token.split('.');
            if (parts.length !== 2) return null;
            let payload;
            try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch (e) { return null; }
            const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64url');
            if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[1]))) return null;
            if (Date.now() > Number(payload.e)) return null;
            const hash = crypto.createHash('sha256').update(token).digest('hex');
            const record = tokenStore.get(hash);
            if (!record || record.uses >= record.maxUses) return null;
            record.uses += 1;
            return { payload, record };
        },
        getSecret: () => 'test-secret'
    }
};

// Mock hubtel service
const hubtelModulePath = require.resolve('../services/hubtelService');
require.cache[hubtelModulePath] = {
    exports: {
        checkTransactionStatus: async (ref) => {
            if (ref === 'cv-ref-paid') return { status: 'Success', responseCode: '0000', data: { amount: 50, transactionId: 'txn1', checkoutId: 'chk1' } };
            if (ref === 'cv-ref-unpaid') return { status: 'Pending', responseCode: '9999', data: { amount: 0 } };
            return { status: 'Pending', responseCode: '9999', data: { amount: 0 } };
        },
        verifyCallback: () => true,
        processCallback: (d) => d
    }
};

// Mock config
const configModulePath = require.resolve('../config');
require.cache[configModulePath] = { exports: { baseUrl: 'http://localhost:3000', hubtel: {} } };

// Mock activity/auth
const activityModulePath = require.resolve('../models/ActivityLog');
require.cache[activityModulePath] = { exports: { ActivityLog: { create: async () => {} }, ACTIVITY_ACTIONS: [] } };
const authModulePath = require.resolve('../middlewares/auth');
require.cache[authModulePath] = { exports: { logActivity: async () => {} } };

const controller = require('../controllers/cvTemplateController');

function mockRes() { const res = { statusCode: 200, body: null, headers: {} }; res.status = (c) => { res.statusCode = c; return res; }; res.json = (d) => { res.body = d; return res; }; res.setHeader = (k, v) => { res.headers[k] = v; }; return res; }

async function main() {
    // purchaseStatus paid
    let req = { query: { ref: 'cv-ref-1' } };
    let res = mockRes();
    purchaseDoc.paymentStatus = 'Paid';
    await controller.purchaseStatus(req, res);
    assert.strictEqual(res.body.data.paid, true, 'purchaseStatus paid');
    console.log('PASS purchaseStatus paid');

    // createDownloadLink paid matching
    purchaseDoc.paymentStatus = 'Paid';
    purchaseDoc.buyerEmail = 'buyer@example.com';
    req = { params: { id: templateId }, body: { clientReference: 'cv-ref-1', email: 'buyer@example.com' } };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 200, 'download link paid status');
    assert.ok(res.body.data.url.includes('/file/'), 'download url');
    console.log('PASS createDownloadLink paid');

    // wrong email
    req = { params: { id: templateId }, body: { clientReference: 'cv-ref-1', email: 'other@example.com' } };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 403, 'wrong email 403');
    console.log('PASS createDownloadLink wrong email');

    // wrong ref
    req = { params: { id: templateId }, body: { clientReference: 'nope', email: 'buyer@example.com' } };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 403, 'wrong ref 403');
    console.log('PASS createDownloadLink wrong ref');

    // pending
    purchaseDoc.paymentStatus = 'Pending';
    req = { params: { id: templateId }, body: { clientReference: 'cv-ref-1', email: 'buyer@example.com' } };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 403, 'pending 403');
    console.log('PASS createDownloadLink pending');

    // free template
    const freeTemplate = { _id: '507f1f77bcf86cd799439099', name: 'Free CV', price: 0, status: 'Published', templateFileUrl: 'https://example.com/free.docx', downloadCount: 0, save: async function () { return this; } };
    const origFind = require.cache[cvTemplateModulePath].exports.CVTemplate.findById;
    require.cache[cvTemplateModulePath].exports.CVTemplate.findById = async (id) => (String(id) === '507f1f77bcf86cd799439099' ? freeTemplate : (String(id) === templateId ? templateDoc : null));
    req = { params: { id: '507f1f77bcf86cd799439099' }, body: {} };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 200, 'free download link');
    console.log('PASS createDownloadLink free');

    // purchaseStatus pending runs check and marks paid when hubtel paid
    purchaseDoc.paymentStatus = 'Pending';
    // use a ref that hubtel mock returns paid
    purchaseDoc.paymentReference = 'cv-ref-paid';
    // update findOne mock to return this purchase for cv-ref-paid
    require.cache[purchaseModulePath].exports.CVTemplatePurchase.findOne = async (q) => (q && q.paymentReference === 'cv-ref-paid' ? purchaseDoc : null);
    req = { query: { ref: 'cv-ref-paid' } };
    res = mockRes();
    await controller.purchaseStatus(req, res);
    assert.strictEqual(res.body.data.paid, true, 'status marks paid');
    console.log('PASS purchaseStatus marks paid');

    // unpaid stays pending
    purchaseDoc.paymentStatus = 'Pending';
    purchaseDoc.paymentReference = 'cv-ref-unpaid';
    require.cache[purchaseModulePath].exports.CVTemplatePurchase.findOne = async (q) => (q && q.paymentReference === 'cv-ref-unpaid' ? purchaseDoc : null);
    req = { query: { ref: 'cv-ref-unpaid' } };
    res = mockRes();
    await controller.purchaseStatus(req, res);
    assert.strictEqual(res.body.data.paid, false, 'status unpaid');
    console.log('PASS purchaseStatus unpaid');

    // lower amount does not mark paid
    purchaseDoc.paymentStatus = 'Pending';
    purchaseDoc.paymentReference = 'cv-ref-low';
    require.cache[purchaseModulePath].exports.CVTemplatePurchase.findOne = async (q) => (q && q.paymentReference === 'cv-ref-low' ? purchaseDoc : null);
    require.cache[hubtelModulePath].exports.checkTransactionStatus = async (ref) => ({ status: 'Success', responseCode: '0000', data: { amount: 10, transactionId: 'txn-low', checkoutId: 'chk-low' } });
    req = { query: { ref: 'cv-ref-low' } };
    res = mockRes();
    await controller.purchaseStatus(req, res);
    assert.strictEqual(res.body.data.paid, false, 'lower amount stays pending');
    console.log('PASS purchaseStatus lower amount stays pending');

    // tampered token rejected
    const { createDownloadToken, verifyAndUseToken } = require.cache[downloadTokenModulePath].exports;
    const { token } = await createDownloadToken({ purchaseId: purchaseId, templateId: templateId });
    const tampered = token.slice(0, -4) + 'xxxx';
    const tamperedResult = await verifyAndUseToken(tampered);
    assert.strictEqual(tamperedResult, null, 'tampered token rejected');
    console.log('PASS tampered token rejected');

    // expired token rejected
    const crypto = require('crypto');
    const secret = 'test-secret';
    const expiredPayload = { p: purchaseId, t: templateId, e: Date.now() - 1000, n: crypto.randomUUID() };
    const expiredSig = crypto.createHmac('sha256', secret).update(JSON.stringify(expiredPayload)).digest('base64url');
    const expiredToken = `${Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')}.${expiredSig}`;
    const expiredResult = await verifyAndUseToken(expiredToken);
    assert.strictEqual(expiredResult, null, 'expired token rejected');
    console.log('PASS expired token rejected');

    // use limit
    const { token: limitToken } = await createDownloadToken({ purchaseId: purchaseId, templateId: templateId });
    for (let i = 0; i < 5; i++) {
        const r = await verifyAndUseToken(limitToken);
        assert.ok(r, 'use ' + (i + 1));
    }
    const sixth = await verifyAndUseToken(limitToken);
    assert.strictEqual(sixth, null, 'use limit enforced');
    console.log('PASS use limit enforced');

    // wrong template id with valid ref returns 403
    req = { params: { id: '507f1f77bcf86cd799439999' }, body: { clientReference: 'cv-ref-1', email: 'buyer@example.com' } };
    res = mockRes();
    await controller.createDownloadLink(req, res);
    assert.strictEqual(res.statusCode, 403, 'wrong template 403');
    console.log('PASS createDownloadLink wrong template');

    // non-https templateFileUrl rejected
    req = { body: { name: 'T', category: 'Modern', templateFileUrl: 'http://example.com/f.docx' }, admin: { adminId: 'a' } };
    res = mockRes();
    await controller.createCVTemplate(req, res);
    assert.strictEqual(res.statusCode, 400, 'non-https url 400');
    console.log('PASS createCVTemplate non-https rejected');

    // private address rejected
    req = { body: { name: 'T2', category: 'Modern', templateFileUrl: 'https://127.0.0.1/f.docx' }, admin: { adminId: 'a' } };
    res = mockRes();
    await controller.createCVTemplate(req, res);
    assert.strictEqual(res.statusCode, 400, 'private url 400');
    console.log('PASS createCVTemplate private address rejected');

    console.log('All CV download security tests passed.');
}

main().catch(e => { console.error(e); process.exit(1); });
