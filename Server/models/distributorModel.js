const { supabaseAdmin } = require('../config/db');

function toApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    phone: row.phone,
    city: row.city,
    business: row.business,
    tier: row.tier,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

class DistributorModel {
  static async getAll() {
    const { data, error } = await supabaseAdmin
      .from('distributor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toApi);
  }

  static async getByUser(emailOrPhone) {
    if (!emailOrPhone) return null;
    const { data, error } = await supabaseAdmin
      .from('distributor_applications')
      .select('*')
      .or(`user_email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return toApi(data);
  }

  static async create(appData) {
    const existing = await this.getByUser(appData.userEmail);
    if (existing) return existing;

    const id = 'DIST-' + Date.now().toString().slice(-6);
    const payload = {
      id,
      user_id: appData.userId || null,
      user_name: appData.userName,
      user_email: appData.userEmail,
      phone: appData.phone,
      city: appData.city,
      business: appData.business,
      tier: appData.tier,
      status: 'pending',
    };

    const { data, error } = await supabaseAdmin
      .from('distributor_applications')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  static async updateStatus(appId, status, notes) {
    const payload = {
      status,
      notes: notes || null,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabaseAdmin
      .from('distributor_applications')
      .update(payload)
      .eq('id', appId)
      .select()
      .single();

    if (error) throw error;

    // Approval grants the real distributor role on the account (task.md #17) —
    // not just a status flag on the application row.
    if (status === 'approved' && data.user_id) {
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'distributor' })
        .eq('id', data.user_id);
      if (roleError) throw roleError;
    }

    return toApi(data);
  }
}

module.exports = DistributorModel;
