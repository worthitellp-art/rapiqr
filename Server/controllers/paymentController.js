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

  /**
   * POST /api/webhooks/razorpay — the authoritative record of what was charged.
   *
   * /verify above only runs while the customer's browser is still on the success
   * handler. A closed tab, a dropped connection, or a UPI app that takes its time
   * confirming all leave money captured at Razorpay and an order stuck on
   * "Awaiting Payment" here. This webhook closes that window: Razorpay retries it
   * for 24 hours, so the order gets marked paid regardless of what the browser did.
   *
   * Public by necessity, authenticated by an HMAC over the raw request body with
   * the secret configured on the webhook in the Razorpay dashboard. With
   * RAZORPAY_WEBHOOK_SECRET unset it FAILS CLOSED — nothing may mark an order
   * paid without a signature we can check.
   */
  static async webhook(req, res) {
    const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    if (!secret) {
      logger.warn('RAZORPAY_WEBHOOK', 'Payment event received but RAZORPAY_WEBHOOK_SECRET is not set — refusing.');
      return res.status(503).json({ success: false, error: 'Webhook not configured' });
    }

    const header = req.get('x-razorpay-signature') || '';
    const raw = req.rawBody;
    if (!raw) {
      logger.warn('RAZORPAY_WEBHOOK', 'No raw body captured — cannot verify signature.');
      return res.sendStatus(400);
    }

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (header.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))) {
      logger.warn('RAZORPAY_WEBHOOK', 'Rejected a payment event with an invalid signature.');
      return res.sendStatus(403);
    }

    try {
      const event = req.body?.event || '';
      const entity = req.body?.payload?.payment?.entity || req.body?.payload?.order?.entity || {};

      // We stamp our own order id into `notes` when opening the Razorpay order
      // (see createOrder), so prefer it and fall back to a lookup by their id.
      const rapiqrOrderId = entity?.notes?.rapiqrOrderId;
      const order = rapiqrOrderId
        ? await OrderModel.getById(rapiqrOrderId)
        : await OrderModel.getByRazorpayOrderId(entity?.order_id || entity?.id || '');

      if (!order) {
        logger.warn('RAZORPAY_WEBHOOK', `${event} for an unknown order (${rapiqrOrderId || entity?.order_id || 'no id'}) — ignored.`);
        return res.sendStatus(200);
      }

      if (event === 'payment.captured' || event === 'order.paid') {
        // Idempotent: Razorpay redelivers, and /verify may have already won the
        // race. A second capture event must never rewrite a settled payment.
        if (order.payment?.status === 'paid') return res.sendStatus(200);

        await OrderModel.attachPaymentInfo(order.id, {
          ...(order.payment || {}),
          status: 'paid',
          razorpayOrderId: entity.order_id || order.payment?.razorpayOrderId,
          razorpayPaymentId: entity.id,
          amount: entity.amount ?? order.payment?.amount,
          currency: entity.currency || 'INR',
          method: entity.method || null,
          paidAt: new Date().toISOString(),
          source: 'webhook',
        });
        logger.event('PAYMENT', '✅', `Payment captured via webhook for order ${order.id} (${entity.id})`);
      } else if (event === 'payment.failed') {
        // Never downgrade a paid order — a customer whose first attempt failed
        // and second succeeded can have the events arrive out of order.
        if (order.payment?.status !== 'paid') {
          await OrderModel.attachPaymentInfo(order.id, {
            ...(order.payment || {}),
            status: 'failed',
            razorpayPaymentId: entity.id,
            failureReason: entity.error_description || entity.error_reason || null,
          });
          logger.warn('RAZORPAY_WEBHOOK', `Payment failed for order ${order.id}: ${entity.error_description || 'no reason given'}`);
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      logger.error('RAZORPAY_WEBHOOK', 'Failed to process a payment event', err);
      // 200 regardless: Razorpay disables an endpoint that keeps erroring, and
      // the retry would hit the same bug anyway.
      return res.sendStatus(200);
    }
  }
}

module.exports = PaymentController;
