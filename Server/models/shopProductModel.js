const { supabaseAdmin } = require('../config/db');

function toApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    badge: row.badge,
    description: row.description,
    features: row.features || [],
    price: row.price,
    mrp: row.mrp,
    imageUrl: row.image_url,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    sku: row.sku,
    weightGrams: row.weight_grams,
    lengthCm: row.length_cm,
    breadthCm: row.breadth_cm,
    heightCm: row.height_cm,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  return row;
}

class ShopProductModel {
  /** Public storefront listing — active products only, in display order */
  static async getAllActive() {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(toApi);
  }

  /** Admin listing — every product, active or not */
  static async getAllAdmin() {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(toApi);
  }

  static async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return toApi(data);
  }

  static async create(product) {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .insert(toRow(product))
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .update(toRow(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toApi(data);
  }

  static async remove(id) {
    const { error } = await supabaseAdmin
      .from('shop_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = ShopProductModel;
