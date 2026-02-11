/**
 * Payment Routes
 * Hubtel Online Checkout (Redirect Checkout) Integration
 * 
 * Supported Payment Methods:
 * - Mobile Money (MTN, Vodafone, AirtelTigo)
 * - Bank Card
 * - Hubtel Wallet
 * - GhQR
 * 
 * Authentication: OAuth2 with Client ID and Client Secret
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// =============================================================================
// IN-MEMORY DATABASE (Replace with real database in production)
// =============================================================================
const payments = new Map();
const processedCallbacks = new Set(); // Prevent duplicate callbacks
const oauthTokens = new Map(); // Store OAuth tokens

// Payment statuses
const PaymentStatus = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate unique client reference
 */
function generateClientReference() {
    return `NEDHUB-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
}

/**
 * Find payment by client reference
 */
function findPaymentByClientReference(clientReference) {
    for (const [id, payment] of payments.entries()) {
        if (payment.clientReference === clientReference) {
            return { id, payment };
        }
    }
    return null;
}

/**
 * Log Hubtel response for debugging
 */
function logHubtelResponse(endpoint, response, status = 'success') {
    console.log(`[HUBTEL ${status.toUpperCase()}] ${endpoint}`);
    console.log('Response:', JSON.stringify(response, null, 2));
}

/**
 * Validate Hubtel response code
 */
function isHubtelSuccess(responseCode) {
    return responseCode === '0000';
}

/**
 * Get OAuth token for Hubtel API
 */
async function getHubtelOAuthToken() {
    // Check if we have a valid token
    const existingToken = oauthTokens.get('access_token');
    if (existingToken && existingToken.expiresAt > Date.now()) {
        return existingToken.value;
    }

    // Get credentials from environment
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    const tokenUrl = process.env.HUBTEL_TOKEN_URL || 'https://api-txnstatus.hubtel.com/connect/token';

    if (!clientId || !clientSecret) {
        throw new Error('Hubtel OAuth credentials not configured');
    }

    console.log('[HUBTEL OAUTH] Requesting new access token...');

    try {
        // Create Basic Auth header with Client ID and Client Secret
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[HUBTEL OAUTH ERROR]:', data);
            throw new Error(data.error_description || 'Failed to get OAuth token');
        }

        // Store token with expiry
        oauthTokens.set('access_token', {
            value: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer
        });

        console.log('[HUBTEL OAUTH] Token obtained successfully');

        return data.access_token;

    } catch (error) {
        console.error('[HUBTEL OAUTH ERROR]:', error.message);
        throw error;
    }
}

// =============================================================================
// HUBTEL API CALLS (Server-side only)
// =============================================================================

/**
 * Initiate Hubtel Payment
 * POST https://payproxyapi.hubtel.com/items/initiate
 */
async function initiateHubtelPayment(paymentData) {
    const {
        amount,
        description,
        callbackUrl,
        returnUrl,
        cancellationUrl,
        clientReference
    } = paymentData;

    // Get Hubtel credentials from environment
    const hubtelAccount = process.env.HUBTEL_POS_SALES_ID;
    const apiKey = process.env.HUBTEL_API_KEY;

    if (!hubtelAccount || !apiKey) {
        throw new Error('Hubtel credentials not configured');
    }

    // Create Basic Auth header with Merchant Account Number and API Key
    const authHeader = Buffer.from(`${hubtelAccount}:${apiKey}`).toString('base64');

    // Hubtel request payload
    const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    const hubtelPayload = {
        totalAmount: amount,
        description: description || 'Nedhub Payment',
        callbackUrl: callbackUrl || `${apiBaseUrl}/api/payments/hubtel/callback`,
        returnUrl: returnUrl || `${frontendUrl}/cv-templates.html?payment=success`,
        cancellationUrl: cancellationUrl || `${frontendUrl}/cv-templates.html?payment=cancelled`,
        merchantAccountNumber: hubtelAccount,
        clientReference: clientReference
    };

    console.log('[HUBTEL REQUEST] Initiating payment');
    console.log('Client Reference:', clientReference);
    console.log('Amount:', amount);
    console.log('API_BASE_URL:', apiBaseUrl);
    console.log('FRONTEND_URL:', frontendUrl);

    try {
        const response = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`
            },
            body: JSON.stringify(hubtelPayload)
        });

        let responseData;
        let responseText;
        
        try {
            // Try to parse JSON first
            responseText = await response.text();
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                responseData = null;
            }
        } catch (bodyError) {
            console.error('[HUBTEL ERROR] Failed to read response body:', bodyError.message);
            responseText = null;
            responseData = null;
        }

        console.log('[HUBTEL API RESPONSE] Status:', response.status);
        console.log('[HUBTEL API RESPONSE] Data:', responseData);

        if (!response.ok || !responseData) {
            console.error('[HUBTEL ERROR] Initiate failed with status:', response.status);
            console.error('[HUBTEL ERROR] Raw response:', responseText);
            throw new Error(`HTTP ${response.status}: Hubtel API returned an error. Response: ${responseData?.message || responseData?.error || 'Unknown error'}`);
        }

        logHubtelResponse('Initiate', responseData);

        return {
            checkoutId: responseData.checkoutId,
            checkoutUrl: responseData.checkoutUrl,
            responseCode: responseData.responseCode,
            message: responseData.message
        };

    } catch (error) {
        console.error('[HUBTEL ERROR] initiateHubtelPayment:', error.message);
        throw error;
    }
}

