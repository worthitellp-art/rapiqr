const { supabaseAdmin } = require('../config/db');

/* `service_type` and `categories` arrive with Server/sql/service_providers.sql.
   Until that migration is run the columns don't exist, so every select is tried
   with them once and then permanently downgraded to the legacy column set —
   same "degrade, don't crash" posture as MessageModel. */
const SELECT = 'id, category, service_type, categories, label, phone, active, created_at';
const LEGACY_SELECT = 'id, category, label, phone, active, created_at';

let hasServiceColumns = true;

function isMissingColumnError(error) {
  if (!error) return false;
  // Postgres 42703 = undefined_column; PostgREST surfaces it verbatim.
  return error.code === '42703' || /column .* does not exist/i.test(error.message || '');
}

/** "Flat Tire" -> "flat_tire", so legacy rows still match a serviceType lookup. */
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Fill in what the migration would have stored, so callers see one shape either way. */
function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    service_type: row.service_type || slugify(row.category),
    // An empty list means "every sticker category", which is what pre-migration
    // rows are — never an accidental "matches nothing".
    categories: Array.isArray(row.categories) ? row.categories : [],
  };
}

/** Runs `build(select)` with the new columns, retrying on the legacy set once. */
async function selectWithFallback(build) {
  if (hasServiceColumns) {
    const { data, error } = await build(SELECT);
    if (!error) return (data || []).map(normalize);
    if (!isMissingColumnError(error)) throw error;
    console.warn('HelplineModel: service_type/categories columns missing — run Server/sql/service_providers.sql. Falling back to legacy columns.');
    hasServiceColumns = false;
  }

  const { data, error } = await build(LEGACY_SELECT);
  if (error) throw error;
  return (data || []).map(normalize);
}

class HelplineModel {
  /**
   * Admin management view — every provider regardless of active state.
   */
  static async getAll() {
    try {
      return await selectWithFallback((select) =>
        supabaseAdmin.from('communication').select(select).order('created_at', { ascending: false })
      );
    } catch (err) {
      console.error('HelplineModel.getAll Error:', err);
      return [];
    }
  }

  /**
   * Public scan-page view — active providers only.
   *
   * @param {string|object} filter Legacy category string, or
   *   `{ category, serviceType, stickerCategory }`. `stickerCategory` keeps only
   *   providers scoped to that sticker category (or scoped to none at all).
   */
  static async getActive(filter) {
    const { category, serviceType, stickerCategory } =
      typeof filter === 'string' || filter == null ? { category: filter } : filter;

    try {
      const rows = await selectWithFallback((select) => {
        let query = supabaseAdmin.from('communication').select(select).eq('active', true);
        if (category) query = query.eq('category', category);
        return query.order('created_at', { ascending: false });
      });

      return rows.filter((row) => {
        if (serviceType && row.service_type !== slugify(serviceType)) return false;
        // No categories set = available to every sticker category.
        if (stickerCategory && row.categories.length > 0 && !row.categories.includes(stickerCategory)) return false;
        return true;
      });
    } catch (err) {
      console.error('HelplineModel.getActive Error:', err);
      return [];
    }
  }

  static async getById(id) {
    try {
      const rows = await selectWithFallback((select) =>
        supabaseAdmin.from('communication').select(select).eq('id', id).limit(1)
      );
      return rows[0] || null;
    } catch (err) {
      console.error(`HelplineModel.getById (${id}) Error:`, err);
      return null;
    }
  }

  static async create({ category, serviceType, categories, label, phone, active = true }) {
    const payload = { category, label, phone, active };
    if (hasServiceColumns) {
      payload.service_type = slugify(serviceType || category);
      payload.categories = Array.isArray(categories) ? categories : [];
    }

    const { data, error } = await supabaseAdmin
      .from('communication')
      .insert(payload)
      .select(hasServiceColumns ? SELECT : LEGACY_SELECT)
      .single();

    if (error) {
      if (!isMissingColumnError(error)) throw error;
      hasServiceColumns = false;
      return HelplineModel.create({ category, serviceType, categories, label, phone, active });
    }
    return normalize(data);
  }

  static async update(id, updates) {
    const payload = {};
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.active !== undefined) payload.active = updates.active;
    if (hasServiceColumns) {
      if (updates.serviceType !== undefined) payload.service_type = slugify(updates.serviceType);
      if (updates.categories !== undefined) payload.categories = Array.isArray(updates.categories) ? updates.categories : [];
    }

    const { data, error } = await supabaseAdmin
      .from('communication')
      .update(payload)
      .eq('id', id)
      .select(hasServiceColumns ? SELECT : LEGACY_SELECT)
      .single();

    if (error) {
      if (!isMissingColumnError(error)) throw error;
      hasServiceColumns = false;
      return HelplineModel.update(id, updates);
    }
    return normalize(data);
  }

  static async remove(id) {
    const { error } = await supabaseAdmin.from('communication').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = HelplineModel;
module.exports.slugify = slugify;
