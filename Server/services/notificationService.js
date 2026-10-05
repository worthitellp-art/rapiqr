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
const { WHATSAPP_ERROR_CODES, createWhatsAppError } = require('../utils/whatsappErrorCatalog');

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

// Emergency alerts: urgent life/vehicle safety messages that must not be held back by long cooldowns
const EMERGENCY_TYPES = new Set(['EMERGENCY_ALERT', 'EMERGENCY_CONTACT_ALERT', 'LOCATION_SHARED']);

// OTP is a login/verification code, never subject to the notification quota —
// capping it could lock a client out of their own account.
// Emergency alerts are also exempt from duplicate windows and routine monthly caps.
const UNLIMITED_TYPES = new Set(['OTP', ...EMERGENCY_TYPES]);

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
 * @returns {Promise<{sent:boolean, mock:boolean, status:string, providerMessageId?:string, error?:object|null}>}
 */
async function notify({ type, to, data = {}, eventId = null }) {
  if (!to) {
    const errorObj = createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.NO_RECIPIENT_PHONE,
      source: 'client',
      whatFailed: 'Recipient phone number is missing',
      whyFailed: 'No phone number was provided to dispatch this notification.',
      safeNextAction: 'Add the owner phone number to this tag in Client Dashboard.',
    });
    return { sent: false, mock: false, status: 'skipped', error: errorObj, detail: errorObj.error.whyFailed };
  }

  const template = getTemplate(type);
  if (!template) {
    logger.warn('NOTIFY', `Unknown notification type "${type}" — nothing sent.`);
    const errorObj = createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.TEMPLATE_NOT_FOUND,
      source: 'app',
      whatFailed: 'Notification template not configured',
      whyFailed: `Unknown notification type "${type}". No matching template found in notification catalogue.`,
      safeNextAction: 'Admin action: register template in notificationTemplates.js.',
    });
    return { sent: false, mock: false, status: 'skipped', error: errorObj, detail: errorObj.error.whyFailed };
  }

  const event = `NOTIFY_${type}`;

  // Short-term anti-spam cooldown: prevent rapid duplicate messages to the same phone.
  // Emergency alerts use a 4-second rapid tap guard; routine alerts use 30s; OTP is exempt.
  if (type !== 'OTP') {
    const isEmergency = EMERGENCY_TYPES.has(type);
    const cooldownMs = isEmergency ? 4 * 1000 : ANTI_SPAM_COOLDOWN_MS;
    const key = `${to}:${type}`;
    const lastSent = RECENT_SENDS.get(key) || 0;
    const now = Date.now();
    if (now - lastSent < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
      logger.warn('NOTIFY', `Anti-spam debounce active for ${to} (${type}) — wait ${waitSec}s.`);
      const errorObj = createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.RATE_LIMIT_DEBOUNCE,
        source: 'app',
        whatFailed: isEmergency ? 'Emergency alert already dispatched' : 'Anti-spam protection active',
        whyFailed: isEmergency
          ? `An emergency WhatsApp was already sent moments ago. The next alert can be dispatched in ${formatWait(waitSec)}.`
          : `The owner was messaged moments ago. The next WhatsApp of this type is allowed in ${formatWait(waitSec)}.`,
        safeNextAction: `Please wait ${waitSec}s before retrying. You can use in-app RepiChat immediately.`,
        retryAfterSec: waitSec,
      });
      const detail = errorObj.error.whyFailed;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'held', reason: 'debounce', retryAfterSec: waitSec, detail, error: errorObj };
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
      const errorObj = createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.RATE_LIMIT_DUPLICATE,
        source: 'app',
        whatFailed: 'Duplicate alert held',
        whyFailed: `This exact alert was just sent to the owner. An identical repeat is held for ${formatWait(waitSec)}.`,
        safeNextAction: `Wait ${waitSec}s or customize your message. In-app chat is always available.`,
        retryAfterSec: waitSec,
      });
      const detail = errorObj.error.whyFailed;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'held', reason: 'duplicate', retryAfterSec: waitSec, detail, error: errorObj };
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
      const errorObj = createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.RATE_LIMIT_MONTHLY_QUOTA,
        source: 'app',
        whatFailed: 'Monthly WhatsApp limit reached',
        whyFailed: `Monthly WhatsApp limit reached for this owner (${monthlyLimit} per month). It resets on ${resetLabel}.`,
        safeNextAction: 'Use in-app RepiChat or initiate a phone call. WhatsApp notifications will resume next month.',
        retryAfterSec,
      });
      const detail = errorObj.error.whyFailed;
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'held', error: detail });
      return { sent: false, mock: false, status: 'limit_reached', reason: 'monthly_limit', retryAfterSec, detail, error: errorObj };
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

    const rawErrorText = typeof result.error === 'object' && result.error?.error?.whyFailed
      ? result.error.error.whyFailed
      : (typeof result.error === 'string' ? result.error : null);

    // Live whatsappProvider already delegates to sendWhatsApp in smsService.js,
    // which records into MessageModel directly. Only record here for other providers (e.g. mockProvider).
    if (provider.name !== 'whatsapp') {
      MessageModel.record({
        channel: 'whatsapp',
        to,
        event,
        status: result.status,
        sid: result.providerMessageId || null,
        error: rawErrorText,
        body,
      });
    }

    const rejected = !result.sent && !result.mock;
    const errorObj = result.error || (rejected ? createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.PROVIDER_REJECTED,
      source: 'msg91',
      whatFailed: 'WhatsApp provider rejected message',
      whyFailed: `The provider rejected the message: ${result.status}`,
      safeNextAction: 'Check developer logs or reach the owner via in-app chat.',
    }) : null);

    return {
      ...result,
      error: errorObj,
      eventId,
      ...(rejected ? {
        reason: result.reason || 'provider_failed',
        detail: errorObj?.error?.whyFailed || `The WhatsApp provider did not accept the message: ${result.status}.`,
      } : {}),
    };
  } catch (err) {
    logger.error('NOTIFY', `Provider "${provider.name}" threw sending ${type} to ${to}`, err);
    const catchErr = createWhatsAppError({
      code: WHATSAPP_ERROR_CODES.HTTP_SERVER_ERROR,
      source: 'app',
      whatFailed: 'Unexpected error in notification service',
      whyFailed: err.message || 'Internal notification service exception',
      safeNextAction: 'Check server logs for diagnostic details.',
      technicalDetails: { stack: err.stack, originalError: err.message },
    });
    if (provider.name !== 'whatsapp') {
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'failed', error: err.message, body });
    }
    return { sent: false, mock: false, status: 'failed', error: catchErr, reason: 'provider_failed', detail: catchErr.error.whyFailed };
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
