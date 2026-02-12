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
  
  baseUrl: process.env.BASE_URL || 'https://nedhub-production.up.railway.app',
  
  // Allow multiple origins including your frontend domains
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'https://www.nedhubgh.com',
    'https://nedhubgh.com',
    'https://nedhub-production.up.railway.app'
  ]
};
