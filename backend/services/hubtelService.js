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
  }

  /**
   * Generate Basic Auth header for Hubtel API
   */
  getAuthHeader() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Initiate a payment request with Hubtel
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.totalAmount - Amount to charge
   * @param {string} paymentData.description - Payment description
   * @param {string} paymentData.customerName - Customer name
   * @param {string} paymentData.customerEmail - Customer email
   * @param {string} paymentData.customerPhone - Customer phone
   * @returns {Promise<Object>} - Hubtel response with checkout URL
   */
  async initiatePayment(paymentData) {
    const { totalAmount, description, customerName, customerEmail, customerPhone } = paymentData;
    
    // Generate unique client reference
    const clientReference = `NH-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    // Build callback URLs
    const callbackUrl = `${this.baseUrlValue}/api/hubtel-callback`;
    const returnUrl = `${this.baseUrlValue}/payment-success.html`;
    const cancellationUrl = `${this.baseUrlValue}/payment-cancelled.html`;

    const payload = {
      totalAmount: parseFloat(totalAmount).toFixed(2),
      description: description,
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      cancellationUrl: cancellationUrl,
      merchantAccountNumber: this.posId,
      clientReference: clientReference,
      paymentMethod: 'both', // Accept both mobile money and card
      customer: {
        name: customerName || 'Customer',
        email: customerEmail || '',
        phone: customerPhone || ''
      }
    };

    try {
      console.log(`[HubtelService] Initiating payment for clientReference: ${clientReference}`);
      console.log(`[HubtelService] Payload:`, JSON.stringify(payload, null, 2));

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

      console.log(`[HubtelService] Payment initiated successfully. Response:`, response.data);

      return {
        success: true,
        checkoutUrl: response.data.checkoutUrl,
        clientReference: clientReference,
        data: response.data
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
    try {
      console.log(`[HubtelService] Checking status for clientReference: ${clientReference}`);

      const response = await axios.get(
        `${this.txnStatusUrl}/transactions/${this.posId}/status`,
        {
          params: {
            clientReference: clientReference
          },
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log(`[HubtelService] Status check response:`, response.data);

      return {
        success: true,
        status: response.data.status,
        responseCode: response.data.responseCode,
        data: response.data
      };
    } catch (error) {
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
