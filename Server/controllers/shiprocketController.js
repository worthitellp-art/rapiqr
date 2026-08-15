const OrderModel = require('../models/orderModel');
const { getShiprocketCredentials, callShiprocketApi } = require('../services/shiprocketClient');
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
      };

      const updatedOrder = await OrderModel.attachShiprocketInfo(order.id, shiprocketData, 'shipped');
      logger.event('SHIPROCKET', '📦', `Shipment created for order ${order.id} (shipment ${shiprocketData.shipmentId})`);
      return res.json({ success: true, data: updatedOrder });
    } catch (err) {
      logger.error('SHIPROCKET_CREATE_SHIPMENT', `Failed to create shipment for order: ${req.params.orderId}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/shiprocket/orders/:orderId/track — current courier tracking status */
  static async trackShipment(req, res) {
    try {
      const { orderId } = req.params;
      const order = await OrderModel.getById(orderId);
      if (!order?.shiprocket?.shipmentId) {
        return res.status(404).json({ success: false, error: 'This order has no Shiprocket shipment yet.' });
      }

      const result = await callShiprocketApi('GET', `/courier/track/shipment/${order.shiprocket.shipmentId}`);
      if (result.status >= 400) {
        return res.status(502).json({ success: false, error: result.body?.message || 'Shiprocket tracking request failed.' });
      }

      const trackData = result.body?.[order.shiprocket.shipmentId]?.tracking_data || result.body;
      return res.json({ success: true, data: trackData });
    } catch (err) {
      logger.error('SHIPROCKET_TRACK', `Failed to track shipment for order: ${req.params.orderId}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = ShiprocketController;
