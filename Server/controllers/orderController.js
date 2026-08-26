const OrderModel = require('../models/orderModel');
const ShiprocketController = require('./shiprocketController');
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

  /**
   * GET /api/orders/:id/track — the buyer's own delivery status.
   *
   * The Shiprocket track route is admin-only (it also exposes wallet and pickup
   * config), so customers need their own way in. Scoped to the caller's own
   * orders; admins may track any.
   *
   * Refreshes from the courier when there's a shipment, but never fails the
   * request over it: a Shiprocket outage should still show the customer the
   * status and timeline we already have stored.
   */
  static async track(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getById(id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const isOwner = order.userId && order.userId === req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: 'This order belongs to another account.' });
      }

      let current = order;
      if (order.shiprocket?.shipmentId) {
        try {
          current = (await ShiprocketController.refreshTracking(order)) || order;
        } catch (err) {
          logger.warn('ORDER_TRACK', `Live tracking refresh failed for ${id}, serving stored tracking: ${err.message}`);
        }
      }

      return res.json({
        success: true,
        data: {
          id: current.id,
          status: current.status,
          payment: current.payment,
          deliveryMethod: current.deliveryMethod,
          createdAt: current.createdAt,
          shiprocket: current.shiprocket || null,
        },
      });
    } catch (err) {
      logger.error('ORDER_TRACK', `Failed to track order: ${req.params.id}`, err);
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
