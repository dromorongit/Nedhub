'use strict';

const assert = require('node:assert');

// Mock DB as connected before requiring controller
const dbPath = require.resolve('../services/db');
require.cache[dbPath] = { exports: { isDBConnected: () => true } };

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Contract', 'Internship'];
const JOB_STATUSES = ['Draft', 'Published', 'Archived'];
const APPLICATION_METHODS = ['internal', 'external'];
const JOB_CATEGORIES = ['Information Technology (IT)', 'Other Jobs'];

function makeJob(data) {
    const j = Object.assign({}, data, { _id: data && data._id ? data._id : '507f1f77bcf86cd799439011', save: async function () { return this; } });
    return j;
}

const JobMock = {
    create: async (data) => makeJob(data),
    findById: async (id) => makeJob({ _id: id, title: 'Existing Job', applicationMethod: 'external', applicationUrl: 'https://example.com/old', status: 'Published', active: true, category: 'Information Technology (IT)', type: 'Full-Time', location: 'Accra', description: 'desc' }),
    updateMany: async () => {}
};

const jobModulePath = require.resolve('../models/Job');
require.cache[jobModulePath] = { exports: { Job: JobMock, JOB_TYPES, JOB_STATUSES, APPLICATION_METHODS, JOB_CATEGORIES } };

const appModulePath = require.resolve('../models/Application');
require.cache[appModulePath] = { exports: { Application: { find: async () => [] }, APPLICATION_STATUSES: ['pending'] } };

const activityModulePath = require.resolve('../models/ActivityLog');
require.cache[activityModulePath] = { exports: { ActivityLog: { create: async () => {} }, ACTIVITY_ACTIONS: [] } };

const authModulePath = require.resolve('../middlewares/auth');
require.cache[authModulePath] = { exports: { logActivity: async () => {} } };

const controller = require('../controllers/jobController');

function mockRes() {
    const res = { statusCode: 200, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
}

async function runCreate(payload) {
    const req = { body: payload, admin: { adminId: 'admin1' } };
    const res = mockRes();
    await controller.createJob(req, res);
    return res;
}

async function runUpdate(id, payload) {
    const req = { params: { id }, body: payload, admin: { adminId: 'admin1' } };
    const res = mockRes();
    await controller.updateJob(req, res);
    return res;
}

async function main() {
    const base = {
        title: 'Test Job',
        location: 'Accra',
        type: 'Full-Time',
        description: 'A valid description for testing purposes.',
        category: 'Information Technology (IT)',
        applicationMethod: 'external',
        companyName: 'Partner Co'
    };

    // valid https
    let r = await runCreate({ ...base, applicationUrl: 'https://example.com/apply' });
    assert.strictEqual(r.statusCode, 201, 'valid https create');
    assert.strictEqual(r.body.data.applicationUrl, 'https://example.com/apply', 'stored url');
    console.log('PASS create valid https');

    // leading space trimmed
    r = await runCreate({ ...base, applicationUrl: ' https://example.com ' });
    assert.strictEqual(r.statusCode, 201, 'leading space create');
    assert.strictEqual(r.body.data.applicationUrl, 'https://example.com', 'trimmed url');
    console.log('PASS create trimmed https');

    // uppercase protocol
    r = await runCreate({ ...base, applicationUrl: 'HTTPS://EXAMPLE.COM/APPLY' });
    assert.strictEqual(r.statusCode, 201, 'uppercase protocol create');
    console.log('PASS create uppercase https');

    // valid email
    r = await runCreate({ ...base, applicationUrl: 'careers@example.com' });
    assert.strictEqual(r.statusCode, 201, 'email create');
    console.log('PASS create email');

    // mailto: prefix is not a valid stored value
    r = await runCreate({ ...base, applicationUrl: 'mailto:careers@example.com' });
    assert.strictEqual(r.statusCode, 400, 'mailto create');
    console.log('PASS create mailto: rejected');

    // invalid javascript
    r = await runCreate({ ...base, applicationUrl: 'javascript:alert(1)' });
    assert.strictEqual(r.statusCode, 400, 'javascript create');
    console.log('PASS create javascript rejected');

    // data:
    r = await runCreate({ ...base, applicationUrl: 'data:text/html,x' });
    assert.strictEqual(r.statusCode, 400, 'data create');
    console.log('PASS create data rejected');

    // vbscript
    r = await runCreate({ ...base, applicationUrl: 'vbscript:x' });
    assert.strictEqual(r.statusCode, 400, 'vbscript create');
    console.log('PASS create vbscript rejected');

    // relative path
    r = await runCreate({ ...base, applicationUrl: '/apply' });
    assert.strictEqual(r.statusCode, 400, 'relative create');
    console.log('PASS create relative rejected');

    // empty external
    r = await runCreate({ ...base, applicationUrl: '' });
    assert.strictEqual(r.statusCode, 400, 'empty create');
    console.log('PASS create empty rejected');

    // invalid email
    r = await runCreate({ ...base, applicationUrl: 'not-an-email' });
    assert.strictEqual(r.statusCode, 400, 'invalid email create');
    console.log('PASS create invalid email rejected');

    // too long
    r = await runCreate({ ...base, applicationUrl: 'https://example.com/' + 'a'.repeat(2000) });
    assert.strictEqual(r.statusCode, 400, 'too long create');
    console.log('PASS create too long rejected');

    // update valid
    r = await runUpdate('507f1f77bcf86cd799439011', { applicationUrl: 'https://example.com/new' });
    assert.strictEqual(r.statusCode, 200, 'valid update');
    assert.strictEqual(r.body.data.applicationUrl, 'https://example.com/new', 'updated url');
    console.log('PASS update valid url');

    // update invalid
    r = await runUpdate('507f1f77bcf86cd799439011', { applicationUrl: 'javascript:alert(1)' });
    assert.strictEqual(r.statusCode, 400, 'invalid update');
    console.log('PASS update invalid url rejected');

    console.log('\nAll job security tests passed.');
    process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
