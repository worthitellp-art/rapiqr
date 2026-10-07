/**
 * Role Schema — RBAC role definitions stored in MongoDB.
 * Each role document carries its canonical name and the flat list of
 * permission strings that belong to it. Roles are seeded once and then
 * only changed via the admin panel or the seed:superadmin script.
 */
const { Schema, model } = require('mongoose');

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
    },
    /** Fine-grained permission strings e.g. "users:delete", "stickers:read" */
    permissions: {
      type: [String],
      default: [],
    },
    /** Human-readable description used in the admin UI */
    description: { type: String, default: '' },
    /** Only SUPER_ADMIN can modify/delete this role */
    system: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = model('Role', roleSchema);
