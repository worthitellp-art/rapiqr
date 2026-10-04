/**
 * MSG91 WhatsApp templates catalogue — the SINGLE source of truth.
 *
 * Scan, urgent-alert and chat messages use the three current button templates
 * (update-templates/rapi_tag_scan.json, rapi_urgent_alert.json,
 * rapi_new_chat.json). The remaining types (contact-added, safe, activated, OTP)
 * still use the older approved templates in old-templates-whaspp-usethis/*.json
 * until a button version exists for them.
 *
 * Rules MSG91/Meta enforce:
 *  - Placeholders use named keys such as `{{label}}` and `{{message}}`.
 *  - Every placeholder must map to a real token and match this file.
 *  - Template names are lowercase, alphanumeric + underscore (they are).
 *
 * `notificationTemplates.js` imports these bodies at runtime, so the session
 * fallback text and the submitted template can never drift apart.
 */

/**
 * Trim untrusted, scanner-supplied text before it goes into a message.
 * Mirrors the runtime clip in notificationTemplates.js (shared behaviour).
 */
function clip(value, max = 120) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Full dashboard chat link for a WhatsApp message body (plain text now, not a
 * button) — used by CHAT_STARTED, CHAT_MESSAGE, QR_SCAN_ALERT and
 * LOCATION_SHARED's `link` variable. `sessionId` may be empty (no chat thread
 * yet); the link still resolves, just without a specific thread selected.
 */
function buildDashboardChatLink(sessionId) {
  const base = (process.env.APP_URL || 'https://repiqr.com').replace(/\/+$/, '');
  return `${base}/#/dashboard?tab=chat${sessionId ? `&session=${sessionId}` : ''}`;
}

/** Google Maps link for a WhatsApp message body from raw lat/lng. */
function buildMapsLink(latitude, longitude) {
  if (!latitude || !longitude) return '';
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

/**
 * MSG91_TEMPLATES[type] = {
 *   name:       MSG91 template name (as submitted for approval),
 *   audience:   'owner' | 'emergency_contact' | 'otp' — who receives it,
 *   variables:  ordered variable names used as placeholders, for example
 *              `['label', 'message', 'link']`,
 *   languageCode: optional WhatsApp template language locale (e.g. 'en_US') —
 *              MSG91 matches templates by name + locale, so a bare 'en' won't
 *              resolve a template registered under a full locale code. Falls
 *              back to MSG91_WHATSAPP_LANGUAGE_CODE, then 'en'.
 *   defaults:   fallback text used ONLY by the runtime session/mock render
 *               when a variable value is empty,
 *   body:       the EXACT message you paste into MSG91, with named placeholders.
 * }
 */
const MSG91_TEMPLATES = {
  // ── Current templates (each has a "Open dashboard" URL button) ─────────────
  // Names are hardcoded on purpose: Server/.env used to pin
  // MSG91_WHATSAPP_TEMPLATE_NAME=qr_scan_alert, which silently kept the retired
  // template alive. Template FILES/names say "rapi_" (Meta locked the old names);
  // the wording inside the messages says "RepiQR".
  //
  // `buttonVariable` names the `data` key that fills the URL button's {{1}}
  // (the chat session id). MSG91 sends it as component `button_1`.
  QR_SCAN_ALERT: {
    name: 'rapi_tag_scan',
    audience: 'owner',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'your tag', message: 'an issue was reported' },
    body: '🔔 *RepiQR Scan Alert*\n\nYour tag *{{item_name}}* *was scanned*.\n*Note*: "{{message}}"\n\n_*Tap below to view details and reply 👇*_',
  },

  // Same template as QR_SCAN_ALERT — the shared maps link rides in `message`.
  LOCATION_SHARED: {
    name: 'rapi_tag_scan',
    audience: 'owner',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'your tag', message: 'live location shared' },
    body: '🔔 *RepiQR Scan Alert*\n\nYour tag *{{item_name}}* *was scanned*.\n*Note*: "{{message}}"\n\n_*Tap below to view details and reply 👇*_',
  },

  EMERGENCY_ALERT: {
    name: 'rapi_urgent_alert',
    audience: 'owner',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'your tag', message: 'an emergency alert was raised' },
    body: '🚨 *Urgent Alert*\n\nAlert reported for *{{item_name}}*:\n"{{message}}"\n\n*_Tap below to reply securely_* 👇',
  },

  // Emergency contacts get the same urgent template. Their button opens the
  // RepiQR dashboard (they sign in to see it); there is no thread of their own.
  EMERGENCY_CONTACT_ALERT: {
    name: 'rapi_urgent_alert',
    audience: 'emergency_contact',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'a registered tag', message: 'an urgent alert was reported' },
    body: '🚨 *Urgent Alert*\n\nAlert reported for *{{item_name}}*:\n"{{message}}"\n\n*_Tap below to reply securely_* 👇',
  },

  CHAT_STARTED: {
    name: 'rapi_new_chat',
    audience: 'owner',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'your tag', message: 'A visitor started a chat with you.' },
    body: '💬 *New Message*\n\nMessage regarding *{{item_name}}*:\n"{{message}}"\n\n*_Tap below to reply securely_* 👇',
  },

  CHAT_MESSAGE: {
    name: 'rapi_new_chat',
    audience: 'owner',
    variables: ['item_name', 'message'],
    buttonVariable: 'session',
    defaults: { item_name: 'your tag', message: 'You have a new message.' },
    body: '💬 *New Message*\n\nMessage regarding *{{item_name}}*:\n"{{message}}"\n\n*_Tap below to reply securely_* 👇',
  },

  // ── Older templates with no button replacement yet ─────────────────────────
  EMERGENCY_CONTACT_ADDED: {
    name: process.env.MSG91_WHATSAPP_CONTACT_ADDED_TEMPLATE || 'emergency_contact_added',
    audience: 'emergency_contact',
    variables: ['contact_name', 'owner_name'],
    defaults: { contact_name: 'there', owner_name: 'A RepiQR user' },
    body: 'Hi {{contact_name}}, {{owner_name}} has added you as an emergency contact on their RepiQR safety tag. If they are ever in an emergency, you may be contacted to help. No action is needed right now.',
  },

  SAFE_STATUS: {
    name: 'safe_status',
    audience: 'emergency_contact',
    variables: ['label'],
    defaults: { label: 'a registered tag' },
    body: '*✅ RepiQR – SAFE*\nYour tag *{{label}}* has been marked as *SAFE*.\nThe emergency situation is resolved. No action is needed.',
  },

  QR_ACTIVATED: {
    name: 'qr_activated',
    audience: 'owner',
    variables: ['label'],
    defaults: { label: 'your tag' },
    body: '*🎉 RepiQR Activated!*\nYour tag *{{label}}* is now active.\nYou will receive an alert when someone scans your tag.\nThank you for choosing RepiQR.',
  },

  OTP: {
    name: 'otp_verification',
    audience: 'owner',
    variables: ['code'],
    defaults: { code: '' },
    body: 'RepiQR verification: your one-time verification code is {{code}}. This code is valid for 10 minutes only. Do not share this code with anyone, including RepiQR support staff.',
  },
};

