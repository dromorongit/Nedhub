const mongoose = require('mongoose');

/**
 * Order Schema for storing payment transactions
 */
const orderSchema = new mongoose.Schema({
  clientReference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  checkoutId: {
    type: String,
    default: null
  },
  customerName: {
    type: String,
    default: null
  },
  customerEmail: {
    type: String,
    default: null
  },
  customerPhone: {
    type: String,
    default: null
  },
  hubtelResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

/**
 * Create order if it doesn't exist, or update existing
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} - Created/updated order
 */
orderSchema.statics.createOrUpdateOrder = async function(orderData) {
  const { clientReference, amount, description, customerName, customerEmail, customerPhone } = orderData;
  
  let order = await this.findOne({ clientReference });
  
  if (order) {
    // Update existing order
    order.amount = amount;
    order.description = description;
    order.customerName = customerName;
    order.customerEmail = customerEmail;
    order.customerPhone = customerPhone;
    await order.save();
  } else {
    // Create new order
    order = await this.create({
      clientReference,
      amount,
      description,
      customerName,
      customerEmail,
      customerPhone,
      status: 'Pending'
    });
  }
  
  return order;
};

/**
 * Mark order as paid
 * @param {string} clientReference - Order client reference
 * @param {Object} paymentData - Payment confirmation data
 * @returns {Promise<Object>} - Updated order
 */
orderSchema.statics.markAsPaid = async function(clientReference, paymentData) {
  const { transactionId, paymentMethod, checkoutId, hubtelResponse } = paymentData;
  
  const order = await this.findOneAndUpdate(
    { clientReference },
    {
      status: 'Paid',
      transactionId,
      paymentMethod,
      checkoutId,
      hubtelResponse,
      paidAt: new Date()
    },
    { new: true }
  );
  
  return order;
};

/**
 * Mark order as failed
 * @param {string} clientReference - Order client reference
 * @param {string} reason - Failure reason
 * @returns {Promise<Object>} - Updated order
 */
orderSchema.statics.markAsFailed = async function(clientReference, reason) {
  const order = await this.findOneAndUpdate(
    { clientReference },
    {
      status: 'Failed',
      hubtelResponse: { error: reason }
    },
    { new: true }
  );
  
  return order;
};

/**
 * Find order by checkoutId
 * @param {string} checkoutId - Hubtel checkout ID
 * @returns {Promise<Object>} - Found order
 */
orderSchema.statics.findByCheckoutId = async function(checkoutId) {
  return await this.findOne({ checkoutId });
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
