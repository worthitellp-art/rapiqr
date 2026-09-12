const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const OrderModel = require('../models/orderModel');
const { logger } = require('../middleware/loggerMiddleware');

const MINIMUM_PAYMENT_AMOUNT_PAISE = 100;
const DEFAULT_PAYMENT_CURRENCY = 'INR';

class PaymentController {
  /**
   * POST /api/create-order and /api/payments/create-order
   * Supports both direct amount payloads ({ amount, currency, receipt })
   * and existing RapiQR order payloads ({ orderId }).
   */
  static async createOrder(req, res) {
    try {
      const { orderId, amount, currency, receipt, notes } = req.body || {};

      // Path A: Existing internal order lookup
      if (orderId) {
        const existingOrder = await OrderModel.getById(orderId);
        if (!existingOrder) {
          return res.status(404).json({ success: false, error: 'Order not found' });
        }
        if (existingOrder.payment?.status === 'paid') {
          return res.status(400).json({ success: false, error: 'This order has already been paid for' });
        }

        const calculatedPaise = Math.round(Number(existingOrder.total) * 100);
        if (!Number.isFinite(calculatedPaise) || calculatedPaise < MINIMUM_PAYMENT_AMOUNT_PAISE) {
          logger.warn('PAYMENT_CREATE_ORDER', `Order ${existingOrder.id} has invalid total (${existingOrder.total})`);
          return res.status(400).json({
            success: false,
            error: `Order total must be at least ${MINIMUM_PAYMENT_AMOUNT_PAISE} paise (₹1.00)`,
          });
        }

        const razorpayOrder = await razorpay.orders.create({
          amount: calculatedPaise,
          currency: DEFAULT_PAYMENT_CURRENCY,
          receipt: existingOrder.id,
          notes: { rapiqrOrderId: existingOrder.id, userId: existingOrder.userId || 'guest' },
        });

        await OrderModel.attachPaymentInfo(existingOrder.id, {
          status: 'created',
          razorpayOrderId: razorpayOrder.id,
          amount: calculatedPaise,
          currency: DEFAULT_PAYMENT_CURRENCY,
        });

        logger.event('PAYMENT', '💳', `Razorpay order ${razorpayOrder.id} opened for ${existingOrder.id} (₹${existingOrder.total})`);

        return res.json({
          success: true,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          data: {
            keyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            order_id: razorpayOrder.id,
            amount: calculatedPaise,
            currency: DEFAULT_PAYMENT_CURRENCY,
            orderId: existingOrder.id,
            name: existingOrder.name,
            email: existingOrder.email,
            phone: existingOrder.phone,
          },
        });
      }

      // Path B: Direct Razorpay standard checkout amount payload
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount < MINIMUM_PAYMENT_AMOUNT_PAISE) {
        return res.status(400).json({
          success: false,
          error: `amount in paise is required and must be at least ${MINIMUM_PAYMENT_AMOUNT_PAISE} paise (₹1.00)`,
        });
      }

      const selectedCurrency = (currency || DEFAULT_PAYMENT_CURRENCY).toUpperCase();
      const generatedReceipt = receipt || `rcpt_${Date.now()}`;

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(numericAmount),
        currency: selectedCurrency,
        receipt: String(generatedReceipt).slice(0, 40),
        notes: notes || {},
      });

      logger.event('PAYMENT', '💳', `Direct Razorpay order created: ${razorpayOrder.id} (${selectedCurrency} ${numericAmount / 100})`);

      return res.json({
        success: true,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        data: {
          keyId: process.env.RAZORPAY_KEY_ID,
          razorpayOrderId: razorpayOrder.id,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
      });
    } catch (err) {
      logger.error('PAYMENT_CREATE_ORDER', 'Failed to create Razorpay order', err);
      const isAuthError = err.statusCode === 401 || err.status === 401;
      return res.status(isAuthError ? 401 : 500).json({
        success: false,
        error: err.error?.description || err.message || 'Failed to create Razorpay order',
      });
    }
  }

  /**
   * POST /api/verify-payment and /api/payments/verify
   * Verifies the cryptographic HMAC-SHA256 signature produced by Razorpay checkout.
   */
  static async verify(req, res) {
    try {
      const {
        orderId,
        order_id,
        razorpay_order_id,
        payment_id,
        razorpay_payment_id,
        signature,
        razorpay_signature,
      } = req.body || {};

      const targetOrderId = razorpay_order_id || order_id;
      const targetPaymentId = razorpay_payment_id || payment_id;
      const targetSignature = razorpay_signature || signature;

      if (!targetOrderId || !targetPaymentId || !targetSignature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required payment verification fields (order_id, payment_id, signature)',
        });
      }

      const secretKey = process.env.RAZORPAY_KEY_SECRET || '';
      if (!secretKey) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured on the server',
        });
      }

      // Compute expected HMAC-SHA256 signature: HMAC(order_id + "|" + payment_id, secret)
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(`${targetOrderId}|${targetPaymentId}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const receivedBuffer = Buffer.from(String(targetSignature), 'utf8');
      const isSignatureValid =
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isSignatureValid) {
        if (orderId) {
          await OrderModel.attachPaymentInfo(orderId, {
            status: 'failed',
            razorpayPaymentId: targetPaymentId,
          }).catch(() => {});
        }
        logger.warn('PAYMENT_VERIFY', `Signature mismatch for order ${targetOrderId}`);
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed: Signature mismatch',
        });
      }

      // Reconcile with database order if database is connected
      let matchedOrder = null;
      try {
        if (orderId) {
          matchedOrder = await OrderModel.getById(orderId);
        } else {
          matchedOrder = await OrderModel.getByRazorpayOrderId(targetOrderId);
        }

        if (matchedOrder && matchedOrder.payment?.status !== 'paid') {
          matchedOrder = await OrderModel.attachPaymentInfo(matchedOrder.id, {
            ...matchedOrder.payment,
            status: 'paid',
            razorpayPaymentId: targetPaymentId,
            razorpaySignature: targetSignature,
            paidAt: new Date().toISOString(),
          });
        }
      } catch (dbError) {
        // Best effort reconciliation: do not fail verification if DB is offline/buffering
        logger.warn('PAYMENT_VERIFY', `Order database lookup skipped: ${dbError?.message}`);
      }

      logger.event('PAYMENT', '✅', `Payment verified successfully for ${targetOrderId} (${targetPaymentId})`);

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: targetOrderId,
        payment_id: targetPaymentId,
        data: matchedOrder || {
          order_id: targetOrderId,
          payment_id: targetPaymentId,
          status: 'paid',
        },
      });
    } catch (err) {
      logger.error('PAYMENT_VERIFY', 'Failed to verify payment', err);
      return res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
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