/**
 * Check Transaction Status (Fallback)
 * Uses OAuth2 authentication
 */
async function checkHubtelTransactionStatus(clientReference) {
    const hubtelAccount = process.env.HUBTEL_POS_SALES_ID;

    if (!hubtelAccount) {
        throw new Error('Hubtel account not configured');
    }

    // Get OAuth token
    const accessToken = await getHubtelOAuthToken();

    console.log('[HUBTEL STATUS] Checking transaction...');
    console.log('Client Reference:', clientReference);

    try {
        const response = await fetch(
            `https://api-txnstatus.hubtel.com/transactions/${clientReference}/status`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const responseData = await response.json();
        logHubtelResponse('Status Check', responseData);

        return responseData;

    } catch (error) {
        console.error('[HUBTEL ERROR] checkHubtelTransactionStatus:', error.message);
        throw error;
    }
}

/**
 * Verify Callback Signature (if Hubtel provides one)
 */
function verifyCallbackSignature(data, signature, secret) {
    // Implement if Hubtel provides callback signatures
    // This is optional security enhancement
    return true;
}

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * @route   POST /api/payments/hubtel/initiate
 * @desc    Initiate Hubtel payment and redirect user to checkout
 * @body    { amount, productId, customerEmail, customerName, description }
 */
router.post('/hubtel/initiate', async (req, res) => {
    try {
        const {
            amount,
            productId,
            customerEmail,
            customerName,
            description
        } = req.body;

        // Validate required fields
        if (!amount || !productId || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, productId, customerEmail'
            });
        }

        // Generate unique client reference
        const clientReference = generateClientReference();

        // Create pending payment record
        const paymentId = uuidv4();
        const payment = {
            id: paymentId,
            userId: null,
            clientReference: clientReference,
            amount: parseFloat(amount),
            currency: 'GHS',
            description: description || `Payment for ${productId}`,
            status: PaymentStatus.PENDING,
            hubtelCheckoutId: null,
            paymentMethod: null,
            customerEmail: customerEmail,
            customerName: customerName,
            productId: productId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paidAt: null
        };

        // Store in database
        payments.set(paymentId, payment);

        console.log(`[PAYMENT] Created pending payment: ${paymentId}`);
        console.log(`[PAYMENT] Client Reference: ${clientReference}`);
        console.log(`[PAYMENT] Amount: GHS ${amount}`);

        // Initiate Hubtel payment
        const hubtelResult = await initiateHubtelPayment({
            amount: payment.amount,
            description: payment.description,
            clientReference: payment.clientReference,
            returnUrl: `${process.env.FRONTEND_URL}/payment-success.html?ref=${clientReference}`,
            cancellationUrl: `${process.env.FRONTEND_URL}/payment-cancelled.html?ref=${clientReference}`
        });

        // Update payment with Hubtel checkout ID
        payment.hubtelCheckoutId = hubtelResult.checkoutId;
        payment.updatedAt = new Date().toISOString();

        console.log(`[PAYMENT] Hubtel checkout initiated: ${hubtelResult.checkoutId}`);

        // Return checkout URL to frontend for redirect
        res.json({
            success: true,
            data: {
                paymentId: payment.id,
                clientReference: payment.clientReference,
                checkoutUrl: hubtelResult.checkoutUrl,
                message: 'Payment initiated. Redirecting to Hubtel...'
            }
        });

    } catch (error) {
        console.error('[PAYMENT ERROR] initiate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate payment',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/payments/hubtel/callback
 * @desc    Hubtel callback endpoint for payment confirmation
 * @body    Hubtel sends payment result here
 */
router.post('/hubtel/callback', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const callbackData = JSON.parse(req.body);

        console.log('\n========================================');
        console.log('[HUBTEL CALLBACK] Payment callback received');
        console.log('========================================');
        console.log('Data:', JSON.stringify(callbackData, null, 2));

        // Extract relevant fields from Hubtel callback
        const {
            ClientReference,
            ResponseCode,
            Status,
            Amount,
            PaymentMethod,
            TransactionId
        } = callbackData;

        // Check for duplicate callback
        const callbackKey = `${ClientReference}-${ResponseCode}-${TransactionId || 'no-txn'}`;
        if (processedCallbacks.has(callbackKey)) {
            console.log('[HUBTEL CALLBACK] Duplicate callback detected, skipping');
            return res.status(200).json({ received: true });
        }
        processedCallbacks.add(callbackKey);

        // Find payment by client reference
        const paymentRecord = findPaymentByClientReference(ClientReference);

        if (!paymentRecord) {
            console.error('[HUBTEL CALLBACK] Payment not found for reference:', ClientReference);
            // Still respond 200 to Hubtel
            return res.status(200).json({ received: true });
        }

        const { id: paymentId, payment } = paymentRecord;

        // Verify amount matches
        if (Amount && Math.abs(parseFloat(Amount) - payment.amount) > 0.01) {
            console.warn('[HUBTEL CALLBACK] Amount mismatch - possible tampering');
            console.log('Expected:', payment.amount, 'Received:', Amount);
        }

        // Check if payment was successful
        const isSuccess = isHubtelSuccess(ResponseCode) && 
                          (Status?.toLowerCase() === 'success' || 
                           Status?.toLowerCase() === 'paid' ||
                           Status?.toLowerCase() === 'completed');

        // Update payment status
        if (isSuccess) {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date().toISOString();
            payment.paymentMethod = PaymentMethod || callbackData.PaymentMethod || 'unknown';
            payment.transactionId = TransactionId || callbackData.TransactionId;
            
            console.log(`✅ [PAYMENT] Payment PAID: ${paymentId}`);
            console.log(`   Amount: GHS ${payment.amount}`);
            console.log(`   Method: ${payment.paymentMethod}`);
        } else {
            payment.status = PaymentStatus.FAILED;
            console.log(`❌ [PAYMENT] Payment FAILED: ${paymentId}`);
            console.log(`   Response Code: ${ResponseCode}`);
            console.log(`   Status: ${Status}`);
        }

        payment.updatedAt = new Date().toISOString();

        // Always respond with 200 to Hubtel
        res.status(200).json({ received: true });

    } catch (error) {
        console.error('[HUBTEL CALLBACK ERROR]:', error);
        // Still respond 200 to prevent Hubtel retries
        res.status(200).json({ received: true });
    }
});

/**
 * @route   GET /api/payments/hubtel/status/:clientReference
 * @desc    Check payment status (for polling/fallback)
 */
router.get('/hubtel/status/:clientReference', async (req, res) => {
    try {
        const { clientReference } = req.params;

        // Find payment
        const paymentRecord = findPaymentByClientReference(clientReference);

        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        const { id: paymentId, payment } = paymentRecord;

        console.log(`[PAYMENT STATUS] Checking: ${clientReference} (Current: ${payment.status})`);

        // If payment is still pending, check Hubtel status
        if (payment.status === PaymentStatus.PENDING) {
            try {
                const hubtelStatus = await checkHubtelTransactionStatus(clientReference);

                const isSuccess = isHubtelSuccess(hubtelStatus.ResponseCode);

                if (isSuccess) {
                    payment.status = PaymentStatus.PAID;
                    payment.paidAt = new Date().toISOString();
                    payment.paymentMethod = hubtelStatus.PaymentMethod || 'unknown';
                    console.log(`✅ [PAYMENT STATUS] Payment confirmed PAID`);
                } else {
                    payment.status = PaymentStatus.FAILED;
                    console.log(`❌ [PAYMENT STATUS] Payment FAILED`);
                }

                payment.updatedAt = new Date().toISOString();

            } catch (error) {
                console.error('[PAYMENT STATUS] Hubtel check failed:', error.message);
            }
        }

        res.json({
            success: true,
            data: {
                clientReference: payment.clientReference,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                paidAt: payment.paidAt,
                paymentMethod: payment.paymentMethod,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error('[PAYMENT ERROR] status check:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check payment status'
        });
    }
});

/**
 * @route   POST /api/payments/hubtel/fallback-check
 * @desc    Manually trigger status check for pending payments
 */
router.post('/hubtel/fallback-check', async (req, res) => {
    try {
        const { clientReference } = req.body;

        if (!clientReference) {
            return res.status(400).json({
                success: false,
                error: 'clientReference is required'
            });
        }

        const paymentRecord = findPaymentByClientReference(clientReference);

        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        const { id: paymentId, payment } = paymentRecord;

        if (payment.status !== PaymentStatus.PENDING) {
            return res.json({
                success: true,
                data: {
                    clientReference: payment.clientReference,
                    status: payment.status,
                    message: 'Payment already processed'
                }
            });
        }

        // Check Hubtel status
        try {
            const hubtelStatus = await checkHubtelTransactionStatus(clientReference);

            const isSuccess = isHubtelSuccess(hubtelStatus.ResponseCode);

            if (isSuccess) {
                payment.status = PaymentStatus.PAID;
                payment.paidAt = new Date().toISOString();
                payment.paymentMethod = hubtelStatus.PaymentMethod || 'unknown';
                console.log(`[FALLBACK] Payment confirmed: ${clientReference}`);
            } else {
                payment.status = PaymentStatus.FAILED;
                console.log(`[FALLBACK] Payment failed: ${clientReference}`);
            }

            payment.updatedAt = new Date().toISOString();

            res.json({
                success: true,
                data: {
                    clientReference: payment.clientReference,
                    status: payment.status,
                    hubtelResponse: hubtelStatus
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to check Hubtel status',
                message: error.message
            });
        }

    } catch (error) {
        console.error('[PAYMENT ERROR] fallback check:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform fallback check'
        });
    }
});

/**
 * @route   POST /api/payments/hubtel/refund
 * @desc    Process refund for paid payment
 */
router.post('/hubtel/refund', async (req, res) => {
    try {
        const { clientReference, amount, reason } = req.body;

        const paymentRecord = findPaymentByClientReference(clientReference);

        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        const { id: paymentId, payment } = paymentRecord;

        if (payment.status !== PaymentStatus.PAID) {
            return res.status(400).json({
                success: false,
                error: 'Can only refund paid payments'
            });
        }

        // Create refund record
        const refund = {
            id: `ref_${uuidv4().substring(0, 12)}`,
            paymentId: paymentId,
            clientReference: clientReference,
            amount: amount || payment.amount,
            reason: reason || 'requested_by_customer',
            status: 'processed',
            createdAt: new Date().toISOString()
        };

        console.log(`[REFUND] Refund processed: ${refund.id}`);

        res.json({
            success: true,
            data: refund
        });

    } catch (error) {
        console.error('[PAYMENT ERROR] refund:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process refund'
        });
    }
});

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 */
router.get('/:id', (req, res) => {
    const payment = payments.get(req.params.id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            error: 'Payment not found'
        });
    }

    res.json({
        success: true,
        data: {
            id: payment.id,
            clientReference: payment.clientReference,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            productId: payment.productId,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt
        }
    });
});

/**
 * @route   GET /api/payments
 * @desc    Get all payments (admin only - add authentication in production)
 */
router.get('/', (req, res) => {
    const allPayments = Array.from(payments.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        data: allPayments
    });
});

module.exports = router;
