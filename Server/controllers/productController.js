const ProductModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Loads the product and verifies the authenticated user owns it (or is admin).
 * Returns the product on success, or null after writing the error response.
 */
async function loadOwnedProduct(req, res) {
  const { id } = req.params;
  const product = await ProductModel.getById(id);
  if (!product) {
    res.status(404).json({ success: false, error: 'Sticker not found' });
    return null;
  }
  const isOwner = product.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    res.status(403).json({ success: false, error: 'You do not have access to this sticker' });
    return null;
  }
  return product;
}

class ProductController {
  /**
   * Auto-links any unclaimed sticker whose registered owner phone matches this
   * account's phone number, then returns the user's full product list. No
   * activation code needed — a sticker's owner phone (set during scan-page
   * activation) is the only thing that connects it to a dashboard account.
   */
  static async getMyProducts(req, res) {
    try {
      const profile = await UserModel.findById(req.user.id);
      if (profile?.phone_number) {
        try {
          const claimed = await ProductModel.autoClaimByPhone(req.user.id, profile.full_name, profile.phone_number);
          if (claimed.length > 0) {
            logger.rowUpdated('products', 'auto-claim', { userId: req.user.id, count: claimed.length });
          }
        } catch (err) {
          logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products by phone', err);
        }
      }

      const data = await ProductModel.getAllByUser(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('PRODUCT_LIST', 'Failed to fetch user products', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      return res.json({ success: true, data: product });
    } catch (err) {
      logger.error('PRODUCT_FETCH', `Failed to fetch product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateDetails(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const updated = await ProductModel.updateDetails(product.id, req.body || {});
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to update sticker details' });
      logger.rowUpdated('products', product.id, { action: 'details_updated' });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRODUCT_UPDATE', `Failed to update product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateContacts(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const { contacts } = req.body || {};
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ success: false, error: 'contacts must be an array of { name, phone }' });
      }
      const cleaned = contacts
        .filter(c => c && (c.name || c.phone))
        .map(c => ({ name: String(c.name || '').trim(), phone: String(c.phone || '').trim() }));

      const updated = await ProductModel.updateContacts(product.id, cleaned);
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to update emergency contacts' });
      logger.rowUpdated('products', product.id, { action: 'contacts_updated', count: cleaned.length });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRODUCT_CONTACTS_UPDATE', `Failed to update contacts: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deactivate(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const updated = await ProductModel.setStatus(product.id, 'inactive');
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to deactivate sticker' });
      logger.rowUpdated('products', product.id, { action: 'deactivated' });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRODUCT_DEACTIVATE', `Failed to deactivate product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reactivate(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const updated = await ProductModel.setStatus(product.id, 'active');
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to reactivate sticker' });
      logger.rowUpdated('products', product.id, { action: 'reactivated' });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRODUCT_REACTIVATE', `Failed to reactivate product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async transfer(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;

      const { targetEmail } = req.body || {};
      if (!targetEmail || !targetEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid targetEmail is required' });
      }
      if (targetEmail.toLowerCase() === (req.user.email || '').toLowerCase()) {
        return res.status(400).json({ success: false, error: 'Sticker is already owned by this account' });
      }

      const targetProfile = await UserModel.findByEmail(targetEmail);
      if (!targetProfile) {
        return res.status(404).json({ success: false, error: 'No RapiQR account found for that email. The recipient must sign up first.' });
      }

      const updated = await ProductModel.transfer(product.id, targetProfile.id, targetProfile.full_name);
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to transfer sticker' });
      logger.rowUpdated('products', product.id, { action: 'transferred', toUserId: targetProfile.id });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRODUCT_TRANSFER', `Failed to transfer product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async remove(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const ok = await ProductModel.remove(product.id);
      if (!ok) return res.status(500).json({ success: false, error: 'Failed to delete sticker' });
      logger.rowDeleted('products', product.id);
      return res.json({ success: true });
    } catch (err) {
      logger.error('PRODUCT_DELETE', `Failed to delete product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getHistory(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const data = await ProductModel.getHistory(product.id);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('PRODUCT_HISTORY', `Failed to fetch history: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = ProductController;
