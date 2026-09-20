const OrderModel = require('../models/orderModel');
const ShiprocketController = require('./shiprocketController');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Server-authoritative catalog prices.
 * Prevents client-side price tampering at checkout.
 */
const CATALOG_PRICES = {
  'car-qr': 299,
  'home-qr': 349,
  'child-qr': 249,
  'travel-qr': 299,
};

const EXPRESS_DELIVERY_FEE = 99;
const STANDARD_DELIVERY_FEE = 0;

/**
 * Validates cart items and calculates canonical subtotal using server catalog.
 */
function computeCanonicalOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let computedSubtotal = 0;
  const verifiedItems = rawItems.map((rawItem, index) => {
    const productId = String(rawItem.product?.id || rawItem.id || `custom-item-${index}`).trim();
    const name = String(rawItem.product?.name || rawItem.name || 'Safety Tag').trim();
    const rawQty = Number(rawItem.qty || rawItem.quantity || 1);
    const qty = Number.isInteger(rawQty) && rawQty >= 1 ? Math.min(rawQty, 100) : 1;

    // Use catalog price if known product; fallback to positive declared price if valid
    const catalogPrice = CATALOG_PRICES[productId];
    const declaredPrice = Number(rawItem.product?.price ?? rawItem.price ?? 0);
    const unitPrice = catalogPrice !== undefined ? catalogPrice : (Number.isFinite(declaredPrice) && declaredPrice > 0 ? declaredPrice : 299);

    const lineTotal = unitPrice * qty;
    computedSubtotal += lineTotal;

    return {
      id: productId,
      name,
      price: unitPrice,
      qty,
      img: rawItem.product?.img || rawItem.img || '',
      category: rawItem.product?.category || rawItem.category || 'Safety',
    };
  });

  return { verifiedItems, computedSubtotal };
}

/**
 * Verifies whether the request caller is authorized to view this order.
 * Authorized if: Admin, or authenticated owner, or matching guest email/phone proof.
 */
function isCallerAuthorizedToTrack(order, caller, verificationContact) {
  if (caller?.role === 'admin') return true;
  if (caller?.id && order.userId && String(caller.id) === String(order.userId)) return true;

  if (!verificationContact || typeof verificationContact !== 'string') return false;

  const normalizedInput = verificationContact.trim().toLowerCase();
  const inputDigits = normalizedInput.replace(/\D/g, '');

  const orderEmail = (order.email || '').trim().toLowerCase();
  const orderPhoneDigits = (order.phone || '').replace(/\D/g, '');

  // Exact email match
  if (orderEmail && normalizedInput === orderEmail) return true;

  // Phone match on trailing 10 digits
  if (inputDigits.length >= 10 && orderPhoneDigits.length >= 10) {
    return orderPhoneDigits.slice(-10) === inputDigits.slice(-10);
  }

  return false;
}

/**
 * Masks contact and address details to prevent IDOR data leaks.
 */
