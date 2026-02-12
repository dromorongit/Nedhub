const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validatePaymentRequest } = require('../middlewares/validation');

/**
 * Payment Routes
 */

// Health check endpoint
router.get('/health', paymentController.healthCheck);

// Initiate payment
router.post('/pay', validatePaymentRequest, paymentController.initiatePayment);

// Hubtel callback webhook
router.post('/hubtel-callback', paymentController.handleCallback);

// Check payment status
router.get('/check-status/:clientReference', paymentController.checkStatus);

// Get order details
router.get('/order/:clientReference', paymentController.getOrder);

module.exports = router;
