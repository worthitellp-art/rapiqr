const { supabaseAdmin } = require('../config/db');

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

  /** Persist the Shiprocket shipment result on an order and optionally flip its status */
  static async attachShiprocketInfo(id, shiprocketData, newStatus = null) {
    const payload = { shiprocket: shiprocketData };
    if (newStatus) payload.status = newStatus;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }
}

module.exports = OrderModel;
