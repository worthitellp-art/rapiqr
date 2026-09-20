const ProductModel = require('../models/productModel');
const QrModel = require('../models/qrModel');
const UserModel = require('../models/userModel');
const OrderModel = require('../models/orderModel');
const { logger } = require('../middleware/loggerMiddleware');
const { notifyContactsAdded } = require('../services/notificationService');

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
      // ensureProfile rather than findById: an account whose profiles row was never
      // written would otherwise report no phone here, auto-claim nothing, and show an
      // empty dashboard even though its stickers were sitting there waiting.
      const profile = await UserModel.ensureProfile(req.user.id);

      // ONLY the profile's verified phone number counts. This used to fall back to
      // req.user.phone / user_metadata.phone_number — fields the account holder sets
      // themselves at signup with no verification — so putting somebody else's number
      // in your signup metadata was enough to auto-claim their stickers, routing right
      // around the OTP flow. The admin console reads the whole fleet and never claims.
      const userPhone = req.user.role === 'admin' ? null : profile?.phone_number;

      if (userPhone) {
        try {
          const claimed = await ProductModel.autoClaimByPhone(req.user.id, profile?.full_name, userPhone);
          if (claimed.length > 0) {
            logger.rowUpdated('products', 'auto-claim', { userId: req.user.id, count: claimed.length });
          }
        } catch (err) {
          logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products by phone', err);
        }
      }

      // Also connect any checkout-minted sticker(s) (Order.stickers — see
      // OrderModel.generateStickersForOrder) a newer order paid for with this
      // phone — covers an already-verified user buying another tag: nothing
      // re-verifies their phone on that purchase, so this dashboard load is
      // what picks it up. Requires the ACTUAL verified flag, not just a
      // phone_number being present — that field alone can be typed unverified
      // at signup (see AuthController.signUp), and claiming by order is a
      // stronger, order-proven action than the fuzzy phone-string match above.
      if (userPhone && profile?.metadata?.phone_verified) {
        try {
          const orderStickerIds = await OrderModel.getStickerIdsByPhone(userPhone);
          if (orderStickerIds.length > 0) {
            const claimedByOrder = await ProductModel.claimStickersByIds(req.user.id, profile?.full_name, orderStickerIds);
            if (claimedByOrder.length > 0) {
              logger.rowUpdated('products', 'auto-claim-by-order', { userId: req.user.id, count: claimedByOrder.length });
            }
          }
        } catch (err) {
          logger.error('ORDER_STICKER_CLAIM', 'Failed to claim order-linked stickers on dashboard load', err);
        }
      }

      // Claim any checkout-minted sticker(s) by account user_id
      if (req.user.role !== 'admin' && req.user.id) {
        try {
          const userOrderStickerIds = await OrderModel.getStickerIdsByUserId(req.user.id);
          if (userOrderStickerIds.length > 0) {
            const claimedByUser = await ProductModel.claimStickersByIds(req.user.id, profile?.full_name, userOrderStickerIds);
            if (claimedByUser.length > 0) {
              logger.rowUpdated('products', 'auto-claim-by-order-user', { userId: req.user.id, count: claimedByUser.length });
            }
          }
        } catch (err) {
          logger.error('ORDER_STICKER_CLAIM_USER', 'Failed to claim order-linked stickers by userId', err);
        }
      }

      // Also claim by email — enables users who ordered without a phone or have not yet
      // verified phone to access their stickers directly.
      if (req.user.role !== 'admin' && profile?.email) {
        try {
          const orderStickerIds = await OrderModel.getStickerIdsByEmail(profile.email);
          if (orderStickerIds.length > 0) {
            const claimedByOrder = await ProductModel.claimStickersByIds(req.user.id, profile?.full_name, orderStickerIds);
            if (claimedByOrder.length > 0) {
              logger.rowUpdated('products', 'auto-claim-by-order-email', { userId: req.user.id, count: claimedByOrder.length });
            }
          }
        } catch (err) {
          logger.error('ORDER_STICKER_CLAIM', 'Failed to claim order-linked stickers by email on dashboard load', err);
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
      const status = err?.code === 'DUPLICATE_PHONE' ? 409 : 500;
      return res.status(status).json({ success: false, error: err.message });
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

      const result = await ProductModel.updateContacts(product.id, cleaned);
      if (!result) return res.status(500).json({ success: false, error: 'Failed to update emergency contacts' });
      const { newlyAddedContacts, ...updated } = result;
      logger.rowUpdated('products', product.id, { action: 'contacts_updated', count: cleaned.length });

      // Emergency contacts can be added from anywhere a sticker is managed —
      // not just first-time ScanPage registration — so this WhatsApps the
      // same "you've been added" message from here too (see
      // QrController.activateQrCode for the other trigger point).
      if (Array.isArray(newlyAddedContacts) && newlyAddedContacts.length > 0) {
        notifyContactsAdded({
          contacts: newlyAddedContacts,
          ownerName: updated.name || 'A RapiQR user',
          eventId: product.id,
        }).catch((err) => {
          logger.error('EMERGENCY_CONTACT_NOTIFY', `Failed to notify emergency contacts for ${product.id}`, err);
        });
      }

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

  /**
   * Owner self-service delete. Routed through QrModel.delete (the same
   * soft-delete used by the admin fleet view) rather than a separate
   * wipe-in-place — that used to leave `deleted_at` unset, which silently
   * broke recovery-code restore for anything a client deleted themselves
   * (restoreByRecoveryCode requires deleted_at to be set). Soft-deleting here
   * means a client's own printed recovery code works the same way admin's does.
   */
  static async remove(req, res) {
    try {
      const product = await loadOwnedProduct(req, res);
      if (!product) return;
      const deleted = await QrModel.delete(product.id);
      if (!deleted) return res.status(500).json({ success: false, error: 'Failed to delete sticker' });
      logger.rowDeleted('products', product.id);
      return res.json({ success: true });
    } catch (err) {
      logger.error('PRODUCT_DELETE', `Failed to delete product: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Owner self-service recover — ID only, no recovery code. Deliberately does
   * NOT go through loadOwnedProduct: that helper's lookup filters out
   * soft-deleted rows entirely (there'd be nothing to recover), and it only
   * knows how to say "not found" or "not yours" — not "not yours vs. not
   * currently deleted vs. phone slot taken", which the caller needs to show
   * a useful message. QrModel.restoreOwnedByUser does its own ownership
   * check directly against the (still-deleted) document.
   */
  static async recover(req, res) {
    try {
      const { id } = req.params;
      const result = await QrModel.restoreOwnedByUser(id, req.user.id);
      if (!result.ok) {
        const messages = {
          missing_fields: 'A sticker ID is required.',
          not_found: 'No sticker found with that ID.',
          not_owner: "This sticker isn't linked to your account.",
          not_deleted: 'This sticker is not currently deleted — nothing to recover.',
          duplicate_phone: 'Another live tag already uses this phone number in the same category. Change or remove that tag first, then recover.',
        };
        const status = result.reason === 'duplicate_phone' ? 409
          : result.reason === 'not_owner' ? 403
          : result.reason === 'not_deleted' ? 400
          : 404;
        logger.security('PRODUCT_RECOVER_DENIED', `Recover attempt failed for ${id} (${result.reason}) by ${req.user.email}`);
        return res.status(status).json({ success: false, error: messages[result.reason] || 'Recovery failed.' });
      }
      logger.security('PRODUCT_RECOVERED', `Sticker ${id} recovered by owner ${req.user.email}`);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      logger.error('PRODUCT_RECOVER', `Failed to recover product: ${req.params.id}`, err);
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
