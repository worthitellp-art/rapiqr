const MAX_EMERGENCY_CONTACTS = 7;

/**
 * Keep only real contacts. A slot that was opened but never filled arrives as
 * { name: '', phone: '' }; storing it made the dashboard show a phantom input.
 */
function sanitizeEmergencyContacts(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && (String(c.name || '').trim() || String(c.phone || '').trim()))
    .slice(0, MAX_EMERGENCY_CONTACTS);
}

module.exports = { sanitizeEmergencyContacts, MAX_EMERGENCY_CONTACTS };
