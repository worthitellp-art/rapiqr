// Generic stand-ins the server writes when no real owner name was given at
// activation. They are not a registered name, so the admin panel shows the tag id.
const GENERIC_NAME = /^(vehicle owner|sticker owner|owner)$/i;
const PLACEHOLDER = /^(vehicle|tag) \(/i;

/** The sticker's registered name, or null when it's missing or only a placeholder. */
function registeredName(value) {
  const clean = String(value || '').trim();
  if (!clean || GENERIC_NAME.test(clean) || PLACEHOLDER.test(clean)) return null;
  return clean;
}

module.exports = { registeredName };
