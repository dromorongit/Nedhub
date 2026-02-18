const axios = require('axios');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

/**
 * Hubtel Service for handling payment operations
 */
class HubtelService {
  constructor() {
    this.clientId = config.hubtel.clientId;
    this.clientSecret = config.hubtel.clientSecret;
    this.posId = config.hubtel.posId;
    this.baseUrl = config.hubtel.baseUrl;
    this.txnStatusUrl = config.hubtel.txnStatusUrl;
    this.baseUrlValue = config.baseUrl;
    this.frontendUrl = config.frontendUrl;

    // Validate required configuration
    if (!this.clientId || !this.clientSecret || !this.posId) {
      console.warn('[HubtelService] WARNING: Hubtel credentials not fully configured!');
      console.warn('[HubtelService] HUBTEL_CLIENT_ID:', this.clientId ? '***set***' : 'MISSING');
      console.warn('[HubtelService] HUBTEL_CLIENT_SECRET:', this.clientSecret ? '***set***' : 'MISSING');
      console.warn('[HubtelService] HUBTEL_POS_ID:', this.posId || 'MISSING');
    }
  }

  /**
   * Generate Basic Auth header for Hubtel API
   */
  getAuthHeader() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.posId);
  }

  /**
   * Clean URL by removing double slashes (except in https://)
   */
  cleanUrl(url) {
    return url.replace(/([^:]\/)\/+/g, '$1');
  }

  /**
   * Initiate a payment request with Hubtel
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount to charge
   * @param {string} paymentData.description - Payment description
   * @param {string} paymentData.customerName - Customer name
   * @param {string} paymentData.customerEmail - Customer email
   * @param {string} paymentData.customerPhone - Customer phone
   * @returns {Promise<Object>} - Hubtel response with checkout URL
   */
  async initiatePayment(paymentData) {
    // Check configuration first
    if (!this.isConfigured()) {
      throw new Error('Hubtel service is not configured. Please set HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, and HUBTEL_POS_ID environment variables.');
    }

    // Support both 'amount' and 'totalAmount' for flexibility
    const amount = paymentData.amount !== undefined ? paymentData.amount : paymentData.totalAmount;

    console.log(`[HubtelService] initiatePayment received amount:`, amount, `type:`, typeof amount);

    if (amount === undefined || amount === null || isNaN(amount)) {
      throw new Error(`Invalid amount received: ${amount}`);
    }

    // Generate unique client reference
    const clientReference = `NH-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    // Build callback URLs (cleaned to avoid double slashes)
    // Callback URL goes to backend API
    const callbackUrl = this.cleanUrl(`${this.baseUrlValue}/api/hubtel-callback`);
    // Return URLs go to frontend pages
    const returnUrl = this.cleanUrl(`${this.frontendUrl}/payment-success.html`);
    const cancellationUrl = this.cleanUrl(`${this.frontendUrl}/payment-cancelled.html`);

    // Ensure amount is a valid number
    const numericAmount = parseFloat(amount);
    
    const payload = {
      totalAmount: numericAmount.toFixed(2),
      description: paymentData.description,
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      cancellationUrl: cancellationUrl,
      merchantAccountNumber: this.posId,
      clientReference: clientReference,
      paymentMethod: 'both', // Accept both mobile money and card
      customer: {
        name: paymentData.customerName || 'Customer',
        email: paymentData.customerEmail || '',
        phone: paymentData.customerPhone || ''
      }
    };

    try {
      console.log(`[HubtelService] Initiating payment for clientReference: ${clientReference}`);
      console.log(`[HubtelService] Final payload amount:`, payload.totalAmount);

      const response = await axios.post(
        `${this.baseUrl}/items/initiate`,
        payload,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`[HubtelService] Full Hubtel response:`, JSON.stringify(response.data, null, 2));

      // Extract checkout URL from the nested response
      const hubtelResponse = response.data;
      const checkoutId = hubtelResponse.data?.checkoutId || hubtelResponse.checkoutId;
      const checkoutUrl = hubtelResponse.data?.checkoutUrl || hubtelResponse.checkoutUrl || hubtelResponse.data?.checkoutDirectUrl;
      const responseCode = hubtelResponse.responseCode;
      const status = hubtelResponse.status || hubtelResponse.data?.status;

      // Structured logging for HUBTEL_INITIATE_RESPONSE
      console.log(JSON.stringify({
        logLabel: 'HUBTEL_INITIATE_RESPONSE',
        timestamp: new Date().toISOString(),
        clientReference: clientReference,
        responseCode: responseCode,
        status: status,
        checkoutId: checkoutId,
        checkoutUrl: checkoutUrl,
        fullResponseBody: hubtelResponse
      }, null, 2));

      console.log(`[HubtelService] Extracted checkoutUrl:`, checkoutUrl);

      if (!checkoutUrl) {
        throw new Error('No checkout URL in Hubtel response');
      }

      return {
        success: true,
        checkoutUrl: checkoutUrl,
        clientReference: clientReference,
        data: hubtelResponse
      };
    } catch (error) {
      console.error(`[HubtelService] Payment initiation failed:`, error.response?.data || error.message);
      
      const errorResponse = error.response?.data;
      
      if (errorResponse) {
        // Handle specific Hubtel error codes
        if (errorResponse.responseCode === '4000') {
          throw new Error('VALIDATION_ERROR: Invalid payment parameters');
        } else if (errorResponse.responseCode === '2001') {
          throw new Error('TRANSACTION_FAILED: Payment transaction failed');
        } else {
          throw new Error(`HUBTEL_ERROR: ${errorResponse.message || 'Unknown error'}`);
        }
      }
      
      throw new Error(`PAYMENT_INITIATION_FAILED: ${error.message}`);
    }
  }

  /**
   * Check transaction status with Hubtel
   * @param {string} clientReference - The client reference to check
   * @returns {Promise<Object>} - Transaction status
   */
  async checkTransactionStatus(clientReference) {
    // Log when status check is initiated
    console.log(JSON.stringify({
      logLabel: 'HUBTEL_STATUS_CHECK_REQUEST',
      timestamp: new Date().toISOString(),
      clientReference: clientReference,
      message: 'Initiating status check with Hubtel'
    }, null, 2));

    if (!this.isConfigured()) {
      throw new Error('Hubtel service is not configured.');
    }

    try {
      console.log(`[HubtelService] Checking status for clientReference: ${clientReference}`);

      // Use the correct Hubtel transaction status endpoint
      // The format should be: /items/verify/{clientReference}
      const response = await axios.get(
        `${this.baseUrl}/items/verify/${clientReference}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log(`[HubtelService] Status check response:`, response.data);

      // Structured logging for HUBTEL_STATUS_CHECK_RESPONSE
      const statusResponse = response.data;
      console.log(JSON.stringify({
        logLabel: 'HUBTEL_STATUS_CHECK_RESPONSE',
        timestamp: new Date().toISOString(),
        clientReference: clientReference,
        responseCode: statusResponse.responseCode,
        status: statusResponse.status,
        transactionId: statusResponse.transactionId,
        amount: statusResponse.amount,
        fullResponseBody: statusResponse
      }, null, 2));

      return {
        success: true,
        status: response.data.status,
        responseCode: response.data.responseCode,
        data: response.data
      };
    } catch (error) {
      // Structured logging for status check error
      console.log(JSON.stringify({
        logLabel: 'HUBTEL_STATUS_CHECK_ERROR',
        timestamp: new Date().toISOString(),
        clientReference: clientReference,
        error: error.message,
        errorDetails: error.response?.data || null
      }, null, 2));

      console.error(`[HubtelService] Status check failed:`, error.response?.data || error.message);
      throw new Error(`STATUS_CHECK_FAILED: ${error.message}`);
    }
  }

  /**
   * Verify Hubtel callback signature
   * @param {Object} callbackData - Callback data from Hubtel
   * @returns {boolean} - Whether the callback is valid
   */
  verifyCallback(callbackData) {
    // Hubtel doesn't use signatures for callbacks in redirect checkout
    // We verify by checking the responseCode and status
    if (!callbackData) {
      return false;
    }

    const { responseCode, status } = callbackData;
    
    return responseCode === '0000' && status === 'Success';
  }

  /**
   * Process callback data from Hubtel
   * @param {Object} callbackData - Callback data from Hubtel
   * @returns {Object} - Processed callback information
   */
  processCallback(callbackData) {
    return {
      clientReference: callbackData.clientReference,
      transactionId: callbackData.transactionId,
      status: callbackData.status,
      responseCode: callbackData.responseCode,
      amount: callbackData.amount,
      paymentMethod: callbackData.paymentMethod,
      merchantAccountNumber: callbackData.merchantAccountNumber,
      checkoutId: callbackData.checkoutId
    };
  }
}

module.exports = new HubtelService();
