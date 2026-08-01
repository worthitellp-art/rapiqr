const { supabaseAdmin } = require('../config/db');
const { getMemoryLogs, clearMemoryLogs } = require('../middleware/loggerMiddleware');

class LogModel {
  /**
   * Fetch server operational & HTTP logs from Supabase merged with live memory logs
   */
  static async getLogs({ limit = 100, level = null, tag = null, category = null, event = null, userId = null, requestId = null } = {}) {
    let dbLogs = [];

    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('server_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (level && level !== 'ALL') {
          query = query.eq('level', level.toUpperCase());
        }

        if (tag) {
          query = query.ilike('tag', `%${tag}%`);
        }

        if (category && category !== 'ALL') {
          query = query.eq('category', category.toUpperCase());
        }

        if (event) {
          query = query.eq('event', event);
        }

        if (userId) {
          query = query.eq('user_id', userId);
        }

        if (requestId) {
          query = query.eq('request_id', requestId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          dbLogs = data;
        }
      } catch (err) {
        // Fallback to in-memory logs
      }
    }

    const memLogs = getMemoryLogs({ limit, level, tag, category, event, userId, requestId }) || [];

    // Merge database logs and live in-memory logs
    const combined = [...dbLogs];
    const existingIds = new Set(dbLogs.map(l => l.id || `${l.timestamp}-${l.message}`));

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
   * Clear logs history from Supabase and memory
   */
  static async clearLogs() {
    clearMemoryLogs();
    try {
      if (!supabaseAdmin) return true;
      const { error } = await supabaseAdmin.from('server_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error && error.code !== '42P01') throw error;
      return true;
    } catch (err) {
      return true;
    }
  }
}

module.exports = LogModel;
