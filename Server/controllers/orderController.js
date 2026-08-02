const OrderModel = require('../models/orderModel');
const { logger } = require('../middleware/loggerMiddleware');

class OrderController {
  /** POST /api/orders — guest-friendly checkout receipt (user_id attached if logged in) */
  static async create(req, res) {
    try {
      const { name, email, phone, items, subtotal, deliveryFee, total, paymentMethod, deliveryMethod, shippingAddress } = req.body || {};
      if (!name || !email || !phone || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'name, email, phone and a non-empty items array are required' });
      }

      const order = await OrderModel.create({
        userId: req.user?.id,
        name, email, phone, items, subtotal, deliveryFee, total, paymentMethod, deliveryMethod, shippingAddress,
      });
      logger.event('ORDER', '🛒', `Order ${order.id} placed by ${email} (₹${order.total})`);
      return res.json({ success: true, data: order });
    } catch (err) {
      logger.error('ORDER_CREATE', 'Failed to save order', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/orders/mine — the logged-in user's own order history */
  static async mine(req, res) {
    try {
      const data = await OrderModel.getAllByUser(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ORDER_MINE', 'Failed to fetch order history', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/orders — admin: every order */
  static async list(req, res) {
    try {
      const data = await OrderModel.getAll();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ORDER_LIST', 'Failed to list orders', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = OrderController;
