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

  /** PATCH /api/orders/:id/status — admin: mark placed/shipped/delivered/cancelled */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      const allowed = ['placed', 'shipped', 'delivered', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, error: `status must be one of: ${allowed.join(', ')}` });
      }
      const updated = await OrderModel.updateStatus(id, status);
      logger.rowUpdated('orders', id, { action: 'status_updated', status });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('ORDER_STATUS_UPDATE', `Failed to update order status: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** DELETE /api/orders/:id — admin: delete a specific order */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await OrderModel.delete(id);
      logger.rowUpdated('orders', id, { action: 'deleted' });
      return res.json({ success: true, message: `Order ${id} deleted successfully` });
    } catch (err) {
      logger.error('ORDER_DELETE', `Failed to delete order: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** DELETE /api/orders — admin: delete all orders */
  static async deleteAll(req, res) {
    try {
      await OrderModel.deleteAll();
      logger.event('ORDER', '🗑️', 'All orders cleared by admin');
      return res.json({ success: true, message: 'All orders deleted successfully' });
    } catch (err) {
      logger.error('ORDER_DELETE_ALL', 'Failed to delete all orders', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = OrderController;