/** Max clip length per variable key (message text tends to run long). */
const CLIP_MAX = { label: 40, item_name: 40, message: 160, contact_name: 40, owner_name: 40 };

/** Clipped value for one template variable, falling back to its default — Meta rejects empty params. */
function resolveValue(template, key, data) {
  const max = CLIP_MAX[key];
  const value = max ? clip(data[key], max) : String(data[key] ?? '');
  return value || (template.defaults || {})[key] || '';
}

/**
 * Render an MSG91 body with the runtime values filled into {{1}}, {{2}}, ...
 * This is what the mock provider logs and what a session message sends, so it
 * always matches the submitted template text.
 */
function renderBody(type, data = {}) {
  const template = MSG91_TEMPLATES[type];
  if (!template) return '';
  return template.variables.reduce(
    (text, key) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`), resolveValue(template, key, data)),
    template.body
  );
}

/**
 * Named variable map for the WhatsApp template. Templates with a URL button
 * also get `button_1` (the dynamic part of the URL, e.g. the chat session id);
 * msg91Client substitutes a placeholder if it's empty.
 */
function buildVariables(type, data = {}) {
  const template = MSG91_TEMPLATES[type];
  if (!template) return {};
  const variables = Object.fromEntries(template.variables.map((key) => [key, resolveValue(template, key, data)]));
  if (template.buttonVariable) variables.button_1 = String(data[template.buttonVariable] ?? '');
  return variables;
}

module.exports = {
  MSG91_TEMPLATES,
  MSG91_TEMPLATE_NAMES: Object.values(MSG91_TEMPLATES).map((t) => t.name),
  renderBody,
  buildVariables,
  buildDashboardChatLink,
  buildMapsLink,
  clip,
};
