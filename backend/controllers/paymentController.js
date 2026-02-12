const hubtelService = require('../services/hubtelService');
const Order = require('../models/Order');

/**
 * Payment Controller for handling payment-related requests
 */
class PaymentController {
  /**
   * Initiate a new payment
   * POST /api/pay
   */
  async initiatePayment(req, res) {
    try {
      const { amount, description, customerName, customerEmail, customerPhone } = req.body;

      // Validate required fields
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount. Amount must be a positive number.'
        });
      }

      if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Description is required.'
        });
      }

      // Create order in database
      const orderData = {
        amount: parseFloat(amount),
        description: description.trim(),
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null
      };

      // Initiate payment with Hubtel
      const hubtelResponse = await hubtelService.initiatePayment(orderData);

      // Store order with client reference
      orderData.clientReference = hubtelResponse.clientReference;
      await Order.createOrUpdateOrder(orderData);

      console.log(`[PaymentController] Payment initiated. Order: ${hubtelResponse.clientReference}`);

      return res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          clientReference: hubtelResponse.clientReference,
          checkoutUrl: hubtelResponse.checkoutUrl
        }
      });
    } catch (error) {
      console.error(`[PaymentController] Initiate payment error:`, error);

      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to initiate payment'
      });
    }
  }

  /**
   * Handle Hubtel payment callback
   * POST /api/hubtel-callback
   */
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;

      console.log(`[PaymentController] Received Hubtel callback:`, JSON.stringify(callbackData, null, 2));

      // Verify callback
      if (!hubtelService.verifyCallback(callbackData)) {
        console.warn(`[PaymentController] Invalid callback received`);
        return res.status(400).json({
          success: false,
          error: 'Invalid callback'
        });
      }

      const { clientReference, transactionId, paymentMethod, checkoutId } = hubtelService.processCallback(callbackData);

      // Update order in database
      const order = await Order.markAsPaid(clientReference, {
        transactionId,
        paymentMethod,
        checkoutId,
        hubtelResponse: callbackData
      });

      if (!order) {
        console.warn(`[PaymentController] Order not found for clientReference: ${clientReference}`);
        // Still return 200 to Hubtel to prevent retries
        return res.status(200).json({
          success: true,
          message: 'Callback received but order not found'
        });
      }

      console.log(`[PaymentController] Order ${clientReference} marked as paid. Transaction: ${transactionId}`);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed'
      });
    } catch (error) {
      console.error(`[PaymentController] Callback error:`, error);

      // Return 200 to prevent Hubtel from retrying
      return res.status(200).json({
        success: false,
        error: 'Callback processing failed'
      });
    }
  }

  /**
   * Check payment status
   * GET /api/check-status/:clientReference
   */
  async checkStatus(req, res) {
    try {
      const { clientReference } = req.params;

      if (!clientReference) {
        return res.status(400).json({
          success: false,
          error: 'Client reference is required'
        });
      }

      // Find order in database first
      const order = await Order.findOne({ clientReference });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // If order is already marked as paid, return immediately
      if (order.status === 'Paid') {
        return res.status(200).json({
          success: true,
          data: {
            clientReference: order.clientReference,
            status: order.status,
            amount: order.amount,
            transactionId: order.transactionId,
            paidAt: order.paidAt
          }
        });
      }

      // Check with Hubtel
      const hubtelResponse = await hubtelService.checkTransactionStatus(clientReference);

      // Update order if Hubtel confirms payment
      if (hubtelResponse.status === 'Success' && hubtelResponse.responseCode === '0000') {
        await Order.markAsPaid(clientReference, {
          transactionId: hubtelResponse.data.transactionId,
          paymentMethod: hubtelResponse.data.paymentMethod,
          checkoutId: hubtelResponse.data.checkoutId,
          hubtelResponse: hubtelResponse.data
        });

        return res.status(200).json({
          success: true,
          data: {
            clientReference: order.clientReference,
            status: 'Paid',
            amount: order.amount,
            transactionId: hubtelResponse.data.transactionId
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          clientReference: order.clientReference,
          status: order.status,
          hubtelStatus: hubtelResponse.status,
          hubtelResponseCode: hubtelResponse.responseCode
        }
      });
    } catch (error) {
      console.error(`[PaymentController] Check status error:`, error);

      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to check payment status'
      });
    }
  }

  /**
   * Get order details
   * GET /api/order/:clientReference
   */
  async getOrder(req, res) {
    try {
      const { clientReference } = req.params;

      const order = await Order.findOne({ clientReference });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          clientReference: order.clientReference,
          amount: order.amount,
          description: order.description,
          status: order.status,
          transactionId: order.transactionId,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          paidAt: order.paidAt
        }
      });
    } catch (error) {
      console.error(`[PaymentController] Get order error:`, error);

      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve order'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   */
  async healthCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Backend is running',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new PaymentController();
