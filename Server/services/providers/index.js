/**
 * Provider selection for the notification service.
 *
 * NOTIFICATION_PROVIDER=mock      (default) nothing leaves the server
 * NOTIFICATION_PROVIDER=whatsapp  real send through the configured BSP
 *
 * Defaulting to `mock` is deliberate: an unset variable must never cause a
 * surprise message to a real customer.
 */
const mockProvider = require('./mockProvider');
const whatsappProvider = require('./whatsappProvider');

const PROVIDERS = {
  mock: mockProvider,
  whatsapp: whatsappProvider,
};

function resolveProvider() {
  const name = (process.env.NOTIFICATION_PROVIDER || 'mock').trim().toLowerCase();
  return PROVIDERS[name] || mockProvider;
}

module.exports = { resolveProvider, PROVIDERS };
