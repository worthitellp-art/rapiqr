/**
 * Notification message catalogue.
 *
 * One place that owns WHAT we say, kept out of React components and out of the
 * controllers that decide WHEN to say it. Each entry maps a RepiQR event type to
 * the WhatsApp template it will use once templates are approved, plus a plain
 * text body used by the mock provider today and as the session-message fallback
 * later.
 *
 * `templateName` values are the names we intend to submit for approval. Nothing
 * here assumes they exist yet — the mock provider never contacts WhatsApp, and
 * the live provider falls back to a session message when a template is missing.
 *
 * `variables` is the ordered positional list a WhatsApp template expects ({{1}},
 * {{2}}, ...). Keep it in sync with whatever gets submitted for approval.
 */

/** Trim untrusted, scanner-supplied text before it goes into a message. */
function clip(value, max = 120) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const TEMPLATES = {
  QR_SCAN_ALERT: {
    templateName: 'qr_scan_alert',
    audience: 'owner',
    variables: ['label', 'message', 'link'],
    build: ({ label, message, link }) =>
      `RepiQR: someone scanned ${clip(label, 60) || 'your tag'} and reported: "${clip(message)}". Reply securely: ${link}`,
  },

  EMERGENCY_ALERT: {
    templateName: 'emergency_alert',
    audience: 'owner',
    variables: ['label', 'message', 'link'],
    build: ({ label, message, link }) =>
      `RepiQR EMERGENCY on ${clip(label, 60) || 'your tag'}: "${clip(message)}". Open now: ${link}`,
  },

  EMERGENCY_CONTACT_ALERT: {
    templateName: 'emergency_contact_alert',
    audience: 'emergency_contact',
    variables: ['label', 'message'],
    build: ({ label, message }) =>
      `RepiQR EMERGENCY: an alert was raised on ${clip(label, 60) || 'a registered tag'}. Reported: "${clip(message)}".`,
  },

  LOCATION_SHARED: {
    templateName: 'location_shared',
    audience: 'owner',
    variables: ['label', 'mapsUrl', 'link'],
    build: ({ label, mapsUrl, link }) =>
      `RepiQR: a location was shared for ${clip(label, 60) || 'your tag'}. Map: ${mapsUrl} · Details: ${link}`,
  },

  CHAT_STARTED: {
    templateName: 'chat_started',
    audience: 'owner',
    variables: ['label', 'link'],
    build: ({ label, link }) =>
      `RepiQR: a visitor started a chat about ${clip(label, 60) || 'your tag'}. View and reply: ${link}`,
  },

  CHAT_MESSAGE: {
    templateName: 'chat_message',
    audience: 'owner',
    variables: ['label', 'message', 'link'],
    build: ({ label, message, link }) =>
      `RepiQR: new message on ${clip(label, 60) || 'your tag'}: "${clip(message, 80)}". Reply: ${link}`,
  },

  SAFE_STATUS: {
    templateName: 'safe_status',
    audience: 'emergency_contact',
    variables: ['label', 'time'],
    build: ({ label, time }) =>
      `RepiQR Update: the emergency on ${clip(label, 60) || 'a registered tag'} has been marked SAFE by the registered user. Time: ${time}`,
  },

  QR_ACTIVATED: {
    templateName: 'qr_activated',
    audience: 'owner',
    variables: ['label'],
    build: ({ label }) => `RepiQR: your tag ${clip(label, 60)} is now active and protecting you.`,
  },

  OTP: {
    templateName: 'otp_verification',
    audience: 'owner',
    variables: ['code'],
    build: ({ code }) => `Your RepiQR verification code is ${code}. It expires in 10 minutes.`,
  },
};

function getTemplate(type) {
  return TEMPLATES[type] || null;
}

/** Positional variable list for the WhatsApp template, in declared order. */
function buildVariables(type, data = {}) {
  const template = getTemplate(type);
  if (!template) return [];
  return template.variables.map((key) => String(data[key] ?? ''));
}

/** Plain-text rendering — what the mock provider logs and what a session message sends. */
function buildBody(type, data = {}) {
  const template = getTemplate(type);
  if (!template) return '';
  return template.build(data);
}

module.exports = { TEMPLATES, getTemplate, buildVariables, buildBody, NOTIFICATION_TYPES: Object.keys(TEMPLATES) };
