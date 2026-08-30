const ShopProduct = require('./schemas/ShopProduct');

function toApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    category: doc.category,
    badge: doc.badge,
    description: doc.description,
    features: doc.features || [],
    price: doc.price,
    mrp: doc.mrp,
    imageUrl: doc.image_url,
    rating: doc.rating,
    reviewsCount: doc.reviews_count,
    sku: doc.sku,
    weightGrams: doc.weight_grams,
    lengthCm: doc.length_cm,
    breadthCm: doc.breadth_cm,
    heightCm: doc.height_cm,
    isActive: doc.is_active,
    sortOrder: doc.sort_order,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

function toRow(product) {
  const row = {};
  if (product.name !== undefined) row.name = product.name;
  if (product.category !== undefined) row.category = product.category;
  if (product.badge !== undefined) row.badge = product.badge;
  if (product.description !== undefined) row.description = product.description;
  if (product.features !== undefined) row.features = product.features;
  if (product.price !== undefined) row.price = product.price;
  if (product.mrp !== undefined) row.mrp = product.mrp;
  if (product.imageUrl !== undefined) row.image_url = product.imageUrl;
  if (product.rating !== undefined) row.rating = product.rating;
  if (product.reviewsCount !== undefined) row.reviews_count = product.reviewsCount;
  if (product.sku !== undefined) row.sku = product.sku;
  if (product.weightGrams !== undefined) row.weight_grams = product.weightGrams;
  if (product.lengthCm !== undefined) row.length_cm = product.lengthCm;
  if (product.breadthCm !== undefined) row.breadth_cm = product.breadthCm;
  if (product.heightCm !== undefined) row.height_cm = product.heightCm;
  if (product.isActive !== undefined) row.is_active = product.isActive;
  if (product.sortOrder !== undefined) row.sort_order = product.sortOrder;
  row.updated_at = new Date();
  return row;
}

class ShopProductModel {
  /** Public storefront listing — active products only, in display order */
  static async getAllActive() {
    const docs = await ShopProduct.find({ is_active: true }).sort({ sort_order: 1 }).lean();
    return docs.map(toApi);
  }

  /** Admin listing — every product, active or not */
  static async getAllAdmin() {
    const docs = await ShopProduct.find().sort({ sort_order: 1 }).lean();
    return docs.map(toApi);
  }

  static async getById(id) {
    const doc = await ShopProduct.findById(id).lean();
    return toApi(doc);
  }

  static async create(product) {
    const doc = await ShopProduct.create(toRow(product));
    return toApi(doc);
  }

  static async update(id, updates) {
    const doc = await ShopProduct.findByIdAndUpdate(id, { $set: toRow(updates) }, { new: true }).lean();
    return toApi(doc);
  }

  static async remove(id) {
    await ShopProduct.findByIdAndDelete(id);
    return true;
  }
}

module.exports = ShopProductModel;
