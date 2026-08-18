const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const OrderModel = require('../models/orderModel');
const { logger } = require('../middleware/loggerMiddleware');

class PaymentController {
  /** POST /api/payments/create-order — opens a Razorpay order for an existing RapiQR order.
   * Amount is always recomputed from the order stored server-side, never trusted from the client. */
  static async createOrder(req, res) {
    try {
      const { orderId } = req.body || {};
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'orderId is required' });
      }

      const order = await OrderModel.getById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      if (order.payment?.status === 'paid') {
        return res.status(400).json({ success: false, error: 'This order has already been paid for' });
      }

      const amountPaise = Math.round(Number(order.total) * 100);
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        logger.warn('PAYMENT_CREATE_ORDER', `Order ${order.id} has an invalid total (${order.total}) — refusing to open a Razorpay order for it`);
        return res.status(400).json({ success: false, error: 'This order has an invalid amount and cannot be paid for. Please contact support.' });
      }

      const rpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.id,
        notes: { rapiqrOrderId: order.id, userId: order.userId || 'guest' },
      });

      await OrderModel.attachPaymentInfo(order.id, {
        status: 'created',
        razorpayOrderId: rpOrder.id,
        amount: amountPaise,
        currency: 'INR',
      });

      logger.event('PAYMENT', '💳', `Razorpay order ${rpOrder.id} created for ${order.id} (₹${order.total})`);
      return res.json({
        success: true,
        data: {
          keyId: process.env.RAZORPAY_KEY_ID,
          razorpayOrderId: rpOrder.id,
          amount: amountPaise,
          currency: 'INR',
          orderId: order.id,
          name: order.name,
          email: order.email,
          phone: order.phone,
        },
      });
    } catch (err) {
      logger.error('PAYMENT_CREATE_ORDER', 'Failed to create Razorpay order', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** POST /api/payments/verify — verifies the Razorpay signature and marks the order paid */
  static async verify(req, res) {
    try {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
      }

      const order = await OrderModel.getById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      if (order.payment?.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ success: false, error: 'Order/payment mismatch' });
      }
      // Already confirmed paid — treat as an idempotent success and never let a later
      // call (retry, replay, or a forged signature) downgrade a real payment record.
      if (order.payment?.status === 'paid') {
        return res.json({ success: true, data: order });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await OrderModel.attachPaymentInfo(orderId, { ...order.payment, status: 'failed', razorpayPaymentId: razorpay_payment_id });
        logger.warn('PAYMENT_VERIFY', `Signature mismatch for order ${orderId}`);
        return res.status(400).json({ success: false, error: 'Payment verification failed' });
      }

      const updated = await OrderModel.attachPaymentInfo(orderId, {
        ...order.payment,
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date().toISOString(),
      });

      logger.event('PAYMENT', '✅', `Payment verified for order ${orderId} (${razorpay_payment_id})`);
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PAYMENT_VERIFY', 'Failed to verify payment', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = PaymentController;
