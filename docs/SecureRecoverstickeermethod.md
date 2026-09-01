=== DIGITAL QR STICKER SYSTEM ARCHITECTURE & DIALOGUE LOG ===

--- SYSTEM ARCHITECTURE OVERVIEW ---

Best Architecture for Digital QR Sticker System:
1. Internal ID (id): UUID v4 (Primary Key, permanent internal database identity).
2. Public QR ID (public_code): Short alphanumeric string (e.g., QR7K9M2X8P) used safely in QR URLs.
3. Activation Code (activation_code_hash): Printed secret on packaging used for first-time activation/claiming.
4. Recovery Code (recovery_code_hash): Printed secret used for physical backup & sticker recovery.
5. Soft Delete (deleted_at): Timestamp indicating deletion without destroying physical QR asset linkage.

--- DATABASE SCHEMA (MongoDB / Mongoose) ---

const { Schema, model } = require('mongoose');

const stickerSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  public_code: { type: String, required: true, unique: true, index: true },
  activation_code_hash: { type: String, required: true },
  recovery_code_hash: { type: String, required: true },

  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive', 'suspended', 'lost', 'deleted'], 
    default: 'pending' 
  },
  activation_status: { 
    type: String, 
    enum: ['unclaimed', 'claimed'], 
    default: 'unclaimed' 
  },

  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  client_id: { type: String, default: 'UNASSIGNED' },

  scans_count: { type: Number, default: 0 },
  last_scanned_at: { type: Date, default: null },
  template_name: { type: String, default: 'Standard Badge' },
  fg_color: { type: String, default: 'D9581F' },
  bg_color: { type: String, default: 'FFFFFF' },
  sticker_image: { type: String, default: null },
  category: { type: String, default: 'car' },

  name: { type: String, default: null },
  assigned_to: { type: String, default: null },
  vehicle_number: { type: String, default: null },
  details: {
    address: { type: String, default: null },
    bloodGroup: { type: String, default: null },
    allergies: { type: String, default: null },
    ownerPhone: { type: String, default: null },
    ownerEmail: { type: String, default: null },
    notes: { type: String, default: null },
    emergencyContacts: {
      type: [{ name: String, phone: String, _id: false }],
      default: [],
    },
    activatedAt: { type: Date, default: null },
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null, index: true },
  recovered_at: { type: Date, default: null }
}, { versionKey: false });

stickerSchema.index({ public_code: 1, deleted_at: 1 });
stickerSchema.index({ created_at: -1 });
stickerSchema.index({ 'details.ownerPhone': 1 });

module.exports = model('Sticker', stickerSchema);

--- LOGIC FLOW SUMMARY ---

Step 1: Admin Pre-Print Phase
- Backend creates MongoDB _id (UUID/ObjectId).
- Backend generates public_code, raw Activation Code, raw Recovery Code.
- Backend computes salted hashes (bcrypt/argon2) for secrets before storing in DB.
- Target URL encoded in QR: https://repiqr.com/s/{public_code}

Step 2: Scan & Routing Phase
- User scans QR code -> HTTP GET /s/:publicCode.
- Query DB for sticker where public_code matches and deleted_at is null.
- If not found or status == 'deleted': Return 404.
- If activation_status == 'unclaimed': Redirect to /activate/:publicCode.
- If status == 'suspended' or 'lost': Render disabled notice.
- If active & claimed: Increment scans_count, update last_scanned_at, render emergency contact details.

Step 3: Initial Activation / Claiming Phase
- User lands on /activate/:publicCode.
- User inputs raw Activation Code.
- Backend verifies hash; requires User Auth (OAuth/OTP).
- Atomic DB update: set user_id, status: 'active', activation_status: 'claimed', details.activatedAt.
- Append event to audit collection.

Step 4: Soft Deletion Phase
- Owner initiates delete action in dashboard.
- Verify ownership authorization.
- Atomic DB update: set status: 'deleted', set deleted_at: Date.now().
- Identity & physical QR linkage remains intact in DB for potential recovery.

Step 5: Recovery Phase
- User visits /recover, inputs public_code + raw Recovery Code.
- Backend queries DB (including soft-deleted records), verifies recovery code hash.
- Requires User Authentication.
- Reset state: update user_id, set status: 'active', set deleted_at: null, set recovered_at: Date.now().

--- SECURITY HIGHLIGHTS & BEST PRACTICES ---

1. Zero Identity Leakage: Database Primary Keys (_id / UUIDs) are kept secret from public URLs.
2. One-Way Secret Hashing: Raw activation and recovery codes are hashed in DB to prevent leaks upon DB compromise.
3. Infrastructure Defense:
   - Rate limiting on /s/:publicCode and /activate endpoints to protect against enumeration/brute-force.
   - Requirement of MFA/Auth during activation/recovery to prevent physical package theft exploitation.