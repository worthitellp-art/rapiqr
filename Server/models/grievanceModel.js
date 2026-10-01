const Grievance = require('./schemas/Grievance');
const { logger } = require('../middleware/loggerMiddleware');

function toApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    ticketNumber: doc.ticket_number,
    category: doc.category,
    description: doc.description,
    status: doc.status,
    responsiblePerson: doc.responsible_person,
    responseHistory: doc.response_history || [],
    resolution: doc.resolution,
    submittedAt: doc.submitted_at,
    resolvedAt: doc.resolved_at,
  };
}

function generateTicketNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GRV-${year}-${random}`;
}

class GrievanceModel {
  static async create({ userId, contactEmail, contactPhone, category, description }) {
    let doc;
    // Retry-on-collision rather than trusting a single random suffix to be
    // unique — the unique index is the real guarantee, this just avoids a
    // 500 on the rare collision instead of surfacing it to the submitter.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        doc = await Grievance.create({
          ticket_number: generateTicketNumber(),
          user_id: userId || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          category: category || 'general',
          description,
        });
        break;
      } catch (err) {
        if (err?.code === 11000 && attempt < 2) continue;
        throw err;
      }
    }
    return toApi(doc);
  }

  static async listOwn(userId) {
    const docs = await Grievance.find({ user_id: userId }).sort({ submitted_at: -1 }).lean();
    return docs.map(toApi);
  }

  static async getByTicketNumber(ticketNumber) {
    const doc = await Grievance.findOne({ ticket_number: ticketNumber }).lean();
    return toApi(doc);
  }

  /** Admin: full listing. */
  static async getAll({ status } = {}) {
    try {
      const filter = status && status !== 'ALL' ? { status } : {};
      const docs = await Grievance.find(filter).sort({ submitted_at: -1 }).lean();
      return docs.map(toApi);
    } catch (err) {
      logger.error('GRIEVANCE_LIST', 'GrievanceModel.getAll failed', err);
      return [];
    }
  }

  /** Admin: change status and/or append a response note. */
  static async updateStatus(id, { status, responseMessage, respondedBy, resolution }) {
    const update = {};
    if (status) {
      update.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') update.resolved_at = new Date();
    }
    if (resolution !== undefined) update.resolution = resolution;

    const pushOps = responseMessage
      ? { response_history: { message: responseMessage, by: respondedBy || 'admin', at: new Date() } }
      : undefined;

    const doc = await Grievance.findByIdAndUpdate(
      id,
      { ...(Object.keys(update).length ? { $set: update } : {}), ...(pushOps ? { $push: pushOps } : {}) },
      { new: true }
    ).lean();
    return toApi(doc);
  }
}

module.exports = GrievanceModel;
