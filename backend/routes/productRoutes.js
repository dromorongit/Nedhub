const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * Product Routes
 */

// Get all products (CV templates)
router.get('/products', productController.getProducts);

// Get single product by ID
router.get('/products/:id', productController.getProduct);

module.exports = router;
