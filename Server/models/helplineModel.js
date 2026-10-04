const Communication = require('./schemas/Communication');
const { logger } = require('../middleware/loggerMiddleware');

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
    country: doc.country || null,
    address: doc.address || null,
    area: doc.area || null,
    state: doc.state || null,
    pincode: doc.pincode || null,
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    notes: doc.notes || null,
    whatsapp: doc.whatsapp || null,
    years_experience: doc.years_experience || null,
    radius_km: doc.radius_km ?? null,
    service_areas: Array.isArray(doc.service_areas) ? doc.service_areas : [],
    availability: doc.availability || null,
    created_at: doc.created_at,
  };
}

/**
 * What the unauthenticated scan page needs to dial a provider — nothing more.
 * Email, notes, experience, street address and coordinates stay admin-only.
 */
function toPublicApi(full) {
  const { id, category, label, phone, active, service_type, categories, city, country, whatsapp, radius_km, availability } = full;
  return { id, category, label, phone, active, service_type, categories, city, country, whatsapp, radius_km, availability };
}

/** Trims client-supplied coordinates to a real number or null. */
const toCoord = (value, limit) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};
const toText = (value, max = 200) => (value ? String(value).trim().slice(0, max) || null : null);

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
      logger.error('DB_HELPLINE', 'HelplineModel.getAll failed', err);
      return [];
    }
  }

  /**
   * Public scan-page view — active providers only.
   *
   * @param {string|object} filter Legacy category string, or
   *   `{ category, serviceType, stickerCategory, city }`. `stickerCategory` keeps only
   *   providers scoped to that sticker category (or scoped to none at all).
   *   `city` keeps only providers scoped to that city (case-insensitive),
   *   plus every provider with no city set (available everywhere).
   */
  static async getActive(filter) {
    const { category, serviceType, stickerCategory, city } =
      typeof filter === 'string' || filter == null ? { category: filter } : filter;

    try {
      // category arrives from req.query on the PUBLIC route, which Express
      // parses with bracket-notation support (?category[$ne]=x becomes
      // {$ne: 'x'}) — cast to a plain string before it can reach the filter.
      const query = { active: true };
      if (category) query.category = String(category);
      if (serviceType) query.service_type = slugify(serviceType);

      const cityNeedle = city ? String(city).trim().toLowerCase() : null;

      const docs = await Communication.find(query).sort({ created_at: -1 }).lean();
      return docs.map(toApi).filter((row) => {
        // No categories set = available to every sticker category.
        if (stickerCategory && row.categories.length > 0 && !row.categories.includes(stickerCategory)) return false;
        // No city set = available in every city. A city-scoped provider only
        // shows to visitors whose (reverse-geocoded) city matches it.
        if (cityNeedle && row.city && row.city.trim().toLowerCase() !== cityNeedle) return false;
        return true;
      }).map(toPublicApi);
    } catch (err) {
      console.error('HelplineModel.getActive Error:', err);
      logger.error('DB_HELPLINE', 'HelplineModel.getActive failed', err);
      return [];
    }
  }

  static async getById(id) {
    try {
      const doc = await Communication.findById(id).lean();
      return toApi(doc);
    } catch (err) {
      console.error(`HelplineModel.getById (${id}) Error:`, err);
      logger.error('DB_HELPLINE', `HelplineModel.getById failed (${id})`, err);
      return null;
    }
  }

  static async create({ category, serviceType, categories, label, phone, active = true, email, city, country, address, area, state, pincode, latitude, longitude, notes, whatsapp, yearsExperience, radiusKm, serviceAreas, availability }) {
    const doc = await Communication.create({
      category,
      label,
      phone,
      active,
      service_type: slugify(serviceType || category),
      categories: Array.isArray(categories) ? categories : [],
      email: email || null,
      city: city || null,
      country: country || null,
      address: toText(address, 300),
      area: toText(area),
      state: toText(state),
      pincode: toText(pincode, 12),
      latitude: toCoord(latitude, 90),
      longitude: toCoord(longitude, 180),
      notes: notes || null,
      whatsapp: whatsapp || null,
      years_experience: yearsExperience || null,
      radius_km: typeof radiusKm === 'number' ? radiusKm : null,
      service_areas: Array.isArray(serviceAreas)
        ? serviceAreas.filter((a) => a && a.name).map((a) => ({ name: String(a.name), radius_km: Number(a.radiusKm) || null }))
        : [],
      availability: availability || null,
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
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.address !== undefined) payload.address = toText(updates.address, 300);
    if (updates.area !== undefined) payload.area = toText(updates.area);
    if (updates.state !== undefined) payload.state = toText(updates.state);
    if (updates.pincode !== undefined) payload.pincode = toText(updates.pincode, 12);
    if (updates.latitude !== undefined) payload.latitude = toCoord(updates.latitude, 90);
    if (updates.longitude !== undefined) payload.longitude = toCoord(updates.longitude, 180);
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
    if (updates.yearsExperience !== undefined) payload.years_experience = updates.yearsExperience;
    if (updates.radiusKm !== undefined) payload.radius_km = updates.radiusKm;
    if (updates.serviceAreas !== undefined) {
      payload.service_areas = Array.isArray(updates.serviceAreas)
        ? updates.serviceAreas.filter((a) => a && a.name).map((a) => ({ name: String(a.name), radius_km: Number(a.radiusKm) || null }))
        : [];
    }
    if (updates.availability !== undefined) payload.availability = updates.availability;

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
