const { Schema, model } = require('mongoose');

// New — was frontend-only (src/lib/supabaseService.ts wrote directly to a
// Supabase `templates` table with no server-side model or auth check).
const templateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  fg_color: { type: String, default: null },
  bg_color: { type: String, default: null },
  sticker_pos: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 0 },
    h: { type: Number, default: 0 },
  },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('Template', templateSchema);
