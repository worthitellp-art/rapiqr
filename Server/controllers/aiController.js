const { logger } = require('../middleware/loggerMiddleware');

const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.5-flash:free',
  'deepseek/deepseek-r1:free',
  'openrouter/auto'
];

/**
 * Is the assistant actually usable right now? A real check against OpenRouter's
 * key-info endpoint (a valid key answers 200), cached for 5 minutes so scan-page
 * loads don't each cost an upstream call. The key itself is never returned.
 * GET /api/ai/status  →  { success, available }
 */
const STATUS_TTL_MS = 5 * 60 * 1000;
let statusCache = { at: 0, available: false };

exports.status = async (req, res) => {
  const now = Date.now();
  if (now - statusCache.at < STATUS_TTL_MS) {
    return res.json({ success: true, available: statusCache.available });
  }
  let available = false;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const upstream = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      available = upstream.ok;
    } catch {
      available = false;
    }
  }
  statusCache = { at: now, available };
  return res.json({ success: true, available });
};

/**
 * Proxy chat messages to OpenRouter using the server-side key — the key must
 * never be shipped to the browser, so this endpoint exists instead of calling
 * OpenRouter directly from the frontend.
 * POST /api/ai/chat  Body: { messages: [{role, content}], vehicleNumber? }
 */
exports.chat = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, error: 'AI assistant is not configured on the server.' });
    }

    const { messages, vehicleNumber } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }

    const systemMessage = {
      role: 'system',
      content: `You are RepiQR Safety AI Assistant assisting a user who scanned vehicle QR tag ${vehicleNumber || 'QR Tag'}. Help with wrong parking, emergency medical first aid, towing, or owner contact. Be concise, practical, direct, and polite.`
    };

    for (const model of FREE_MODELS) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://rapiqr.worthitellp.workers.dev',
            'X-Title': 'RepiQR Emergency AI Assistant',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, messages: [systemMessage, ...messages] })
        });
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return res.json({ success: true, reply });
      } catch (err) {
        logger.warn('AI_CHAT', `Model ${model} failed, trying next model`, err);
      }
    }

    return res.json({
      success: true,
      reply: 'I am RepiQR Safety AI Assistant. How can I help you contact the vehicle owner or arrange emergency help?'
    });
  } catch (err) {
    logger.error('AI_CHAT', 'Failed to process AI chat request', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
