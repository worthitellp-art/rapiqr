/**
 * Mock notification provider.
 *
 * The default until real WhatsApp credentials exist. It never contacts a network
 * and never reaches a real person, but it returns the same shape the live
 * provider does, so every flow above it — controllers, RepiChat, the UI receipt
 * shown to the scanner — can be exercised end to end today.
 *
 * Deliveries are recorded with status `mock_sent` so the admin Message Manager
 * can tell a rehearsal apart from a real send at a glance.
 */
const { logger } = require('../../middleware/loggerMiddleware');

async function send({ to, body, type, templateName, variables = [] }) {
  logger.external(`NOTIFY_${type}`, `[MOCK WhatsApp] -> ${to} | template=${templateName} | "${body}"`, {
    to,
    template: templateName,
    variables,
    body,
  });

  return {
    sent: true,
    mock: true,
    status: 'mock_sent',
    providerMessageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

module.exports = { name: 'mock', send };
