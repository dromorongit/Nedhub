/**
 * Brevo Email Service
 * Handles transactional email sending via Brevo API
 */

const axios = require('axios');

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Explicit timeout for all Brevo API requests (15 seconds)
const BREVO_TIMEOUT_MS = 15000;

// Sender configuration (should be configured in Brevo dashboard)
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'careers@nedhubgh.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Nedhub Careers';

/**
 * Validate Brevo API key is configured
 * @returns {boolean}
 */
function validateConfig() {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY environment variable is not configured');
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate professional HTML email template for job applications
 */
function generateApplicationEmailTemplate(applicationData) {
  const {
    fullName,
    email,
    phone,
    position,
    experience,
    linkedin,
    coverLetter,
    additionalInfo,
    cvUrl,
    coverUrl,
    submissionDate
  } = applicationData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0b132b, #1a2342); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
        New Job Application Received
      </h1>
      <p style="margin: 10px 0 0; color: #f77f00; font-size: 14px;">
        Nedhub Careers Portal
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Applicant Information Section -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td style="padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
            <h2 style="margin: 0 0 15px; color: #0b132b; font-size: 18px; font-weight: 600;">
              Applicant Information
            </h2>
            <table width="100%" cellpadding="8" cellspacing="0">
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Full Name:</td>
                <td style="color: #333333;">${sanitizeInput(fullName)}</td>
              </tr>
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Email Address:</td>
                <td style="color: #333333;">
                  <a href="mailto:${sanitizeInput(email)}" style="color: #f77f00; text-decoration: none;">
                    ${sanitizeInput(email)}
                  </a>
                </td>
              </tr>
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Phone Number:</td>
                <td style="color: #333333;">${sanitizeInput(phone) || 'Not provided'}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Position Information Section -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td style="padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
            <h2 style="margin: 0 0 15px; color: #0b132b; font-size: 18px; font-weight: 600;">
              Position Details
            </h2>
            <table width="100%" cellpadding="8" cellspacing="0">
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Position Applied For:</td>
                <td style="color: #333333;">${sanitizeInput(position)}</td>
              </tr>
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Experience Level:</td>
                <td style="color: #333333;">${sanitizeInput(experience)}</td>
              </tr>
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">LinkedIn Profile:</td>
                <td style="color: #333333;">
                  ${linkedin && isValidUrl(linkedin) 
                    ? `<a href="${sanitizeInput(linkedin)}" target="_blank" style="color: #f77f00; text-decoration: none;">${sanitizeInput(linkedin)}</a>` 
                    : 'Not provided'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Cover Letter Section -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td style="padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
            <h2 style="margin: 0 0 15px; color: #0b132b; font-size: 18px; font-weight: 600;">
              Cover Letter
            </h2>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #f77f00;">
              <p style="margin: 0; color: #555555; line-height: 1.6; white-space: pre-wrap;">
                ${sanitizeInput(coverLetter) || 'Not provided'}
              </p>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Additional Information Section -->
      ${additionalInfo 
        ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td style="padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
            <h2 style="margin: 0 0 15px; color: #0b132b; font-size: 18px; font-weight: 600;">
              Additional Information
            </h2>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <p style="margin: 0; color: #555555; line-height: 1.6; white-space: pre-wrap;">
                ${sanitizeInput(additionalInfo)}
              </p>
            </div>
          </td>
        </tr>
      </table>
        ` 
        : ''}
      
      <!-- Documents Section -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
        <tr>
          <td>
            <h2 style="margin: 0 0 15px; color: #0b132b; font-size: 18px; font-weight: 600;">
              Documents
            </h2>
            <table width="100%" cellpadding="8" cellspacing="0">
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">CV/Resume:</td>
                <td style="color: #333333;">
                  ${cvUrl && isValidUrl(cvUrl)
                    ? `<a href="${sanitizeInput(cvUrl)}" target="_blank" style="display: inline-block; background-color: #f77f00; color: #ffffff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 600;">
                        <i style="margin-right: 5px;">📎</i> Download CV
                      </a>`
                    : 'Not provided'}
                </td>
              </tr>
              ${coverUrl 
                ? `
              <tr>
                <td width="40%" style="color: #666666; font-weight: 600;">Cover Letter File:</td>
                <td style="color: #333333;">
                  ${isValidUrl(coverUrl)
                    ? `<a href="${sanitizeInput(coverUrl)}" target="_blank" style="display: inline-block; background-color: #0b132b; color: #ffffff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 600;">
                        <i style="margin-right: 5px;">📎</i> Download Cover Letter
                      </a>`
                    : 'Not provided'}
                </td>
              </tr>
                ` 
                : ''}
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Submission Info -->
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 6px; text-align: center;">
        <p style="margin: 0; color: #666666; font-size: 13px;">
          <strong>Submitted:</strong> ${submissionDate}
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #0b132b; padding: 20px; text-align: center;">
      <p style="margin: 0; color: #ffffff; font-size: 12px;">
        This application was submitted via the Nedhub Careers portal
      </p>
    </div>
    
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send job application email via Brevo
 * @param {Object} applicationData - The application form data
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendJobApplicationEmail(applicationData) {
  validateConfig();

  const {
    fullName,
    email,
    phone,
    position,
    experience,
    linkedin,
    coverLetter,
    additionalInfo,
    cvUrl,
    coverUrl
  } = applicationData;

  // Validate required fields
  if (!fullName || !email || !position || !experience || !cvUrl) {
    return {
      success: false,
      error: 'Missing required application fields'
    };
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email address format'
    };
  }

  // Validate URLs
  if (!isValidUrl(cvUrl)) {
    return {
      success: false,
      error: 'Invalid CV URL'
    };
  }
  if (coverUrl && !isValidUrl(coverUrl)) {
    return {
      success: false,
      error: 'Invalid cover letter URL'
    };
  }

  const emailSubject = `[Job Application] ${fullName} - ${position}`;
  const emailHtml = generateApplicationEmailTemplate({
    ...applicationData,
    submissionDate: new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Accra',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  const emailPayload = {
    sender: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [
      {
        email: 'careers@nedhubgh.com',
        name: 'Nedhub Recruitment Team'
      }
    ],
    replyTo: {
      email: email,
      name: fullName
    },
    subject: emailSubject,
    htmlContent: emailHtml,
    tags: ['career-application', 'job-application']
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);

  try {
    const response = await axios.post(BREVO_API_URL, emailPayload, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      signal: controller.signal,
      timeout: BREVO_TIMEOUT_MS
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      messageId: response.data.messageId,
      data: response.data
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const { isTimeout, safeMessage } = sanitizeBrevoError(error);

    if (isTimeout) {
      console.warn('[Brevo] Email delivery timed out after %dms', BREVO_TIMEOUT_MS);
    } else {
      console.error('[Brevo] Email sending failed:', safeMessage);
    }

    return {
      success: false,
      error: safeMessage
    };
  }
}

/**
 * Send confirmation email to applicant
 * @param {Object} applicationData - The application form data
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendApplicationConfirmation(applicationData) {
  validateConfig();

  const {
    fullName,
    email,
    position
  } = applicationData;

  if (!email) {
    return {
      success: false,
      error: 'Applicant email is required for confirmation'
    };
  }

  const confirmationHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0b132b, #1a2342); padding: 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Application Received</h1>
      </div>
      <div style="padding: 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6;">
          Dear ${sanitizeInput(fullName)},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6;">
          Thank you for your application for the <strong>${sanitizeInput(position)}</strong> position at Nedhub.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6;">
          We have received your application and will review your credentials. Our recruitment team will contact shortlisted candidates within 5-7 business days.
        </p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #666666; font-size: 14px;">
            <strong>Application Details:</strong><br>
            Position: ${sanitizeInput(position)}<br>
            Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Accra' })}
          </p>
        </div>
      </div>
      <div style="background-color: #0b132b; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-size: 12px;">
          Nedhub Ghana - careers@nedhubgh.com
        </p>
      </div>
    </div>
  </body>
  </html>
  `.trim();

  const emailPayload = {
    sender: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [
      {
        email: email,
        name: fullName
      }
    ],
    subject: 'Your Job Application Has Been Received - Nedhub',
    htmlContent: confirmationHtml,
    tags: ['application-confirmation', 'career-application']
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);

  try {
    const response = await axios.post(BREVO_API_URL, emailPayload, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      signal: controller.signal,
      timeout: BREVO_TIMEOUT_MS
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const { isTimeout, safeMessage } = sanitizeBrevoError(error);

    if (isTimeout) {
      console.warn('[Brevo] Confirmation email timed out after %dms', BREVO_TIMEOUT_MS);
    } else {
      console.warn('[Brevo] Confirmation email failed:', safeMessage);
    }

    return {
      success: false,
      error: safeMessage
    };
  }
}

/**
 * Sanitize a Brevo/axios error into a safe diagnostic message.
 * Never exposes API keys, stack traces, or raw response bodies that
 * might contain sensitive headers.
 *
 * @param {Error} error
 * @returns {{ isTimeout: boolean, safeMessage: string }}
 */
function sanitizeBrevoError(error) {
  const isTimeout =
    error.code === 'ECONNABORTED' ||
    error.code === 'ABORT_ERR' ||
    error.name === 'AbortError' ||
    error.name === 'TimeoutError';

  if (isTimeout) {
    return {
      isTimeout: true,
      safeMessage: `Email delivery timed out after ${BREVO_TIMEOUT_MS}ms`
    };
  }

  // Extract a safe message from Brevo's response, but strip anything
  // that looks like it could be a key or header value.
  let msg = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Failed to send email notification';

  // Remove any substring that looks like an API key or secret value
  msg = String(msg).replace(/[A-Za-z0-9_-]{32,}/g, '[REDACTED]');

  return {
    isTimeout: false,
    safeMessage: msg
  };
}

module.exports = {
  sendJobApplicationEmail,
  sendApplicationConfirmation,
  isValidUrl,
  sanitizeInput,
  sanitizeBrevoError,
  BREVO_TIMEOUT_MS
};