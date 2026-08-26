const crypto = require('crypto');
const OrderModel = require('../models/orderModel');
const {
  getShiprocketCredentials,
  callShiprocketApi,
  mapShiprocketStatus,
  normalizeTracking,
} = require('../services/shiprocketClient');
const { logger } = require('../middleware/loggerMiddleware');

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  const first = parts.shift() || 'Customer';
  const last = parts.join(' ') || first;
  return { first, last };
}

class ShiprocketController {
  /** GET /api/shiprocket/dashboard — wallet balance + registered pickup locations */
  static async getDashboard(req, res) {
    try {
      const [walletRes, pickupRes] = await Promise.all([
        callShiprocketApi('GET', '/account/details/wallet-balance'),
        callShiprocketApi('GET', '/settings/company/pickup'),
      ]);

      if (walletRes.status >= 400 || pickupRes.status >= 400) {
        const failed = walletRes.status >= 400 ? walletRes : pickupRes;
        return res.status(502).json({ success: false, error: failed.body?.message || 'Shiprocket API request failed' });
      }

      return res.json({
        success: true,
        data: {
          walletBalance: walletRes.body?.data?.balance_amount ?? null,
          pickupLocations: pickupRes.body?.data?.shipping_address || [],
        },
      });
    } catch (err) {
      logger.error('SHIPROCKET_DASHBOARD', 'Failed to load Shiprocket dashboard', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** POST /api/shiprocket/orders/:orderId/ship — create a Shiprocket shipment/AWB for an order */
  static async createShipmentForOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.getById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      if (order.shiprocket?.shipmentId) {
        return res.status(400).json({ success: false, error: 'This order already has a Shiprocket shipment.' });
      }

      const { pickupLocation } = getShiprocketCredentials();
      if (!pickupLocation) {
        return res.status(500).json({ success: false, error: 'SHIPROCKET_PICKUP_LOCATION is not configured in Server/.env.' });
      }

      const addr = order.shippingAddress || {};
      const { first, last } = splitName(order.name);
      const items = Array.isArray(order.items) ? order.items : [];

      const totalWeightKg = items.reduce((sum, it) => sum + ((it.weightGrams || 100) * (it.qty || 1)) / 1000, 0) || 0.1;
      const maxDim = (key, fallback) => items.reduce((max, it) => Math.max(max, it[key] || fallback), fallback);

      const payload = {
        order_id: String(order.id).replace(/[^a-zA-Z0-9-]/g, ''),
        order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: pickupLocation,
        billing_customer_name: first,
        billing_last_name: last,
        billing_address: addr.address || 'N/A',
        billing_city: addr.city || 'N/A',
        billing_pincode: addr.pincode || '',
        billing_state: addr.state || 'N/A',
        billing_country: 'India',
        billing_email: order.email,
        billing_phone: order.phone,
        shipping_is_billing: true,
        order_items: items.map((it) => ({
          name: it.name,
          sku: it.sku || it.name,
          units: it.qty || 1,
          selling_price: it.price || 0,
        })),
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.subtotal || order.total || 0,
        length: maxDim('lengthCm', 10),
        breadth: maxDim('breadthCm', 10),
        height: maxDim('heightCm', 1),
        weight: Number(totalWeightKg.toFixed(2)),
      };

      const result = await callShiprocketApi('POST', '/orders/create/adhoc', payload);
      if (result.status >= 400 || result.body?.status_code === 0 || !result.body?.shipment_id) {
        return res.status(502).json({ success: false, error: result.body?.message || 'Shiprocket rejected the shipment request.' });
      }

      const shiprocketData = {
        orderId: result.body.order_id,
        shipmentId: result.body.shipment_id,
        awbCode: result.body.awb_code || null,
        courierName: result.body.courier_name || null,
        trackingUrl: result.body.shipment_id ? `https://shiprocket.co/tracking/${result.body.awb_code || result.body.shipment_id}` : null,
        currentStatus: 'Shipment created',
        etd: null,
        lastUpdatedAt: new Date().toISOString(),
        timeline: [{
          status: 'Shipment created',
          at: new Date().toISOString(),
          location: pickupLocation,
          note: `Handed to ${result.body.courier_name || 'the courier'} for pickup.`,
        }],
      };

      const updatedOrder = await OrderModel.attachShiprocketInfo(order.id, shiprocketData, 'shipped');
      logger.event('SHIPROCKET', '📦', `Shipment created for order ${order.id} (shipment ${shiprocketData.shipmentId})`);
      return res.json({ success: true, data: updatedOrder });
    } catch (err) {
      logger.error('SHIPROCKET_CREATE_SHIPMENT', `Failed to create shipment for order: ${req.params.orderId}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Fetch live tracking for an order and fold it into the stored order.
   *
   * Shared by the admin route and the customer-facing GET /api/orders/:id/track,
   * so a poll from either side leaves the same record behind — which is what
   * makes tracking survive for a customer whose courier never fires a webhook.
   *
   * Returns the refreshed order, or null when the order has no shipment yet.
   */
  static async refreshTracking(order) {
    if (!order?.shiprocket?.shipmentId) return null;

    const result = await callShiprocketApi('GET', `/courier/track/shipment/${order.shiprocket.shipmentId}`);
    if (result.status >= 400) {
      throw new Error(result.body?.message || 'Shiprocket tracking request failed.');
    }

    const raw = result.body?.[order.shiprocket.shipmentId] || result.body;
    const tracking = normalizeTracking(raw);

    const patch = {
      currentStatus: tracking.currentStatus || order.shiprocket.currentStatus,
      etd: tracking.etd || order.shiprocket.etd,
      awbCode: tracking.awbCode || order.shiprocket.awbCode,
      courierName: tracking.courierName || order.shiprocket.courierName,
      trackingUrl: tracking.trackingUrl || order.shiprocket.trackingUrl,
    };

    // Fold in every scan the courier has reported, not just the newest, so an
    // order first opened after delivery still shows the whole journey.
    const mapped = mapShiprocketStatus(tracking.currentStatus);
    return OrderModel.recordDeliveryUpdate(
      order.id,
      patch,
      tracking.events,
      mapped && mapped !== order.status ? mapped : null
    );
  }

  /** GET /api/shiprocket/orders/:orderId/track — current courier tracking status (admin) */
  static async trackShipment(req, res) {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.getById(orderId);
      if (!order?.shiprocket?.shipmentId) {
        return res.status(404).json({ success: false, error: 'This order has no Shiprocket shipment yet.' });
      }

      const updated = await ShiprocketController.refreshTracking(order);
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('SHIPROCKET_TRACK', `Failed to track shipment for order: ${req.params.orderId}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/webhooks/shiprocket — courier delivery updates, pushed.
   *
   * Public by necessity (Shiprocket calls it), authenticated by the shared
   * token configured alongside the webhook URL in the Shiprocket dashboard and
   * sent back as `x-api-key`. With SHIPROCKET_WEBHOOK_TOKEN unset this FAILS
   * CLOSED rather than trusting any caller — an unconfigured deployment must not
   * let a stranger mark orders delivered.
   *
   * Always answers 200 once authenticated: Shiprocket retries and eventually
   * disables an endpoint that errors, and a payload we cannot parse is our
   * problem, not a reason to make them replay it.
   */
  static async webhook(req, res) {
    const expected = (process.env.SHIPROCKET_WEBHOOK_TOKEN || '').trim();
    if (!expected) {
      logger.warn('SHIPROCKET_WEBHOOK', 'Delivery update received but SHIPROCKET_WEBHOOK_TOKEN is not set — refusing.');
      return res.status(503).json({ success: false, error: 'Webhook not configured' });
    }

    const provided = String(req.get('x-api-key') || '');
    const ok =
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!ok) {
      logger.warn('SHIPROCKET_WEBHOOK', 'Rejected a delivery update with a bad x-api-key.');
      return res.sendStatus(403);
    }

    try {
      const body = req.body || {};
      const awb = body.awb || body.awb_code || null;
      const tracking = normalizeTracking(body);

      // Shiprocket echoes the `order_id` we sent at creation, which is our own id
      // with the punctuation stripped ("#NQ-123456" -> "NQ123456"), so the AWB is
      // the reliable key. Fall back to the channel order id only if there's no AWB.
      const order = awb
        ? await OrderModel.getByAwb(awb)
        : await OrderModel.getById(body.channel_order_id || '');

      if (!order) {
        logger.warn('SHIPROCKET_WEBHOOK', `Delivery update for an unknown shipment (awb=${awb || 'none'}) — ignored.`);
        return res.sendStatus(200);
      }

      const event = {
        status: tracking.currentStatus || 'Update',
        at: body.current_timestamp || body.scan_date || new Date().toISOString(),
        location: body.location || body.current_location || null,
        note: body.activity || body.status_detail || null,
      };

      await OrderModel.recordDeliveryUpdate(
        order.id,
        { currentStatus: tracking.currentStatus, etd: tracking.etd || order.shiprocket?.etd },
        [event],
        mapShiprocketStatus(tracking.currentStatus)
      );

      logger.event('SHIPROCKET_WEBHOOK', '🚚', `Order ${order.id} -> ${event.status}`);
      return res.sendStatus(200);
    } catch (err) {
      logger.error('SHIPROCKET_WEBHOOK', 'Failed to process a delivery update', err);
      return res.sendStatus(200);
    }
  }
}

module.exports = ShiprocketController;
