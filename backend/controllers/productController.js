/**
 * Product Controller for handling product-related requests
 */

/**
 * Get all products (CV templates) from database
 * GET /api/products
 */
async function getProducts(req, res) {
    try {
        const { CVTemplate } = require('../models/CVTemplate');
        const templates = await CVTemplate.find({ status: 'Published' }).sort({ featured: -1, createdAt: -1 });

        res.json({
            success: true,
            data: {
                products: templates,
                total: templates.length
            }
        });
    } catch (error) {
        console.error(`[ProductController] Get products error:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve products'
        });
    }
}

/**
 * Get single product by ID from database
 * GET /api/products/:id
 */
async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const { CVTemplate } = require('../models/CVTemplate');
        const product = await CVTemplate.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error(`[ProductController] Get product error:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve product'
        });
    }
}

module.exports = {
    getProducts,
    getProduct
};
