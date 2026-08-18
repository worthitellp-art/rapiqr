const { supabaseAdmin } = require('../config/db');

const SELECT = 'id, category, label, phone, active, created_at';

class HelplineModel {
  /**
   * Admin management view — every helpline regardless of active state.
   */
  static async getAll() {
    try {
      const { data, error } = await supabaseAdmin
        .from('communication')
        .select(SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('HelplineModel.getAll Error:', err);
      return [];
    }
  }

  /**
   * Public scan-page view — active helplines only, optionally filtered by category.
   */
  static async getActive(category) {
    try {
      let query = supabaseAdmin.from('communication').select(SELECT).eq('active', true);
      if (category) query = query.eq('category', category);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('HelplineModel.getActive Error:', err);
      return [];
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('communication')
        .select(SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`HelplineModel.getById (${id}) Error:`, err);
      return null;
    }
  }

  static async create({ category, label, phone, active = true }) {
    const { data, error } = await supabaseAdmin
      .from('communication')
      .insert({ category, label, phone, active })
      .select(SELECT)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const payload = {};
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.active !== undefined) payload.active = updates.active;

    const { data, error } = await supabaseAdmin
      .from('communication')
      .update(payload)
      .eq('id', id)
      .select(SELECT)
      .single();

    if (error) throw error;
    return data;
  }

  static async remove(id) {
    const { error } = await supabaseAdmin.from('communication').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = HelplineModel;
