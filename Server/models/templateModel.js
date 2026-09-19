const Template = require('./schemas/Template');
const { logger } = require('../middleware/loggerMiddleware');

// Single shared row (name: 'Default') holds the admin's default sticker QR
// placement — was localStorage-only on the frontend (see StickerEditor.tsx),
// so it never survived a cleared browser, a different device, or another
// admin's session. This makes it an actual saved default.
const DEFAULT_TEMPLATE_NAME = 'Default';

class TemplateModel {
  static async getDefaultStickerPosition() {
    try {
      const doc = await Template.findOne({ name: DEFAULT_TEMPLATE_NAME }).lean();
      return doc?.sticker_pos || null;
    } catch (err) {
      console.error('TemplateModel.getDefaultStickerPosition Error:', err);
      logger.error('DB_TEMPLATE', 'TemplateModel.getDefaultStickerPosition failed', err);
      return null;
    }
  }

  static async setDefaultStickerPosition(pos) {
    const doc = await Template.findOneAndUpdate(
      { name: DEFAULT_TEMPLATE_NAME },
      { $set: { sticker_pos: pos, is_default: true } },
      { new: true, upsert: true }
    ).lean();
    return doc.sticker_pos;
  }
}

module.exports = TemplateModel;
