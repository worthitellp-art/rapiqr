/**
 * The one way RepiQR notifies a human.
 *
 * Controllers, sockets and the scan flows call the role-named helpers here
 * (`notifyOwner`, `notifyEmergencyContacts`, ...). They never pick a channel and
 * never touch Meta / Gupshup / Twilio directly — the provider layer decides
 * that, so switching BSP is a config change, not a refactor.
 *
 *   business logic → NotificationService → provider (mock | whatsapp) → BSP
 *
 * WhatsApp is the only channel wired up for this launch. SMS is intentionally
 * NOT a fallback: `Server/services/smsService.js` still exists and still works,
 * so adding it back later means adding a channel here, not rebuilding callers.
 *
 * Every attempt is recorded through MessageModel (the existing `messages` table),
 * which already carries recipient / event / status / provider id / error — the
 * delivery ledger, reused rather than duplicated.
 */
const MessageModel = require('../models/messageModel');
const { logger } = require('../middleware/loggerMiddleware');
const { resolveProvider } = require('./providers');
const { getTemplate, buildBody, buildVariables } = require('./notificationTemplates');

/** Per (recipient, notification type) WhatsApp cap, resets every calendar month. */
const MONTHLY_LIMIT_PER_TYPE = 10;

// Anti-spam debounce: minimum 30 seconds between alerts of the same type to the same recipient
const RECENT_SENDS = new Map();
const ANTI_SPAM_COOLDOWN_MS = 30 * 1000;

// OTP is a login/verification code, never subject to the notification quota —
// capping it could lock a client out of their own account.
const UNLIMITED_TYPES = new Set(['OTP']);

/**
 * Send one notification.
 *
 * Never throws: a failed notification must not fail the scan, the alert or the
 * chat that triggered it. The result says honestly what happened.
 *
 * @returns {Promise<{sent:boolean, mock:boolean, status:string, providerMessageId?:string, error?:string}>}
 */
async function notify({ type, to, data = {}, eventId = null }) {
  if (!to) return { sent: false, mock: false, status: 'skipped', error: 'no_recipient' };

  const template = getTemplate(type);
  if (!template) {
    logger.warn('NOTIFY', `Unknown notification type "${type}" — nothing sent.`);
    return { sent: false, mock: false, status: 'skipped', error: 'unknown_type' };
  }

  const event = `NOTIFY_${type}`;

  // Short-term anti-spam cooldown: prevent rapid duplicate messages to the same phone
  if (!UNLIMITED_TYPES.has(type)) {
    const key = `${to}:${type}`;
    const lastSent = RECENT_SENDS.get(key) || 0;
    const now = Date.now();
    if (now - lastSent < ANTI_SPAM_COOLDOWN_MS) {
      const waitSec = Math.ceil((ANTI_SPAM_COOLDOWN_MS - (now - lastSent)) / 1000);
      logger.warn('NOTIFY', `Anti-spam debounce active for ${to} (${type}) — wait ${waitSec}s.`);
      return { sent: true, mock: false, status: 'cooldown_active', note: `Debounced to prevent spam. Please wait ${waitSec}s.` };
    }
    RECENT_SENDS.set(key, now);
    if (RECENT_SENDS.size > 1000) {
      for (const [k, time] of RECENT_SENDS.entries()) {
        if (now - time > ANTI_SPAM_COOLDOWN_MS * 2) RECENT_SENDS.delete(k);
      }
    }
  }

  if (!UNLIMITED_TYPES.has(type)) {
    const sentThisMonth = await MessageModel.countThisMonth({ to, event });
    if (sentThisMonth >= MONTHLY_LIMIT_PER_TYPE) {
      logger.warn('NOTIFY', `Monthly WhatsApp limit (${MONTHLY_LIMIT_PER_TYPE}) reached for ${type} to ${to} — skipping.`);
      return { sent: false, mock: false, status: 'limit_reached', error: 'monthly_limit_reached' };
    }
  }

  const body = buildBody(type, data);
  const provider = resolveProvider();

  try {
    const result = await provider.send({
      to,
      body,
      type,
      templateName: template.templateName,
      variables: buildVariables(type, data),
      languageCode: template.languageCode,
    });

    MessageModel.record({
      channel: 'whatsapp',
      to,
      event,
      status: result.status,
      sid: result.providerMessageId || null,
      error: result.error || null,
      body,
    });

    return { ...result, eventId };
  } catch (err) {
    logger.error('NOTIFY', `Provider "${provider.name}" threw sending ${type} to ${to}`, err);
    MessageModel.record({ channel: 'whatsapp', to, event, status: 'failed', error: err.message, body });
    return { sent: false, mock: false, status: 'failed', error: err.message };
  }
}

/** Notify several recipients, tolerating individual failures. */
async function notifyMany({ type, recipients = [], data = {}, eventId = null }) {
  const targets = recipients.map((r) => (typeof r === 'string' ? r : r?.phone)).filter(Boolean);
  const results = await Promise.all(targets.map((to) => notify({ type, to, data, eventId })));
  return { results, delivered: results.filter((r) => r.sent).length, attempted: targets.length };
}

/* ------------------------------------------------------------------ */
/*  Role-named helpers — what callers actually use                     */
/* ------------------------------------------------------------------ */

const notifyOwner = ({ type, ownerPhone, data, eventId }) =>
  notify({ type, to: ownerPhone, data, eventId });

const notifyEmergencyContacts = ({ type = 'EMERGENCY_CONTACT_ALERT', contacts = [], data, eventId }) =>
  notifyMany({ type, recipients: contacts, data, eventId });

/**
 * "You've been added as an emergency contact" — sent once per contact when a
 * sticker owner registers them (see QrController.activateQrCode). Unlike
 * notifyMany, each contact needs ITS OWN name filled into the message
 * alongside the owner's, so this sends one personalized `notify()` per
 * contact rather than sharing a single `data` blob across all of them.
 */
const notifyContactsAdded = ({ contacts = [], ownerName, eventId = null }) => {
  const targets = contacts.filter((c) => c?.phone);
  return Promise.all(
    targets.map((c) =>
      notify({
        type: 'EMERGENCY_CONTACT_ADDED',
        to: c.phone,
        data: { contact_name: c.name || 'there', owner_name: ownerName || 'A RapiQR user' },
        eventId,
      })
    )
  ).then((results) => ({ results, delivered: results.filter((r) => r.sent).length, attempted: targets.length }));
};

const sendQRScanAlert = ({ ownerPhone, data, eventId }) =>
  notify({ type: 'QR_SCAN_ALERT', to: ownerPhone, data, eventId });

const sendEmergencyAlert = ({ ownerPhone, data, eventId }) =>
  notify({ type: 'EMERGENCY_ALERT', to: ownerPhone, data, eventId });

const sendLocationAlert = ({ ownerPhone, data, eventId }) =>
  notify({ type: 'LOCATION_SHARED', to: ownerPhone, data, eventId });

const sendSafeStatus = ({ contacts = [], data, eventId }) =>
  notifyMany({ type: 'SAFE_STATUS', recipients: contacts, data, eventId });

/** Which provider is active — surfaced to admin/health so "mock" is never a surprise. */
const activeProvider = () => resolveProvider().name;

module.exports = {
  notify,
  notifyMany,
  notifyOwner,
  notifyEmergencyContacts,
  notifyContactsAdded,
  sendQRScanAlert,
  sendEmergencyAlert,
  sendLocationAlert,
  sendSafeStatus,
  activeProvider,
};
