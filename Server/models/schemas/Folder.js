const { Schema, model } = require('mongoose');

// Sticker fleet folders. Was localStorage-only on the client — invisible
// across admin accounts/browsers — now persisted so every admin sees the
// same folder list. Stickers still reference folders by name (Sticker.folder_name),
// not by this document's _id.
const folderSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, default: null },
  description: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

folderSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = model('Folder', folderSchema);
