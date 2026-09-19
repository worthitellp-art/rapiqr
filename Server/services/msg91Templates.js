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
// Static prefix registered with Meta for every "open the dashboard" button
// below; each template supplies only the dynamic suffix (a chat session id,
// or '' when there's no session yet) as its button_N component value.
const DASHBOARD_BUTTON_BASE_URL = 'https://repiqr.com/#/dashboard?tab=chat&session=';

const MSG91_TEMPLATES = {
  QR_SCAN_ALERT: {
    name: process.env.MSG91_WHATSAPP_TEMPLATE_NAME || 'qr_scan_alert',
    audience: 'owner',
    // `link` used to be a 3rd body variable rendered as plain text — now a
    // WhatsApp button instead (see `buttons`). button_1 is positional (Meta
    // requires dynamic URL button variables to be positional, not named).
    variables: ['label', 'message', 'button_1'],
    defaults: { label: 'your tag', message: 'an issue was reported', button_1: '' },
    body: '*🔔 QR Scan Alert*\nYour tag *{{label}}* was just scanned.\nMessage: *{{message}}*\n— RepiQR',
    buttons: [
      { type: 'URL', urlType: 'dynamic', text: 'View & Reply', baseUrl: DASHBOARD_BUTTON_BASE_URL },
    ],
  },

  EMERGENCY_ALERT: {
    name: process.env.MSG91_WHATSAPP_EMERGENCY_TEMPLATE || 'emergency_alert_v2',
    audience: 'owner',
    // `link` used to be a 3rd body variable rendered as plain text. It's now a
    // WHATSAPP BUTTON instead (see `buttons` below) — the dashboard/chat link
    // is submitted as the dynamic suffix of a URL call-to-action button, not
    // printed in the message body. `button_1` is positional (Meta requires
    // dynamic URL button variables to be positional, not named), and flows
    // through unchanged: buildVariables -> notify -> provider.send ->
    // sendMsg91WhatsApp -> buildMsg91WhatsAppComponents, which already treats
    // any `button_*`-prefixed key as a button component (see msg91Client.js).
    variables: ['label', 'message', 'button_1'],
    defaults: { label: 'your tag', message: 'an emergency alert was raised', button_1: '' },
    body: '🚨 *URGENT — ACCIDENT ALERT*\n\nPossible accident involving {{label}}.\nMessage: {{message}}\n\n— *RepiQR Safety*',
    // Documentation for submitting this template in the MSG91 dashboard
    // (control.msg91.com → WhatsApp → Templates → Create) — the `body` above
    // goes in the Body field; this describes the one Call-to-Action button to
    // add alongside it. Not read by any runtime code.
    buttons: [
      { type: 'URL', urlType: 'dynamic', text: 'View & Take Action', baseUrl: DASHBOARD_BUTTON_BASE_URL },
    ],
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
    // maps_url and link were both plain body text — now two buttons.
    // button_1 = "View Location" (Google Maps), button_2 = "Open Dashboard".
    variables: ['label', 'button_1', 'button_2'],
    defaults: { label: 'your tag', button_1: '', button_2: '' },
    body: '*📍 Location Shared*\nSomeone has shared their live location for *{{label}}*.\n— RepiQR Safety',
    buttons: [
      { type: 'URL', urlType: 'dynamic', text: 'View Location', baseUrl: 'https://maps.google.com/?q=' },
      { type: 'URL', urlType: 'dynamic', text: 'Open Dashboard', baseUrl: DASHBOARD_BUTTON_BASE_URL },
    ],
  },

  CHAT_STARTED: {
    name: 'chat_started',
    audience: 'owner',
    variables: ['label', 'button_1'],
    defaults: { label: 'your tag', button_1: '' },
    body: 'RepiQR chat alert: a visitor has started a conversation about your tag "{{label}}". They are waiting for your response.',
    buttons: [
      { type: 'URL', urlType: 'dynamic', text: 'Reply Now', baseUrl: DASHBOARD_BUTTON_BASE_URL },
    ],
  },

  CHAT_MESSAGE: {
    name: 'chat_message',
    audience: 'owner',
    variables: ['label', 'button_1'],
    defaults: { label: 'your tag', button_1: '' },
    body: '*💬 RepiChat – New Message*\nSomeone has sent you a message about your RepiQR tag *{{label}}*.\n— RepiQR Safety',
    buttons: [
      { type: 'URL', urlType: 'dynamic', text: 'View & Reply', baseUrl: DASHBOARD_BUTTON_BASE_URL },
    ],
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