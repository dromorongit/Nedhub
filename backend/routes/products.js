/**
 * Products Routes
 * CV Templates and services product management
 */

const express = require('express');
const router = express.Router();

// Mock product database (use real database in production)
const products = [
    // CV Templates
    {
        id: 'cv-001',
        name: 'Modern Pro',
        description: 'Clean and contemporary design perfect for corporate roles',
        price: 9.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'modern',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/modern-pro.docx',
        isFree: false,
        rating: 4.9,
        reviews: 245,
        features: ['ATS Friendly', 'Word Format', 'Easy Edit', 'Modern Design'],
        tags: ['corporate', 'professional', 'modern']
    },
    {
        id: 'cv-002',
        name: 'Classic Elegance',
        description: 'Timeless design with a professional touch',
        price: 7.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'classic',
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/classic-elegance.docx',
        isFree: false,
        rating: 4.8,
        reviews: 189,
        features: ['ATS Friendly', 'Word Format', 'Classic Style', 'Clean Layout'],
        tags: ['classic', 'traditional', 'professional']
    },
    {
        id: 'cv-003',
        name: 'Creative Studio',
        description: 'Bold and unique design for creative professionals',
        price: 12.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'creative',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/creative-studio.docx',
        isFree: false,
        rating: 4.7,
        reviews: 156,
        features: ['Unique Design', 'Word Format', 'Creative Layout', 'Eye Catching'],
        tags: ['creative', 'design', 'modern']
    },
    {
        id: 'cv-004',
        name: 'Professional Standard',
        description: 'Essential template for all industries',
        price: 0,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'professional',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/professional-standard.docx',
        isFree: true,
        rating: 4.6,
        reviews: 523,
        features: ['ATS Friendly', 'Free Download', 'Word Format', 'Universal'],
        tags: ['free', 'professional', 'standard']
    },
    {
        id: 'cv-005',
        name: 'Minimal Design',
        description: 'Simple and clean layout focusing on content',
        price: 8.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'modern',
        image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/minimal-design.docx',
        isFree: false,
        rating: 4.8,
        reviews: 312,
        features: ['Minimal Style', 'Clean Layout', 'Word Format', 'Easy Read'],
        tags: ['minimal', 'clean', 'modern']
    },
    {
        id: 'cv-006',
        name: 'Executive Premium',
        description: 'Sophisticated design for senior positions',
        price: 14.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'classic',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/executive-premium.docx',
        isFree: false,
        rating: 4.9,
        reviews: 98,
        features: ['Executive Style', 'Premium Design', 'Word Format', 'Senior Level'],
        tags: ['executive', 'premium', 'senior']
    },
    {
        id: 'cv-007',
        name: 'Dynamic Flow',
        description: 'Energetic design with modern typography',
        price: 11.99,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'creative',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/dynamic-flow.docx',
        isFree: false,
        rating: 4.7,
        reviews: 134,
        features: ['Dynamic Design', 'Modern Typography', 'Word Format', 'Creative'],
        tags: ['dynamic', 'creative', 'modern']
    },
    {
        id: 'cv-008',
        name: 'Basic Resume',
        description: 'Simple and straightforward template',
        price: 0,
        currency: 'USD',
        category: 'cv-template',
        subcategory: 'professional',
        image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
        downloadUrl: '/downloads/cv-templates/basic-resume.docx',
        isFree: true,
        rating: 4.5,
        reviews: 789,
        features: ['Free Download', 'Simple Format', 'Word Format', 'Beginner Friendly'],
        tags: ['free', 'basic', 'simple']
    }
];

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filtering
 * @query   category, subcategory, isFree, minPrice, maxPrice
 */
router.get('/', (req, res) => {
    try {
        let filteredProducts = [...products];
        const { category, subcategory, isFree, minPrice, maxPrice, search } = req.query;

        // Filter by category
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }

        // Filter by subcategory
        if (subcategory) {
            filteredProducts = filteredProducts.filter(p => p.subcategory === subcategory);
        }

        // Filter by free/paid
        if (isFree !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.isFree === (isFree === 'true'));
        }

        // Filter by price range
        if (minPrice) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
        }

        // Search by name or description
        if (search) {
            const searchLower = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        res.json({
            success: true,
            data: {
                products: filteredProducts,
                total: filteredProducts.length,
                filters: {
                    category,
                    subcategory,
                    isFree,
                    minPrice,
                    maxPrice,
                    search
                }
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 */
router.get('/:id', (req, res) => {
    try {
        const product = products.find(p => p.id === req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
});

/**
 * @route   GET /api/products/categories/all
 * @desc    Get all product categories
 */
router.get('/categories/all', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    
    res.json({
        success: true,
        data: categories
    });
});

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 */
router.get('/featured/list', (req, res) => {
    const featured = products
        .filter(p => p.rating >= 4.7)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);

    res.json({
        success: true,
        data: featured
    });
});

module.exports = router;
