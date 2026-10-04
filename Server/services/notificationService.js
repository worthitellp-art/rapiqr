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
/**
 * Emergency alerts get a far higher cap: a real emergency must never be dropped
 * because routine or test alerts already used up the default quota this month.
 */
const MONTHLY_LIMIT_BY_TYPE = { EMERGENCY_ALERT: 500, EMERGENCY_CONTACT_ALERT: 500 };

// Anti-spam debounce: minimum 30 seconds between alerts of the same type to the same recipient
const RECENT_SENDS = new Map();
const ANTI_SPAM_COOLDOWN_MS = 30 * 1000;

// Identical-message guard. The owner copy and the emergency-contact copy of an
// alert use different notification types (so the per-type cooldown above can't
// see them as duplicates) but render the SAME text — when the owner's own number
// is also saved as an emergency contact they got the alert twice. Keyed on
// recipient (last 10 digits, so "+91…" and "…" match) + template + final text.
const RECENT_BODIES = new Map();
const DUPLICATE_WINDOW_MS = 60 * 1000;

// OTP is a login/verification code, never subject to the notification quota —
// capping it could lock a client out of their own account.
const UNLIMITED_TYPES = new Set(['OTP']);

/** "45s" or "4m 05s" — how long until a WhatsApp of this kind is allowed again. */
function formatWait(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`;
}

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
      const detail = `The owner was messaged moments ago. The next WhatsApp of this type is allowed in ${formatWait(waitSec)}.`;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'held', reason: 'debounce', retryAfterSec: waitSec, detail };
    }
    RECENT_SENDS.set(key, now);
    if (RECENT_SENDS.size > 1000) {
      for (const [k, time] of RECENT_SENDS.entries()) {
        if (now - time > ANTI_SPAM_COOLDOWN_MS * 2) RECENT_SENDS.delete(k);
      }
    }
  }

  // Checked and recorded synchronously (before any await) so two sends racing
  // for the same recipient can't both slip through.
  if (!UNLIMITED_TYPES.has(type)) {
    const dupKey = `${String(to).replace(/\D/g, '').slice(-10)}|${template.templateName}|${buildBody(type, data)}`;
    const now = Date.now();
    if (now - (RECENT_BODIES.get(dupKey) || 0) < DUPLICATE_WINDOW_MS) {
      logger.warn('NOTIFY', `Skipped duplicate ${type} to ${to} — identical message already sent in the last minute.`);
      const waitSec = Math.ceil((DUPLICATE_WINDOW_MS - (now - (RECENT_BODIES.get(dupKey) || 0))) / 1000);
      const detail = `This exact alert was just sent to the owner. An identical repeat is held for ${formatWait(waitSec)}.`;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'held', reason: 'duplicate', retryAfterSec: waitSec, detail };
    }
    RECENT_BODIES.set(dupKey, now);
    if (RECENT_BODIES.size > 1000) {
      for (const [k, time] of RECENT_BODIES.entries()) {
        if (now - time > DUPLICATE_WINDOW_MS) RECENT_BODIES.delete(k);
      }
    }
  }

  if (!UNLIMITED_TYPES.has(type)) {
    const monthlyLimit = MONTHLY_LIMIT_BY_TYPE[type] ?? MONTHLY_LIMIT_PER_TYPE;
    const sentThisMonth = await MessageModel.countThisMonth({ to, event });
    if (sentThisMonth >= monthlyLimit) {
      logger.warn('NOTIFY', `Monthly WhatsApp limit (${monthlyLimit}) reached for ${type} to ${to} — skipping.`);
      const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      const retryAfterSec = Math.ceil((nextReset.getTime() - Date.now()) / 1000);
      const resetLabel = nextReset.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const detail = `Monthly WhatsApp limit reached for this owner (${monthlyLimit} per month). It resets on ${resetLabel}.`;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'limit_reached', reason: 'monthly_limit', retryAfterSec, detail, error: 'monthly_limit_reached' };
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

    const rejected = !result.sent && !result.mock;
    return {
      ...result,
      eventId,
      ...(rejected ? { reason: 'provider_failed', detail: `The WhatsApp provider did not accept the message: ${result.error || result.status}.` } : {}),
    };
  } catch (err) {
    logger.error('NOTIFY', `Provider "${provider.name}" threw sending ${type} to ${to}`, err);
    MessageModel.record({ channel: 'whatsapp', to, event, status: 'failed', error: err.message, body });
    return { sent: false, mock: false, status: 'failed', error: err.message, reason: 'provider_failed', detail: `The WhatsApp provider failed: ${err.message}` };
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
        data: { contact_name: c.name || 'there', owner_name: ownerName || 'A RepiQR user' },
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
  formatWait,
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
