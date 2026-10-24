'use strict';
require('dotenv').config({ path: './backend/.env' });
const dns = require('dns').promises;
const net = require('net');
const https = require('https');
const http = require('http');

const { connectDB, disconnectDB } = require('../backend/services/db');
const { CVTemplate } = require('../backend/models/CVTemplate');

function isPrivateIp(ip) {
    if (net.isIP(ip) === 4) {
        const p = ip.split('.').map(Number);
        if (p[0] === 10) return true;
        if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
        if (p[0] === 192 && p[1] === 168) return true;
        if (p[0] === 127) return true;
        if (p[0] === 169 && p[1] === 254) return true;
        if (p[0] === 0) return true;
        return false;
    }
    if (net.isIP(ip) === 6) {
        const l = ip.toLowerCase();
        if (l === '::1') return true;
        if (l.startsWith('fc') || l.startsWith('fd')) return true;
        if (l.startsWith('fe80')) return true;
        return false;
    }
    return true;
}

async function checkUrl(url) {
    let protocol = '';
    let host = '';
    let passes = false;
    let reason = '';
    try {
        const u = new URL(url);
        protocol = u.protocol.replace(':', '');
        host = u.hostname;
        if (u.protocol !== 'https:') { reason = 'not https'; }
        else {
            const addrs = await dns.lookup(host, { all: true });
            if (addrs.some(a => isPrivateIp(a.address))) reason = 'private address';
            else passes = true;
        }
    } catch (e) {
        reason = e.message;
    }
    return { protocol, host, passes, reason };
}

function headRequest(url) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => { if (!settled) { settled = true; resolve(result); } };
        let parsed;
        try { parsed = new URL(url); } catch (e) { finish({ status: 'invalid url', contentType: '-', size: '-' }); return; }
        const mod = parsed.protocol === 'https:' ? https : http;
        const req = mod.request(parsed, { method: 'HEAD', timeout: 10000 }, (res) => {
            finish({ status: res.statusCode, contentType: res.headers['content-type'] || '-', size: res.headers['content-length'] || '-' });
            res.resume();
        });
        req.on('error', (e) => finish({ status: 'error: ' + e.message, contentType: '-', size: '-' }));
        req.on('timeout', () => { req.destroy(); finish({ status: 'timeout', contentType: '-', size: '-' }); });
        req.end();
    });
}

async function main() {
    let conn;
    try {
        conn = await connectDB();
    } catch (e) {
        console.error('Could not connect to database:', e.message);
        console.error('Leave this script for the owner to run on Railway with MONGODB_URI set.');
        process.exit(1);
    }
    if (!conn) {
        console.error('No database connection (MONGODB_URI missing).');
        process.exit(1);
    }

    const templates = await CVTemplate.find().select('name status price templateFileUrl').lean();
    console.log('id | name | status | premium | protocol | host | passes rules | HEAD status | content-type | size');
    for (const t of templates) {
        const isPremium = (t.price || 0) > 0;
        const info = await checkUrl(t.templateFileUrl || '');
        const head = await headRequest(t.templateFileUrl || '');
        console.log([
            t._id,
            t.name,
            t.status,
            isPremium,
            info.protocol || '-',
            info.host || '-',
            info.passes ? 'yes' : 'no (' + info.reason + ')',
            head.status,
            head.contentType,
            head.size
        ].join(' | '));
    }
    await disconnectDB();
}

main().catch((e) => { console.error(e); process.exit(1); });
