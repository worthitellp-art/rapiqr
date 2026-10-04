/**
 * Shared 500-response helper.
 *
 * Controllers already log the full error (logger.error) before replying, so the
 * response itself never needs the raw message — an unexpected error's
 * `.message` can echo a DB error, a file path or a third-party API body that was
 * never written with "safe to show a stranger" in mind. In production the client
 * gets a generic message; elsewhere it keeps the real one for local debugging
 * (same policy as the global handler in server.js).
 */
function sendServerError(res, err, publicMessage = 'Internal Server Error') {
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    error: isProd ? publicMessage : (err && err.message) || publicMessage,
  });
}

module.exports = { sendServerError };
