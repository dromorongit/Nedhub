/**
 * Validation Middleware for request validation
 */

/**
 * Validate payment request body
 */
const validatePaymentRequest = (req, res, next) => {
  const { amount, description } = req.body;
  const errors = [];

  // Validate amount
  if (!amount) {
    errors.push('Amount is required');
  } else if (isNaN(amount)) {
    errors.push('Amount must be a number');
  } else if (parseFloat(amount) <= 0) {
    errors.push('Amount must be greater than zero');
  } else if (parseFloat(amount) < 1) {
    errors.push('Minimum amount is 1');
  } else if (parseFloat(amount) > 1000000) {
    errors.push('Maximum amount is 1,000,000');
  }

  // Validate description
  if (!description) {
    errors.push('Description is required');
  } else if (typeof description !== 'string') {
    errors.push('Description must be a string');
  } else if (description.trim().length < 3) {
    errors.push('Description must be at least 3 characters');
  } else if (description.trim().length > 200) {
    errors.push('Description must be less than 200 characters');
  }

  // Validate optional fields
  if (req.body.customerEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.customerEmail)) {
      errors.push('Invalid email format');
    }
  }

  if (req.body.customerPhone) {
    const phoneRegex = /^[0-9+\-\s]{7,15}$/;
    if (!phoneRegex.test(req.body.customerPhone)) {
      errors.push('Invalid phone number format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Sanitize and normalize request data
  req.body.amount = parseFloat(amount);
  req.body.description = description.trim();
  req.body.customerEmail = req.body.customerEmail?.trim().toLowerCase();
  req.body.customerPhone = req.body.customerPhone?.trim();

  next();
};

/**
 * Validate client reference parameter
 */
const validateClientReference = (req, res, next) => {
  const { clientReference } = req.params;

  if (!clientReference) {
    return res.status(400).json({
      success: false,
      error: 'Client reference is required'
    });
  }

  // Basic validation - client reference should be alphanumeric with hyphens
  const validPattern = /^[a-zA-Z0-9\-_]+$/;
  if (!validPattern.test(clientReference) || clientReference.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Invalid client reference format'
    });
  }

  next();
};

module.exports = {
  validatePaymentRequest,
  validateClientReference
};
