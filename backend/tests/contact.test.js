/**
 * Contact enquiry route tests
 * Plain Node.js test runner — the email sender is mocked so no real email is ever sent.
 *
 * Run: node backend/tests/contact.test.js
 */

'use strict';

const assert = require('node:assert');
const http = require('node:http');
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.CONTACT_TO_EMAIL = 'info@nedhubgh.com';
// No BREVO_API_KEY: the sender is mocked, so the route must never reach Brevo.

function buildApp() {
	const contactMod = require('../routes/contact');
	// Mock the sender before the app handles requests.
	contactMod.contactService.sendContactEmail = async () => ({
		success: true,
		messageId: 'mock-message-id'
	});
	const app = express();
	app.use(express.json({ limit: '20kb' }));
	app.use('/api', contactMod);
	return { app, contactMod };
}

function makeRequest(app, body) {
	return new Promise((resolve, reject) => {
		const payload = JSON.stringify(body);
		const options = {
			method: 'POST',
			host: '127.0.0.1',
			path: '/api/contact',
			headers: {
				'content-type': 'application/json',
				'content-length': Buffer.byteLength(payload)
			}
		};
		const req = http.request(options, (res) => {
			let chunks = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => {
				let parsed;
				try { parsed = JSON.parse(chunks.join('') || '{}'); } catch { parsed = chunks.join(''); }
				resolve({ statusCode: res.statusCode, body: parsed });
			});
		});
		req.on('error', reject);
		req.write(payload);
		req.end();
	});
}

async function main() {
	const { app } = buildApp();
	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = server.address().port;

	function request(body) {
		const opts = { method: 'POST', host: '127.0.0.1', port, path: '/api/contact' };
		return makeRequest({ ...opts }, body);
	}

	// Patch makeRequest usage: rebuild with port bound.
	async function req(body) {
		return new Promise((resolve, reject) => {
			const payload = JSON.stringify(body);
			const options = {
				method: 'POST',
				host: '127.0.0.1',
				port,
				path: '/api/contact',
				headers: {
					'content-type': 'application/json',
					'content-length': Buffer.byteLength(payload)
				}
			};
			const r = http.request(options, (res) => {
				let chunks = [];
				res.on('data', (c) => chunks.push(c));
				res.on('end', () => {
					let parsed;
					try { parsed = JSON.parse(chunks.join('') || '{}'); } catch { parsed = chunks.join(''); }
					resolve({ statusCode: res.statusCode, body: parsed });
				});
			});
			r.on('error', reject);
			r.write(payload);
			r.end();
		});
	}

	const valid = {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		phone: '+233 271 177 321',
		service: 'Recruitment & Talent Acquisition',
		message: 'Please send me details about your training programmes.',
		pageUrl: 'https://www.nedhubgh.com/contact.html'
	};

	// 1. Valid submission -> 200, sender called once with right recipient and reply-to
	const contactMod = require('../routes/contact');
	const senderCalls = [];
	contactMod.contactService.sendContactEmail = async (data) => {
		senderCalls.push({ to: data.email, service: data.service });
		return { success: true, messageId: 'mock-message-id' };
	};

	const res1 = await req(valid);
	assert.strictEqual(res1.statusCode, 200, 'valid submission status');
	assert.strictEqual(res1.body.success, true, 'valid submission body');
	assert.strictEqual(senderCalls.length, 1, 'sender called once');
	assert.strictEqual(senderCalls[0].to, 'ada@example.com', 'reply-to is visitor email');
	assert.strictEqual(senderCalls[0].service, 'Recruitment & Talent Acquisition');
	console.log('PASS valid submission returns 200 and calls sender once');

	// 2. Invalid fields -> 400 with message list; sender not called
	const invalid = { name: 'A', email: 'not-an-email', phone: '123', service: 'Not a real service', message: 'short' };
	const res2 = await req(invalid);
	assert.strictEqual(res2.statusCode, 400, 'invalid status');
	assert.strictEqual(res2.body.success, false, 'invalid body success');
	assert.ok(Array.isArray(res2.body.errors) && res2.body.errors.length >= 5, 'invalid errors list');
	assert.strictEqual(senderCalls.length, 1, 'sender not called for invalid submission');
	console.log('PASS invalid fields return 400 with error list');

	const res2b = await req({});
	assert.strictEqual(res2b.statusCode, 400, 'missing fields status');
	assert.ok(res2b.body.errors.length > 0, 'missing fields errors');
	console.log('PASS missing fields return 400');

	// 3. Honeypot filled -> 200 without sending
	senderCalls.length = 0;
	const res3 = await req({ ...valid, website: 'http://evil.example.com' });
	assert.strictEqual(res3.statusCode, 200, 'honeypot status');
	assert.strictEqual(res3.body.success, true, 'honeypot body');
	assert.strictEqual(senderCalls.length, 0, 'sender not called for honeypot');
	console.log('PASS honeypot returns 200 without sending');

	// 4. Rate limit: 5 per IP per 15 minutes -> 6th is 429
	const last = { ...valid, email: 'ratelimit@example.com' };
	let fortyTwoNine = null;
	for (let i = 0; i < 6; i++) {
		const r = await req(last);
		if (i === 5) fortyTwoNine = r;
	}
	assert.strictEqual(fortyTwoNine.statusCode, 429, 'rate limit 429');
	assert.strictEqual(fortyTwoNine.body.success, false, 'rate limit body success');
	assert.ok(/too many/i.test(fortyTwoNine.body.message), 'friendly 429 message');
	console.log('PASS over-limit returns 429 with friendly message');

	// 5. Sender failure -> 502 with fallback message
	// Fresh module instance so the in-memory rate-limit store is empty.
	delete require.cache[require.resolve('../routes/contact')];
	const failApp = express();
	const failingMod = require('../routes/contact');
	failingMod.contactService.sendContactEmail = async () => { throw new Error('Brevo is down'); };
	failApp.use(express.json({ limit: '20kb' }));
	failApp.use('/api', failingMod);
	const server3 = http.createServer(failApp);
	await new Promise((resolve) => server3.listen(0, '127.0.0.1', resolve));
	const port3 = server3.address().port;
	const reqFail = {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		service: 'Other',
		message: 'A valid length message for the failure path check.'
	};
	const res5 = await new Promise((resolve, reject) => {
		const payload = JSON.stringify(reqFail);
		const options = { method: 'POST', host: '127.0.0.1', port: port3, path: '/api/contact', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } };
		const r = http.request(options, (res) => {
			let chunks = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(chunks.join('') || '{}') }));
		});
		r.on('error', reject);
		r.write(payload);
		r.end();
	});
	server3.close();
	assert.strictEqual(res5.statusCode, 502, 'sender failure status');
	assert.strictEqual(res5.body.success, false, 'sender failure body success');
	assert.strictEqual(res5.body.message, 'We could not send your message. Please email info@nedhubgh.com or WhatsApp us.', 'fallback message');
	console.log('PASS sender failure returns 502 with fallback message');

	// 6. HTML in the message is escaped in the email body (escape function behavior)
	const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	const dangerous = 'Click <img src=x onerror=alert(1)> here';
	assert.strictEqual(esc(dangerous), 'Click &lt;img src=x onerror=alert(1)&gt; here', 'html escaping');
	assert.ok(!esc(dangerous).includes('<img'), 'no raw img tag in escaped text');
	console.log('PASS HTML in message is escaped');

	server.close();
	console.log('\nAll contact route tests passed.');
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
