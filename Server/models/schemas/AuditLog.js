const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    event_type: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    actor_type: {
      type: String,
      enum: ['USER', 'ADMIN', 'SYSTEM', 'ANONYMOUS'],
      default: 'ANONYMOUS',
      index: true,
    },
    user_id: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    user_email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    request_id: {
      type: String,
      default: null,
      index: true,
    },
    ip_address: {
      type: String,
      default: null,
      index: true,
    },
    user_agent: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      default: null,
    },
    endpoint: {
      type: String,
      default: null,
      index: true,
    },
    resource_type: {
      type: String,
      default: null,
      index: true,
    },
    resource_id: {
      type: String,
      default: null,
      index: true,
    },
    status_code: {
      type: Number,
      default: null,
      index: true,
    },
    reason: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Rolling 180-day retention to comply with CERT-In directives
auditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 86400 * 180 });

// Immutability safeguards: Prevent modification or deletion of audit records
function rejectMutation(next) {
  const error = new Error('Compliance Violation: AuditLog records are append-only and cannot be modified or deleted.');
  error.status = 403;
  return next(error);
}

auditLogSchema.pre('updateOne', rejectMutation);
auditLogSchema.pre('updateMany', rejectMutation);
auditLogSchema.pre('findOneAndUpdate', rejectMutation);
auditLogSchema.pre('findOneAndReplace', rejectMutation);
auditLogSchema.pre('deleteOne', rejectMutation);
auditLogSchema.pre('deleteMany', rejectMutation);
auditLogSchema.pre('findOneAndDelete', rejectMutation);
auditLogSchema.pre('remove', rejectMutation);

module.exports = model('AuditLog', auditLogSchema);