function sanitizeOrderDetailsForPublicTracking(order) {
  const email = order.email || '';
  const phone = order.phone || '';
  const shipping = order.shippingAddress || {};

  const maskedEmail = email.includes('@')
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}***${domain}`)
    : '***';

  const cleanDigits = phone.replace(/\D/g, '');
  const maskedPhone = cleanDigits.length >= 4
    ? `******${cleanDigits.slice(-4)}`
    : '******';

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.payment?.status || 'created',
    total: order.total,
    items: (order.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    maskedBuyer: {
      firstName: (order.name || 'Customer').split(' ')[0],
      email: maskedEmail,
      phone: maskedPhone,
      city: shipping.city || '',
      state: shipping.state || '',
      pincode: shipping.pincode || '',
    },
    shiprocket: order.shiprocket || null,
  };
}

class OrderController {
  /** POST /api/orders — Secure order placement with server-authoritative pricing */
  static async create(req, res) {
    try {
      const { name, email, phone, items, paymentMethod, deliveryMethod, shippingAddress } = req.body || {};

      if (!name || !email || !phone) {
        return res.status(400).json({ success: false, error: 'Name, email, and phone number are required.' });
      }

      const cleanName = String(name).trim();
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPhone = String(phone).trim();

      if (cleanName.length < 2) {
        return res.status(400).json({ success: false, error: 'Please provide a valid full name.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      }
      if (cleanPhone.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ success: false, error: 'Please provide a valid phone number.' });
      }

      // Compute pricing server-side to prevent price tampering
      const { verifiedItems, computedSubtotal } = computeCanonicalOrderItems(items);
      const isExpress = deliveryMethod === 'express';
      const verifiedDeliveryFee = isExpress ? EXPRESS_DELIVERY_FEE : STANDARD_DELIVERY_FEE;
      const verifiedTotal = computedSubtotal + verifiedDeliveryFee;

      const order = await OrderModel.create({
        userId: req.user?.id || null,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        items: verifiedItems,
        subtotal: computedSubtotal,
        deliveryFee: verifiedDeliveryFee,
        total: verifiedTotal,
        paymentMethod: paymentMethod || 'upi',
        deliveryMethod: isExpress ? 'express' : 'standard',
        shippingAddress: shippingAddress || null,
      });

      logger.event('ORDER', '🛒', `Order ${order.id} placed by ${cleanEmail} (₹${order.total})`);
      return res.json({ success: true, data: order });
    } catch (err) {
      logger.error('ORDER_CREATE', 'Failed to save order', err);
      return res.status(500).json({ success: false, error: err.message || 'Order creation failed' });
    }
  }

  /** GET /api/orders/mine — the logged-in user's own order history */
  static async mine(req, res) {
    try {
      const UserModel = require('../models/userModel');
      const profile = await UserModel.ensureProfile(req.user.id);
      const ordersByUser = await OrderModel.getAllByUser(req.user.id);
      const allOrders = [...ordersByUser];
      const seenIds = new Set(allOrders.map((o) => String(o.id)));

      if (profile?.email) {
        const emailOrders = await OrderModel.getAllByEmail(profile.email);
        for (const o of emailOrders) {
          if (!seenIds.has(String(o.id))) {
            allOrders.push(o);
            seenIds.add(String(o.id));
          }
        }
      }

      if (profile?.phone_number) {
        const phoneOrders = await OrderModel.getAllByPhone(profile.phone_number);
        for (const o of phoneOrders) {
          if (!seenIds.has(String(o.id))) {
            allOrders.push(o);
            seenIds.add(String(o.id));
          }
        }
      }

      return res.json({ success: true, data: allOrders });
    } catch (err) {
      logger.error('ORDER_MINE', 'Failed to list user orders', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/orders/:id/track — Secure buyer tracking endpoint.
   * Accessible by logged-in order owner, admin, or guest providing verification phone/email.
   */
  static async track(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getById(id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const verificationContact = req.query.contact || req.query.phone || req.query.email || req.body?.contact;
      const isAuthorized = isCallerAuthorizedToTrack(order, req.user, verificationContact);

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'Verification required. Please provide the phone number or email used during order placement to view tracking.',
        });
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
        data: sanitizeOrderDetailsForPublicTracking(current),
      });
    } catch (err) {
      logger.error('ORDER_TRACK', `Failed to track order: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/orders/track — Dedicated lookup endpoint by Order ID + Contact (Phone or Email).
   */
  static async trackByLookup(req, res) {
    try {
      const { orderId, contact } = req.body || {};
      if (!orderId || !contact) {
        return res.status(400).json({
          success: false,
          error: 'Order ID and contact (phone number or email) are required.',
        });
      }

      let cleanOrderId = String(orderId).trim();
      if (!cleanOrderId.startsWith('#') && /^\d+$/.test(cleanOrderId)) {
        cleanOrderId = `#NQ-${cleanOrderId}`;
      } else if (!cleanOrderId.startsWith('#') && /^NQ-\d+$/i.test(cleanOrderId)) {
        cleanOrderId = `#${cleanOrderId.toUpperCase()}`;
      }

      const order = await OrderModel.getById(cleanOrderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'No order found with the provided Order ID.' });
      }

      const isAuthorized = isCallerAuthorizedToTrack(order, req.user, contact);
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'Verification failed. The phone or email does not match this order.',
        });
      }

      let current = order;
      if (order.shiprocket?.shipmentId) {
        try {
          current = (await ShiprocketController.refreshTracking(order)) || order;
        } catch (err) {
          logger.warn('ORDER_TRACK_LOOKUP', `Live tracking refresh failed for ${cleanOrderId}: ${err.message}`);
        }
      }

      return res.json({
        success: true,
        data: sanitizeOrderDetailsForPublicTracking(current),
      });
    } catch (err) {
      logger.error('ORDER_TRACK_LOOKUP', 'Failed to lookup order tracking', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/orders/track-by-phone — phone-only lookup, no Order ID needed.
   * A phone can have several orders, so this returns every match (newest
   * first) rather than a single one; each is masked the same way the
   * Order-ID+contact lookup already is.
   */
  static async trackByPhone(req, res) {
    try {
      const { phone } = req.body || {};
      const digits = String(phone || '').replace(/\D/g, '');
      if (digits.length < 10) {
        return res.status(400).json({ success: false, error: 'Enter a valid 10-digit phone number.' });
      }

      const orders = await OrderModel.getAllByPhone(phone);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, error: 'No orders found for this phone number.' });
      }

      const refreshed = await Promise.all(
        orders.map(async (order) => {
          if (order.shiprocket?.shipmentId) {
            try {
              return (await ShiprocketController.refreshTracking(order)) || order;
            } catch (err) {
              logger.warn('ORDER_TRACK_BY_PHONE', `Live tracking refresh failed for ${order.id}: ${err.message}`);
              return order;
            }
          }
          return order;
        })
      );

      return res.json({ success: true, data: refreshed.map(sanitizeOrderDetailsForPublicTracking) });
    } catch (err) {
      logger.error('ORDER_TRACK_BY_PHONE', 'Failed to lookup orders by phone', err);
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
