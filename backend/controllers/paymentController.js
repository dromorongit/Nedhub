const hubtelService = require('../services/hubtelService');
const Order = require('../models/Order');
const mongoose = require('mongoose');

/**
 * Payment Controller for handling payment-related requests
 */
class PaymentController {
  /**
   * Initiate a new payment
   * POST /api/pay or POST /api/payments/hubtel/initiate
   */
  async initiatePayment(req, res) {
    try {
      console.log(`[PaymentController] Raw request body:`, JSON.stringify(req.body));

      // Support both 'amount' and 'totalAmount' from frontend
      let { amount, totalAmount, description, customerName, customerEmail, customerPhone, productId } = req.body;

      console.log(`[PaymentController] Raw amount:`, amount, `totalAmount:`, totalAmount);

      // Use amount if provided, fallback to totalAmount
      const paymentAmount = amount !== undefined ? amount : totalAmount;

      console.log(`[PaymentController] Using paymentAmount:`, paymentAmount);

      // Validate required fields
      if (paymentAmount === undefined || paymentAmount === null || paymentAmount === '') {
        return res.status(400).json({
          success: false,
          error: 'Amount is required.'
        });
      }

      // Parse and validate amount as a raw value first
      const parsedAmount = Number(paymentAmount);
      console.log(`[PaymentController] Parsed amount:`, parsedAmount, `isNaN:`, isNaN(parsedAmount));

      if (isNaN(parsedAmount)) {
        return res.status(400).json({
          success: false,
          error: `Invalid amount: ${paymentAmount}. Amount must be a valid number.`
        });
      }

      if (parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than zero.'
        });
      }

      if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Description is required.'
        });
      }

      // Create order data
      const orderData = {
        amount: parsedAmount,
        description: description.trim(),
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null
      };

      console.log(`[PaymentController] Initiating payment for amount: ${parsedAmount}`);

      // Initiate payment with Hubtel
      const hubtelResponse = await hubtelService.initiatePayment(orderData);

      console.log(`[PaymentController] Payment initiated. ClientReference:`, hubtelResponse.clientReference);

      // Try to save order to database (if MongoDB is available)
      try {
        orderData.clientReference = hubtelResponse.clientReference;
        await Order.createOrUpdateOrder(orderData);
        console.log(`[PaymentController] Order saved to database`);
      } catch (dbError) {
        // Log but don't fail - payment can still proceed
        console.warn(`[PaymentController] Could not save order to database:`, dbError.message);
      }

      // Return success with checkout URL
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

      // Try to update order in database
      try {
        const order = await Order.markAsPaid(clientReference, {
          transactionId,
          paymentMethod,
          checkoutId,
          hubtelResponse: callbackData
        });

        if (order) {
          console.log(`[PaymentController] Order ${clientReference} marked as paid. Transaction: ${transactionId}`);
        } else {
          console.warn(`[PaymentController] Order not found for clientReference: ${clientReference}`);
        }
      } catch (dbError) {
        console.warn(`[PaymentController] Could not update order in database:`, dbError.message);
      }

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

      // Try to find order in database first
      let order = null;
      try {
        order = await Order.findOne({ clientReference });
      } catch (dbError) {
        console.warn(`[PaymentController] Database not available:`, dbError.message);
      }

      if (order && order.status === 'Paid') {
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
        try {
          await Order.markAsPaid(clientReference, {
            transactionId: hubtelResponse.data.transactionId,
            paymentMethod: hubtelResponse.data.paymentMethod,
            checkoutId: hubtelResponse.data.checkoutId,
            hubtelResponse: hubtelResponse.data
          });
        } catch (dbError) {
          console.warn(`[PaymentController] Could not update order:`, dbError.message);
        }

        return res.status(200).json({
          success: true,
          data: {
            clientReference: clientReference,
            status: 'Paid',
            amount: order?.amount || 0,
            transactionId: hubtelResponse.data.transactionId
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          clientReference: clientReference,
          status: order?.status || 'Pending',
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

      let order = null;
      try {
        order = await Order.findOne({ clientReference });
      } catch (dbError) {
        console.warn(`[PaymentController] Database not available:`, dbError.message);
      }

      if (!order) {
        return res.status(200).json({
          success: false,
          error: 'Order not found (database not available)',
          data: {
            clientReference: clientReference,
            status: 'Unknown - database not connected'
          }
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
    // Check if MongoDB is connected
    let mongoStatus = 'disconnected';
    try {
      if (mongoose.connection.readyState === 1) {
        mongoStatus = 'connected';
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Backend is running',
      timestamp: new Date().toISOString(),
      database: mongoStatus
    });
  }
}

module.exports = new PaymentController();
