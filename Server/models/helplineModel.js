const Communication = require('./schemas/Communication');

/** "Flat Tire" -> "flat_tire", so legacy rows still match a serviceType lookup. */
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function toApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    category: doc.category,
    label: doc.label,
    phone: doc.phone,
    active: doc.active,
    service_type: doc.service_type || slugify(doc.category),
    // An empty list means "every sticker category", never an accidental "matches nothing".
    categories: Array.isArray(doc.categories) ? doc.categories : [],
    email: doc.email || null,
    city: doc.city || null,
    notes: doc.notes || null,
    created_at: doc.created_at,
  };
}

class HelplineModel {
  /**
   * Admin management view — every provider regardless of active state.
   */
  static async getAll() {
    try {
      const docs = await Communication.find().sort({ created_at: -1 }).lean();
      return docs.map(toApi);
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
      // category arrives from req.query on the PUBLIC route, which Express
      // parses with bracket-notation support (?category[$ne]=x becomes
      // {$ne: 'x'}) — cast to a plain string before it can reach the filter.
      const query = { active: true };
      if (category) query.category = String(category);
      if (serviceType) query.service_type = slugify(serviceType);

      const docs = await Communication.find(query).sort({ created_at: -1 }).lean();
      return docs.map(toApi).filter((row) => {
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
      const doc = await Communication.findById(id).lean();
      return toApi(doc);
    } catch (err) {
      console.error(`HelplineModel.getById (${id}) Error:`, err);
      return null;
    }
  }

  static async create({ category, serviceType, categories, label, phone, active = true, email, city, notes }) {
    const doc = await Communication.create({
      category,
      label,
      phone,
      active,
      service_type: slugify(serviceType || category),
      categories: Array.isArray(categories) ? categories : [],
      email: email || null,
      city: city || null,
      notes: notes || null,
    });
    return toApi(doc);
  }

  static async update(id, updates) {
    const payload = {};
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.serviceType !== undefined) payload.service_type = slugify(updates.serviceType);
    if (updates.categories !== undefined) payload.categories = Array.isArray(updates.categories) ? updates.categories : [];
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const doc = await Communication.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    return toApi(doc);
  }

  static async remove(id) {
    await Communication.findByIdAndDelete(id);
    return true;
  }
}

module.exports = HelplineModel;
module.exports.slugify = slugify;
