const ShopProductModel = require('../models/shopProductModel');
const { logger } = require('../middleware/loggerMiddleware');

class ShopProductController {
  /** GET /api/shop-products — public storefront catalog (active only) */
  static async listPublic(req, res) {
    try {
      const data = await ShopProductModel.getAllActive();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('SHOP_PRODUCT_LIST', 'Failed to list active shop products', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/shop-products/admin — admin catalog management (all products) */
  static async listAdmin(req, res) {
    try {
      const data = await ShopProductModel.getAllAdmin();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('SHOP_PRODUCT_LIST_ADMIN', 'Failed to list shop products for admin', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** POST /api/shop-products — admin: create a product */
  static async create(req, res) {
    try {
      const { name, price } = req.body || {};
      if (!name || price === undefined) {
        return res.status(400).json({ success: false, error: 'name and price are required' });
      }
      const data = await ShopProductModel.create(req.body);
      logger.event('SHOP_PRODUCT', '🆕', `Product "${data.name}" created`);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('SHOP_PRODUCT_CREATE', 'Failed to create shop product', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** PATCH /api/shop-products/:id — admin: update a product */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = await ShopProductModel.update(id, req.body);
      logger.rowUpdated('shop_products', id, { action: 'updated' });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('SHOP_PRODUCT_UPDATE', `Failed to update shop product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** DELETE /api/shop-products/:id — admin: remove a product */
  static async remove(req, res) {
    try {
      const { id } = req.params;
      await ShopProductModel.remove(id);
      logger.event('SHOP_PRODUCT', '🗑️', `Product ${id} deleted`);
      return res.json({ success: true });
    } catch (err) {
      logger.error('SHOP_PRODUCT_DELETE', `Failed to delete shop product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = ShopProductController;
