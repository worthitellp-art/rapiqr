const { supabaseAdmin } = require('../config/db');

/**
 * PostgREST answers a write against a column the table doesn't have with
 * PGRST204 and a message no one can act on. `shiprocket` is exactly that column
 * until Server/sql/orders_fulfillment.sql is run, so translate it into the
 * instruction that actually fixes it.
 */
function rethrowWithMigrationHint(error) {
  // PGRST204 comes back from a write ("column not found in schema cache"),
  // 42703 from a read ("column orders.shiprocket does not exist").
  const missingColumn = error?.code === 'PGRST204' || error?.code === '42703';
  if (missingColumn && /shiprocket/i.test(error.message || '')) {
    const err = new Error(
      'The orders table has no `shiprocket` column yet — run Server/sql/orders_fulfillment.sql in the Supabase SQL editor, then retry.'
    );
    err.code = 'MISSING_MIGRATION';
    throw err;
  }
  throw error;
}

function toApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    items: row.items,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    paymentMethod: row.payment_method,
    deliveryMethod: row.delivery_method,
    status: row.status,
    shippingAddress: row.shipping_address,
    shiprocket: row.shiprocket || null,
    payment: row.payment || null,
    createdAt: row.created_at,
  };
}

class OrderModel {
  static async create(order) {
    const id = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
    const payload = {
      id,
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
    };

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  static async getAllByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toApi);
  }

  static async getAll(limit = 500) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toApi);
  }

  static async updateStatus(id, status) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  static async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return toApi(data);
  }

  /** Persist the Razorpay order/payment result on an order (see paymentController) */
  static async attachPaymentInfo(id, paymentData) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ payment: paymentData })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  /** Reverse lookup for the Razorpay webhook, which only knows Razorpay's own ids. */
  static async getByRazorpayOrderId(razorpayOrderId) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment->>razorpayOrderId', razorpayOrderId)
      .maybeSingle();

    if (error) throw error;
    return toApi(data);
  }

  /** Reverse lookup for the Shiprocket webhook, which is keyed by AWB. */
  static async getByAwb(awbCode) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('shiprocket->>awbCode', awbCode)
      .maybeSingle();

    if (error) rethrowWithMigrationHint(error);
    return toApi(data);
  }

  /** Persist the Shiprocket shipment result on an order and optionally flip its status */
  static async attachShiprocketInfo(id, shiprocketData, newStatus = null) {
    const payload = { shiprocket: shiprocketData };
    if (newStatus) payload.status = newStatus;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) rethrowWithMigrationHint(error);
    return toApi(data);
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
   * read-modify-write round-trips racing each other over one JSON column.
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
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async deleteAll() {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .not('id', 'is', null);

    if (error) throw error;
    return true;
  }
}

module.exports = OrderModel;
