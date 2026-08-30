const Order = require('./schemas/Order');

function toApi(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    userId: doc.user_id ? String(doc.user_id) : null,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    items: doc.items,
    subtotal: doc.subtotal,
    deliveryFee: doc.delivery_fee,
    total: doc.total,
    paymentMethod: doc.payment_method,
    deliveryMethod: doc.delivery_method,
    status: doc.status,
    shippingAddress: doc.shipping_address,
    shiprocket: doc.shiprocket || null,
    payment: doc.payment || null,
    createdAt: doc.created_at,
  };
}

class OrderModel {
  static async create(order) {
    const id = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
    const doc = await Order.create({
      _id: id,
      user_id: order.userId || null,
      name: order.name,
      email: order.email,
      phone: order.phone,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      delivery_fee: order.deliveryFee || 0,
      total: order.total || 0,
      payment_method: order.paymentMethod || 'upi',
      delivery_method: order.deliveryMethod || 'standard',
      shipping_address: order.shippingAddress || null,
    });
    return toApi(doc);
  }

  static async getAllByUser(userId) {
    const docs = await Order.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    return docs.map(toApi);
  }

  static async getAll(limit = 500) {
    const docs = await Order.find().sort({ created_at: -1 }).limit(limit).lean();
    return docs.map(toApi);
  }

  static async updateStatus(id, status) {
    if (typeof id !== 'string' && typeof id !== 'number') return null;
    const doc = await Order.findByIdAndUpdate(String(id), { $set: { status } }, { new: true }).lean();
    return toApi(doc);
  }

  // Reached from PUBLIC payment endpoints with a request-body orderId
  // (paymentController.createOrder/verify use optionalAuth, not verifyToken)
  // — without this guard, a body like {"orderId": {"$ne": null}} matches an
  // arbitrary order and leaks its name/email/phone/total to an unauthenticated caller.
  static async getById(id) {
    if (typeof id !== 'string' && typeof id !== 'number') return null;
    const doc = await Order.findById(String(id)).lean();
    return toApi(doc);
  }

  /** Persist the Razorpay order/payment result on an order (see paymentController) */
  static async attachPaymentInfo(id, paymentData) {
    if (typeof id !== 'string' && typeof id !== 'number') return null;
    const update = { payment: paymentData };
    if (paymentData?.razorpayOrderId) update.razorpayOrderId = paymentData.razorpayOrderId;
    const doc = await Order.findByIdAndUpdate(String(id), { $set: update }, { new: true }).lean();
    return toApi(doc);
  }

  /** Reverse lookup for the Razorpay webhook, which only knows Razorpay's own ids. */
  static async getByRazorpayOrderId(razorpayOrderId) {
    if (typeof razorpayOrderId !== 'string' && typeof razorpayOrderId !== 'number') return null;
    const doc = await Order.findOne({ razorpayOrderId: String(razorpayOrderId) }).lean();
    return toApi(doc);
  }

  /** Reverse lookup for the Shiprocket webhook, which is keyed by AWB. */
  static async getByAwb(awbCode) {
    if (typeof awbCode !== 'string' && typeof awbCode !== 'number') return null;
    const doc = await Order.findOne({ awbCode: String(awbCode) }).lean();
    return toApi(doc);
  }

  /** Persist the Shiprocket shipment result on an order and optionally flip its status */
  static async attachShiprocketInfo(id, shiprocketData, newStatus = null) {
    const update = { shiprocket: shiprocketData };
    if (shiprocketData?.awbCode) update.awbCode = shiprocketData.awbCode;
    if (newStatus) update.status = newStatus;
    const doc = await Order.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return toApi(doc);
  }

  /**
   * Record a delivery update against an order: merges `patch` into the stored
   * shiprocket blob and folds `events` into its timeline in one write.
   *
   * The timeline is deduplicated on (status, at) because both sources of an
   * update — the courier webhook and a "refresh tracking" poll — report the same
   * scans, and an order refreshed twice must not grow two copies of every step.
   *
   * Takes the whole batch rather than one event at a time: a poll returns the
   * courier's entire scan history, and writing it row-by-row would mean a dozen
   * read-modify-write round-trips racing each other over one field.
   */
  static async recordDeliveryUpdate(id, patch = {}, events = [], newStatus = null) {
    const order = await OrderModel.getById(id);
    if (!order) return null;

    const existing = order.shiprocket || {};
    const timeline = Array.isArray(existing.timeline) ? [...existing.timeline] : [];

    for (const event of [].concat(events || [])) {
      if (!event?.status) continue;
      const isDuplicate = timeline.some((e) => e.status === event.status && e.at === event.at);
      if (!isDuplicate) timeline.push(event);
    }
    timeline.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));

    const merged = { ...existing, ...patch, timeline, lastUpdatedAt: new Date().toISOString() };
    return OrderModel.attachShiprocketInfo(id, merged, newStatus);
  }

  static async delete(id) {
    await Order.findByIdAndDelete(id);
    return true;
  }

  static async deleteAll() {
    await Order.deleteMany({});
    return true;
  }
}

module.exports = OrderModel;
