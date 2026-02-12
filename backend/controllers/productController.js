/**
 * Product Controller for handling product-related requests
 */

// CV Templates data
const templates = [
  {
    id: 'cv-1',
    name: 'Modern Pro',
    price: 120,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
    category: 'professional',
    downloadUrl: '#',
    description: 'A modern, professional CV template perfect for corporate roles',
    isFree: false
  },
  {
    id: 'cv-2',
    name: 'Classic Elegance',
    price: 1,
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    category: 'classic',
    downloadUrl: '#',
    description: 'A timeless classic design for traditional professionals',
    isFree: false
  },
  {
    id: 'cv-3',
    name: 'Creative Studio',
    price: 155,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
    category: 'creative',
    downloadUrl: '#',
    description: 'Stand out with this creative and unique template',
    isFree: false
  },
  {
    id: 'cv-4',
    name: 'Professional Standard',
    price: 0,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
    category: 'professional',
    downloadUrl: '#',
    description: 'A free professional template for everyone',
    isFree: true
  },
  {
    id: 'cv-5',
    name: 'Minimal Design',
    price: 110,
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80',
    category: 'minimal',
    downloadUrl: '#',
    description: 'Clean and minimal design for modern professionals',
    isFree: false
  },
  {
    id: 'cv-6',
    name: 'Executive Premium',
    price: 180,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    category: 'executive',
    downloadUrl: '#',
    description: 'Premium template for senior executives and directors',
    isFree: false
  },
  {
    id: 'cv-7',
    name: 'Dynamic Flow',
    price: 145,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    category: 'creative',
    downloadUrl: '#',
    description: 'Dynamic layout for creative professionals',
    isFree: false
  },
  {
    id: 'cv-8',
    name: 'Basic Resume',
    price: 0,
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
    category: 'basic',
    downloadUrl: '#',
    description: 'Simple and straightforward resume template',
    isFree: true
  }
];

/**
 * Get all products (CV templates)
 * GET /api/products
 */
async function getProducts(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        products: templates,
        total: templates.length
      }
    });
  } catch (error) {
    console.error(`[ProductController] Get products error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products'
    });
  }
}

/**
 * Get single product by ID
 * GET /api/products/:id
 */
async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = templates.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`[ProductController] Get product error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product'
    });
  }
}

module.exports = {
  getProducts,
  getProduct
};
