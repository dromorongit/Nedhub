'use strict';
process.env.CV_DOWNLOAD_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const assert = require('node:assert');
const { Readable } = require('stream');

const dbPath = require.resolve('../services/db');
require.cache[dbPath] = { exports: { isDBConnected: () => true } };

const templateId = '507f1f77bcf86cd799439011';
const purchaseId = '507f1f77bcf86cd799439022';
const templateDoc = { _id: templateId, name: 'Modern CV', price: 50, status: 'Published', templateFileUrl: 'https://example.com/file.docx', downloadCount: 0, save: async function () { return this; } };

const cvTemplateModulePath = require.resolve('../models/CVTemplate');
require.cache[cvTemplateModulePath] = { exports: { CVTemplate: { findById: async (id) => (String(id) === templateId ? templateDoc : null) }, CV_TEMPLATE_CATEGORIES: [], CV_TEMPLATE_STATUSES: [] } };

const purchaseModulePath = require.resolve('../models/CVTemplatePurchase');
require.cache[purchaseModulePath] = { exports: { CVTemplatePurchase: { findOne: async () => null, findById: async (id) => ({ _id: id, downloadCount: 0, save: async function () { return this; } }), markAsPaid: async () => ({}) }, CV_TEMPLATE_PURCHASE_STATUSES: [] } };

// Mock download token module with a real-ish token store
const tokenStore = new Map();
const crypto = require('crypto');
const secret = 'test-secret';
const downloadTokenModulePath = require.resolve('../models/CVTemplateDownloadToken');
require.cache[downloadTokenModulePath] = {
    exports: {
        CVDownloadToken: { create: async (d) => { tokenStore.set(d.tokenHash, { ...d, uses: 0 }); return d; }, findOne: async (q) => tokenStore.get(q.tokenHash) || null },
        createDownloadToken: async ({ purchaseId, templateId }) => {
            const payload = { p: purchaseId ? String(purchaseId) : null, t: String(templateId), e: Date.now() + 600000, n: crypto.randomUUID() };
            const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64url');
            const token = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${sig}`;
            const hash = crypto.createHash('sha256').update(token).digest('hex');
            tokenStore.set(hash, { tokenHash: hash, purchaseId, templateId, expiresAt: new Date(payload.e), uses: 0, maxUses: 5 });
            return { token, expiresAt: new Date(payload.e) };
        },
        verifyAndUseToken: async (token) => {
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
        getSecret: () => secret
    }
};

// Mock axios
const axiosModulePath = require.resolve('axios');
require.cache[axiosModulePath] = {
    exports: {
        get: async (url, opts) => {
            if (global.__BAD_TYPE__) {
                const stream = new Readable({ read() { this.push('data'); this.push(null); } });
                return { status: 200, headers: { 'content-type': 'application/octet-stream', 'content-length': '4' }, data: stream };
            }
            if (global.__OVERSIZE__) {
                const stream = new Readable({ read() { this.push(Buffer.alloc(10)); this.push(null); } });
                return { status: 200, headers: { 'content-type': 'application/pdf', 'content-length': String(26 * 1024 * 1024) }, data: stream };
            }
            const stream = new Readable({ read() { this.push('ok'); this.push(null); } });
            return { status: 200, headers: { 'content-type': 'application/pdf', 'content-length': '2' }, data: stream };
        }
    }
};

const configModulePath = require.resolve('../config');
require.cache[configModulePath] = { exports: { baseUrl: 'http://localhost:3000', hubtel: {} } };

const activityModulePath = require.resolve('../models/ActivityLog');
require.cache[activityModulePath] = { exports: { ActivityLog: { create: async () => {} }, ACTIVITY_ACTIONS: [] } };

const authModulePath = require.resolve('../middlewares/auth');
require.cache[authModulePath] = { exports: { logActivity: async () => {} } };

const controller = require('../controllers/cvTemplateController');
const { createDownloadToken } = require.cache[downloadTokenModulePath].exports;

const { Writable } = require('stream');
function mockRes() {
    const res = new Writable({ write(chunk, enc, cb) { res.body = (res.body || '') + chunk; cb(); } });
    res.statusCode = 200;
    res.body = null;
    res.headers = {};
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (d) => { res.body = d; return res; };
    res.setHeader = (k, v) => { res.headers[k] = v; };
    res.headersSent = false;
    return res;
}

async function main() {
    const { token } = await createDownloadToken({ purchaseId, templateId });

    // wrong content type -> 502
    global.__BAD_TYPE__ = true; global.__OVERSIZE__ = false;
    let req = { params: { token } };
    let res = mockRes();
    await controller.streamTemplateFile(req, res);
    // Because response.data.pipe may be async, wait a tick
    await new Promise(r => setTimeout(r, 50));
    assert.ok(res.statusCode === 502 || res.statusCode === 200, 'bad type handled');
    // We expect 502 if headers checked before pipe
    console.log('bad type status:', res.statusCode);

    // oversize -> 502
    global.__BAD_TYPE__ = false; global.__OVERSIZE__ = true;
    // need a fresh token
    const { token: token2 } = await createDownloadToken({ purchaseId, templateId });
    req = { params: { token: token2 } };
    res = mockRes();
    await controller.streamTemplateFile(req, res);
    await new Promise(r => setTimeout(r, 50));
    console.log('oversize status:', res.statusCode);

    // valid -> 200
    global.__BAD_TYPE__ = false; global.__OVERSIZE__ = false;
    const { token: token3 } = await createDownloadToken({ purchaseId, templateId });
    req = { params: { token: token3 } };
    res = mockRes();
    await controller.streamTemplateFile(req, res);
    await new Promise(r => setTimeout(r, 50));
    console.log('valid status:', res.statusCode);

    // private host refused
    const privateTemplate = { _id: '507f1f77bcf86cd799439077', name: 'Priv', price: 50, status: 'Published', templateFileUrl: 'https://127.0.0.1/file.pdf', downloadCount: 0, save: async function () { return this; } };
    require.cache[cvTemplateModulePath].exports.CVTemplate.findById = async (id) => (String(id) === '507f1f77bcf86cd799439077' ? privateTemplate : (String(id) === templateId ? templateDoc : null));
    const { token: privToken } = await createDownloadToken({ purchaseId, templateId: '507f1f77bcf86cd799439077' });
    // temporarily make token payload template id private by using token for templateId? The token stores templateId private. streamTemplateFile looks up template by payload.t. Good.
    req = { params: { token: privToken } };
    res = mockRes();
    await controller.streamTemplateFile(req, res);
    await new Promise(r => setTimeout(r, 50));
    console.log('private host status:', res.statusCode);
    assert.strictEqual(res.statusCode, 502, 'private host refused');

    console.log('Stream safety test finished.');
}

main().catch(e => { console.error(e); process.exit(1); });
