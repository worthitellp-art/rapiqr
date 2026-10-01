const { Schema, model } = require('mongoose');

// Public/privacy grievance mechanism (task.md §25). Rule 13 requires a
// published grievance-response window not exceeding 90 days — this model
// tracks submission and resolution times so that deadline is measurable, and
// the internal target below is deliberately shorter (see privacyController).
// Submission does not require an account: an anonymous visitor can raise a
// grievance about e.g. a public scan page exposing something it shouldn't,
// identified only by whatever contact detail they choose to give.
const grievanceSchema = new Schema({
  ticket_number: { type: String, required: true, unique: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  contact_email: { type: String, default: null },
  contact_phone: { type: String, default: null },
  category: { type: String, default: 'general' },
  description: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  responsible_person: { type: String, default: null },
  response_history: {
    type: [{ message: String, by: String, at: { type: Date, default: Date.now }, _id: false }],
    default: [],
  },
  resolution: { type: String, default: null },
  submitted_at: { type: Date, default: Date.now, index: true },
  resolved_at: { type: Date, default: null },
}, { versionKey: false });

module.exports = model('Grievance', grievanceSchema);
