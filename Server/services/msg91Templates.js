/**
 * MSG91 WhatsApp templates catalogue — the SINGLE source of truth.
 *
 * These are the exact template definitions to submit in the MSG91 dashboard
 * (control.msg91.com → WhatsApp → Templates → Create). Copy the `body` text
 * verbatim, choose the correct category, and keep the named variable
 * placeholders exactly as the `variables` object below.
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
  QR_SCAN_ALERT: {
    name: process.env.MSG91_WHATSAPP_TEMPLATE_NAME || 'qr_scan_alert',
    audience: 'owner',
    variables: ['label', 'message', 'link'],
    defaults: { label: 'your tag', message: 'an issue was reported', link: 'https://repiqr.com/dashboard?tab=chat' },
    body: '*🔔 QR Scan Alert*\nYour tag *{{label}}* was just scanned.\nMessage: *{{message}}*\nCheck details and reply here: *{{link}}*\n— RepiQR',
  },

  EMERGENCY_ALERT: {
    name: process.env.MSG91_WHATSAPP_EMERGENCY_TEMPLATE || 'emergency_alert',
    audience: 'owner',
    variables: ['label', 'message', 'link'],
    defaults: { label: 'your tag', message: 'an emergency alert was raised', link: 'https://repiqr.com/dashboard?tab=chat' },
    body: 'an *urgent *alert has been raised for "{{label}}". The person who scanned your tag reports: "{{message}}". Open your dashboard here: {{link}} to view visitor details and take action.',
  },

  EMERGENCY_CONTACT_ALERT: {
    name: process.env.MSG91_WHATSAPP_EMERGENCY_CONTACT_TEMPLATE || 'emergency_contact_alert_v2',
    audience: 'emergency_contact',
    variables: ['label', 'message'],
    defaults: { label: 'a registered tag', message: 'an urgent alert was reported' },
    body: 'RepiQR EMERGENCY NOTIFICATION: an urgent alert was raised on the registered tag "{{label}}". The reporter states: "{{message}}". Please check on this situation immediately.',
  },

  LOCATION_SHARED: {
    name: 'location_shared',
    audience: 'owner',
    variables: ['label', 'maps_url', 'link'],
    defaults: { label: 'your tag', maps_url: '', link: 'https://repiqr.com/dashboard?tab=chat' },
    body: '*📍 Location Shared*\nSomeone has shared their live location for *{{label}}*.\nView the location: *{{maps_url}}*\nCheck details and reply here: *{{link}}*\n— RepiQR Safety',
  },

  CHAT_STARTED: {
    name: 'chat_started',
    audience: 'owner',
    variables: ['label', 'link'],
    defaults: { label: 'your tag', link: 'https://repiqr.com/dashboard?tab=chat' },
    body: 'RepiQR chat alert: a visitor has started a conversation about your tag "{{label}}". They are waiting for your response. Open your dashboard here: {{link}} to view the message and reply securely.',
  },

  CHAT_MESSAGE: {
    name: 'chat_message',
    audience: 'owner',
    variables: ['label', 'link'],
    defaults: { label: 'your tag', link: 'https://repiqr.com/dashboard?tab=chat' },
    body: '*💬 RepiChat – New Message*\nSomeone has sent you a message about your RepiQR tag *{{label}}*.\nTap the link below to view and reply:\n*{{link}}* \n— RepiQR Safety',
  },

  EMERGENCY_CONTACT_ADDED: {
    name: process.env.MSG91_WHATSAPP_CONTACT_ADDED_TEMPLATE || 'emergency_contact_added',
    audience: 'emergency_contact',
    variables: ['contact_name', 'owner_name'],
    defaults: { contact_name: 'there', owner_name: 'A RapiQR user' },
    body: 'Hi {{contact_name}}, {{owner_name}} has added you as an emergency contact on their RapiQR safety tag. If they are ever in an emergency, you may be contacted to help. No action is needed right now.',
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
const CLIP_MAX = { label: 40, message: 80, contact_name: 40, owner_name: 40 };

/**
 * Render an MSG91 body with the runtime values filled into {{1}}, {{2}}, ...
 * This is what the mock provider logs and what a session message sends, so it
 * always matches the submitted template text.
 */
function renderBody(type, data = {}) {
  const template = MSG91_TEMPLATES[type];
  if (!template) return '';
  const { body, variables, defaults = {} } = template;
  return variables.reduce((text, key) => {
    const max = CLIP_MAX[key];
    const value = max ? clip(data[key], max) : String(data[key] ?? '');
    const final = value || defaults[key] || '';
    return text.replace(new RegExp(`\\{\\{${key}\\}\\}`), final);
  }, body);
}

/** Named variable map for the WhatsApp template. */
function buildVariables(type, data = {}) {
  const template = MSG91_TEMPLATES[type];
  if (!template) return {};
  return Object.fromEntries(template.variables.map((key) => [key, String(data[key] ?? '')]));
}

module.exports = {
  MSG91_TEMPLATES,
  MSG91_TEMPLATE_NAMES: Object.values(MSG91_TEMPLATES).map((t) => t.name),
  renderBody,
  buildVariables,
  clip,
};