const ServerLog = require('./schemas/ServerLog');
const { getMemoryLogs, clearMemoryLogs } = require('../middleware/loggerMiddleware');

class LogModel {
  /**
   * Fetch server operational & HTTP logs from the database merged with live
   * in-memory logs (the live console tail hasn't necessarily flushed yet).
   */
  static async getLogs({ limit = 100, level = null, tag = null, category = null, event = null, userId = null, requestId = null } = {}) {
    let dbLogs = [];
    try {
      const query = {};
      if (level && level !== 'ALL') query.level = level.toUpperCase();
      if (tag) query.tag = new RegExp(String(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (category && category !== 'ALL') query.category = category.toUpperCase();
      if (event) query.event = event;
      if (userId) query.user_id = userId;
      if (requestId) query.request_id = requestId;

      const docs = await ServerLog.find(query).sort({ created_at: -1 }).limit(limit).lean();
      dbLogs = docs.map((d) => ({ ...d, id: String(d._id) }));
    } catch (err) {
      // Fallback to in-memory logs
    }

    const memLogs = getMemoryLogs({ limit, level, tag, category, event, userId, requestId }) || [];

    // Merge database logs and live in-memory logs
    const combined = [...dbLogs];
    const existingIds = new Set(dbLogs.map((l) => l.id || `${l.timestamp}-${l.message}`));

    for (const memLog of memLogs) {
      if (!memLog) continue;
      const key = memLog.id || `${memLog.timestamp}-${memLog.message}`;
      if (!existingIds.has(key)) {
        combined.push(memLog);
      }
    }

    combined.sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime() || 0;
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime() || 0;
      return timeB - timeA;
    });

    return combined.slice(0, limit);
  }

  /**
   * Clear logs history from the database and memory
   */
  static async clearLogs() {
    clearMemoryLogs();
    try {
      await ServerLog.deleteMany({});
    } catch (err) {
      // best-effort
    }
    return true;
  }
}

module.exports = LogModel;
