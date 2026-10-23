/**
 * Contact Enquiry Routes
 * Handles website contact form submissions with Brevo email integration
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { sanitizeInput, sanitizeBrevoError } = require('../services/brevoService');

const router = express.Router();

// Body limit for this route: 20 KB (global parser is 10 KB, so this route
// never accepts more than 20 KB of JSON).
router.use(express.json({ limit: '20kb' }));

// Rate limit: at most 5 requests per IP per 15 minutes on this route.
const contactLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	message: {
		success: false,
		message: 'Too many contact messages. Please try again later.'
	},
	standardHeaders: true,
	legacyHeaders: false
});
router.use(contactLimiter);

// Brevo configuration (same provider and verified sender as careers emails)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 15000;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'careers@nedhubgh.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Nedhub Careers';

// Destination inbox: env var CONTACT_TO_EMAIL, defaulting to info@nedhubgh.com
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@nedhubgh.com';

const ALLOWED_SERVICES = [
	'Recruitment & Talent Acquisition',
	'Staff Outsourcing',
	'Training & Capacity Building',
	'Career Coaching',
	'Data Analytics',
	'Digital Services (Bulk SMS & Payments)',
	'CV Templates',
	'Other'
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function trimValue(value) {
	return value == null ? '' : String(value).trim();
}

function validateContact(data) {
	const errors = [];
	const name = trimValue(data.name);
	const email = trimValue(data.email);
	const phone = trimValue(data.phone);
	const service = trimValue(data.service);
	const message = trimValue(data.message);

	if (name.length < 2 || name.length > 80) {
		errors.push('Name must be between 2 and 80 characters');
	}
	if (!EMAIL_REGEX.test(email)) {
		errors.push('Please enter a valid email address');
	}
	if (phone !== '' && !PHONE_REGEX.test(phone)) {
		errors.push('Phone must be 7-20 characters (digits, spaces, +, -, (, ))');
	}
	if (!ALLOWED_SERVICES.includes(service)) {
		errors.push('Please select a valid service');
	}
	if (message.length < 10 || message.length > 2000) {
		errors.push('Message must be between 10 and 2000 characters');
	}

	return errors;
}

function submissionTime() {
	return new Date().toLocaleString('en-US', {
		timeZone: 'Africa/Accra',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function escapeHtmlText(text) {
	return String(text == null ? '' : text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmailHtml(data) {
	const { name, email, phone, service, message, pageUrl } = data;
	const safePhone = phone || 'Not provided';
	const safePageUrl = pageUrl ? escapeHtmlText(pageUrl) : 'Not provided';
	return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Website Enquiry</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;color:#333333;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#0b132b,#1c2541);padding:30px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">New Website Enquiry</h1>
    <p style="margin:10px 0 0;color:#f77f00;font-size:14px;">Nedhub Ghana</p>
  </div>
  <div style="padding:30px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
      <tr>
        <td style="padding-bottom:15px;border-bottom:1px solid #eeeeee;">
          <h2 style="margin:0 0 15px;color:#0b132b;font-size:18px;font-weight:600;">Enquiry Details</h2>
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td width="40%" style="color:#666666;font-weight:600;">Service:</td>
              <td style="color:#333333;">${escapeHtmlText(service)}</td>
            </tr>
            <tr>
              <td width="40%" style="color:#666666;font-weight:600;">Name:</td>
              <td style="color:#333333;">${escapeHtmlText(name)}</td>
            </tr>
            <tr>
              <td width="40%" style="color:#666666;font-weight:600;">Email:</td>
              <td style="color:#333333;"><a href="mailto:${escapeHtmlText(email)}" style="color:#f77f00;text-decoration:none;">${escapeHtmlText(email)}</a></td>
            </tr>
            <tr>
              <td width="40%" style="color:#666666;font-weight:600;">Phone:</td>
              <td style="color:#333333;">${escapeHtmlText(safePhone)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
      <tr>
        <td style="padding-bottom:15px;border-bottom:1px solid #eeeeee;">
          <h2 style="margin:0 0 15px;color:#0b132b;font-size:18px;font-weight:600;">Message</h2>
          <div style="background-color:#f9f9f9;padding:15px;border-radius:6px;border-left:4px solid #f77f00;">
            <p style="margin:0;color:#555555;line-height:1.6;white-space:pre-wrap;">${escapeHtmlText(message).replace(/\n/g, '<br>')}</p>
          </div>
        </td>
      </tr>
    </table>
    <div style="background-color:#f0f0f0;padding:15px;border-radius:6px;text-align:center;">
      <p style="margin:0;color:#666666;font-size:13px;">
        <strong>Submitted:</strong> ${escapeHtmlText(submissionTime())}<br>
        <strong>Page URL:</strong> ${safePageUrl}
      </p>
    </div>
  </div>
  <div style="background-color:#0b132b;padding:20px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:12px;">This enquiry was submitted via the Nedhub Ghana website</p>
  </div>
</div>
</body>
</html>
`.trim();
}

function buildEmailText(data) {
	const { name, email, phone, service, message, pageUrl } = data;
	return [
		'New Website Enquiry - Nedhub Ghana',
		'',
		`Service: ${service}`,
		`Name: ${name}`,
		`Email: ${email}`,
		`Phone: ${phone || 'Not provided'}`,
		'',
		'Message:',
		message,
		'',
		`Submitted: ${submissionTime()}`,
		`Page URL: ${pageUrl || 'Not provided'}`
	].join('\n');
}

function validateConfig() {
	if (!BREVO_API_KEY) {
		throw new Error('BREVO_API_KEY environment variable is not configured');
	}
}

async function sendContactEmail(data) {
	validateConfig();

	const errors = validateContact(data);
	if (errors.length > 0) {
		return { success: false, error: `Validation failed: ${errors.join(', ')}` };
	}

	const emailSubject = `Website enquiry: ${data.service} - ${data.name}`;
	const emailHtml = buildEmailHtml(data);
	const emailText = buildEmailText(data);

	const emailPayload = {
		sender: { email: SENDER_EMAIL, name: SENDER_NAME },
		to: [{ email: CONTACT_TO_EMAIL, name: 'Nedhub Ghana' }],
		replyTo: { email: data.email, name: data.name },
		subject: emailSubject,
		htmlContent: emailHtml,
		textContent: emailText,
		tags: ['contact-form', 'website-enquiry']
	};

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);

	try {
		const response = await axios.post(BREVO_API_URL, emailPayload, {
			headers: {
				accept: 'application/json',
				'api-key': BREVO_API_KEY,
				'content-type': 'application/json'
			},
			signal: controller.signal,
			timeout: BREVO_TIMEOUT_MS
		});
		clearTimeout(timeoutId);

		return { success: true, messageId: response.data.messageId, data: response.data };
	} catch (error) {
		clearTimeout(timeoutId);
		const { isTimeout, safeMessage } = sanitizeBrevoError(error);

		if (isTimeout) {
			console.warn('[Brevo] Contact email delivery timed out after %dms', BREVO_TIMEOUT_MS);
		} else {
			console.error('[Brevo] Contact email sending failed:', safeMessage);
		}

		return { success: false, error: safeMessage };
	}
}

// Best-effort auto-reply to the visitor using the existing careers confirmation helper.
// One-line addition; failures do not block the contact response.
async function sendVisitorAutoReply(data) {
	const { sendApplicationConfirmation } = require('../services/brevoService');
	try {
		await sendApplicationConfirmation({
			fullName: data.name,
			email: data.email,
			position: data.service
		});
		console.log('[Contact] Auto-reply sent to visitor:', data.email);
	} catch (error) {
		const { safeMessage } = sanitizeBrevoError(error);
		console.warn('[Contact] Visitor auto-reply failed:', safeMessage);
	}
}

// Exposed so tests can swap the email sender without hitting the network.
const contactService = {
	sendContactEmail,
	sendVisitorAutoReply
};

router.post('/contact', async (req, res) => {
	// Honeypot: if filled, pretend success and send nothing.
	if (req.body.website != null && String(req.body.website).trim() !== '') {
		return res.status(200).json({ success: true });
	}

	const errors = validateContact(req.body);
	if (errors.length > 0) {
		return res.status(400).json({
			success: false,
			message: 'Validation failed',
			errors
		});
	}

	const data = {
		name: trimValue(req.body.name),
		email: trimValue(req.body.email),
		phone: trimValue(req.body.phone),
		service: trimValue(req.body.service),
		message: trimValue(req.body.message),
		pageUrl: trimValue(req.body.pageUrl)
	};

	try {
		const emailResult = await contactService.sendContactEmail(data);

		if (!emailResult.success) {
			throw new Error(emailResult.error || 'Email provider failed');
		}

		// Best-effort auto-reply; never blocks the enquiry response.
		await contactService.sendVisitorAutoReply(data);

		console.log('[Contact] Enquiry email accepted by provider for:', data.email.split('@')[1] || 'unknown');
		return res.status(200).json({ success: true });
	} catch (error) {
		// Log only safe diagnostics: no message body, no full email, no phone.
		console.error('[Contact] Failed to send enquiry email:', error.message);
		return res.status(502).json({
			success: false,
			message: 'We could not send your message. Please email info@nedhubgh.com or WhatsApp us.'
		});
	}
});

module.exports = router;
module.exports.contactService = contactService;
module.exports.validateContact = validateContact;
