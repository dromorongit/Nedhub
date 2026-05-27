require('dotenv').config({ path: './.env' });

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  hubtel: {
    clientId: process.env.HUBTEL_CLIENT_ID || '',
    clientSecret: process.env.HUBTEL_CLIENT_SECRET || '',
    posId: process.env.HUBTEL_POS_ID || '',
    baseUrl: 'https://payproxyapi.hubtel.com',
    txnStatusUrl: 'https://api-txnstatus.hubtel.com',
    merchantAccountNumber: process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER || ''
  },
  
  // Brevo Email Configuration
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'careers@nedhubgh.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Nedhub Careers'
  },
  
  // Backend URL for API callbacks
  baseUrl: process.env.BASE_URL || 'https://nedhub-production.up.railway.app',
  
  // Frontend URL for payment redirects (payment-success, payment-cancelled, payment-error)
  frontendUrl: process.env.FRONTEND_URL || 'https://www.nedhubgh.com',
  
  // Allow multiple origins including your frontend domains
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'https://www.nedhubgh.com',
    'https://nedhubgh.com',
    'https://nedhub-production.up.railway.app'
  ]
};
