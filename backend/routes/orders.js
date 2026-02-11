/**
 * Orders Routes
 * Order management and download handling
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory order storage (use database in production)
const orders = new Map();

/**
 * @route   POST /api/orders/create
 * @desc    Create a new order
 * @body    { productId, customerEmail, customerName, paymentId }
 */
router.post('/create', async (req, res) => {
    try {
        const { productId, customerEmail, customerName, paymentId } = req.body;

        if (!productId || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: productId, customerEmail'
            });
        }

        const order = {
            id: `ord_${uuidv4().replace(/-/g, '')}`,
            productId: productId,
            customerEmail: customerEmail,
            customerName: customerName,
            paymentId: paymentId || null,
            status: paymentId ? 'paid' : 'pending',
            createdAt: new Date().toISOString(),
            downloadCount: 0,
            downloadLimit: 5,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            downloadUrl: null
        };

        // Generate download token
        order.downloadToken = uuidv4();
        order.downloadUrl = `/api/orders/download/${order.id}/${order.downloadToken}`;

        orders.set(order.id, order);

        console.log(`Order created: ${order.id}`);

        res.json({
            success: true,
            data: {
                orderId: order.id,
                status: order.status,
                downloadUrl: order.downloadUrl,
                expiresAt: order.expiresAt,
                downloadLimit: order.downloadLimit
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order'
        });
    }
});

/**
 * @route   POST /api/orders/free-download
 * @desc    Create free download order
 * @body    { productId, customerEmail, customerName }
 */
router.post('/free-download', async (req, res) => {
    try {
        const { productId, customerEmail, customerName } = req.body;

        if (!productId || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const order = {
            id: `ord_${uuidv4().replace(/-/g, '')}`,
            productId: productId,
            customerEmail: customerEmail,
            customerName: customerName,
            paymentId: null,
            status: 'completed',
            createdAt: new Date().toISOString(),
            downloadCount: 1,
            downloadLimit: 3,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            downloadToken: uuidv4(),
            downloadUrl: `/api/orders/download/${'$id'}/${order.downloadToken}`.replace('${'$id'}', 'ord_placeholder')
        };

        orders.set(order.id, order);

        res.json({
            success: true,
            data: {
                orderId: order.id,
                status: order.status,
                message: 'Free download created successfully'
            }
        });

    } catch (error) {
        console.error('Error creating free download:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create free download'
        });
    }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details
 */
router.get('/:id', (req, res) => {
    try {
        const order = orders.get(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: order.id,
                productId: order.productId,
                status: order.status,
                createdAt: order.createdAt,
                downloadCount: order.downloadCount,
                downloadLimit: order.downloadLimit,
                expiresAt: order.expiresAt
            }
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
});

/**
 * @route   GET /api/orders/download/:orderId/:token
 * @desc    Download product file
 */
router.get('/download/:orderId/:token', (req, res) => {
    try {
        const { orderId, token } = req.params;

        const order = orders.get(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.downloadToken !== token) {
            return res.status(403).json({
                success: false,
                error: 'Invalid download token'
            });
        }

        if (new Date(order.expiresAt) < new Date()) {
            return res.status(410).json({
                success: false,
                error: 'Download link has expired'
            });
        }

        if (order.downloadCount >= order.downloadLimit) {
            return res.status(403).json({
                success: false,
                error: 'Download limit reached'
            });
        }

        // Increment download count
        order.downloadCount++;

        // TODO: Serve actual file
        // const filePath = path.join(__dirname, '../downloads/', product.filename);
        // res.download(filePath, product.filename);

        res.json({
            success: true,
            data: {
                message: 'Download authorized',
                orderId: order.id,
                downloadsRemaining: order.downloadLimit - order.downloadCount,
                expiresAt: order.expiresAt
            }
        });

    } catch (error) {
        console.error('Error processing download:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process download'
        });
    }
});

/**
 * @route   GET /api/orders/user/:email
 * @desc    Get all orders for a user
 */
router.get('/user/:email', (req, res) => {
    try {
        const userOrders = Array.from(orders.values())
            .filter(o => o.customerEmail === req.params.email)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: userOrders
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

module.exports = router;
