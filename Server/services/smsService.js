const { logger } = require('../middleware/loggerMiddleware');
const { getTwilioCredentials, callTwilioApi, resolveAccountAndCallerId } = require('./twilioClient');
const MessageModel = require('../models/messageModel');

// While we're validating Twilio end-to-end, only these event types are allowed
// to actually hit the network — everything else (OTP, phone-verify, etc.) stays
// simulated even with real credentials configured, so we don't accidentally
// burn Twilio spend or text a real user before the feature is trusted. Override
// with SMS_LIVE_EVENTS in Server/.env (comma-separated); set it empty/unset to
// go back to fully simulated.
const LIVE_EVENTS = new Set(
  (process.env.SMS_LIVE_EVENTS || 'CHAT_START_SMS,ALERT_SMS,ALERT_SMS_CONTACT')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
);

/**
 * Real delivery requires TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN (or the SK API-key
 * pair) + a Twilio number in Server/.env. Mirrors emailService's contract: without
 * credentials this logs exactly what WOULD have been sent instead of silently
 * doing nothing or lying about success (task.md #5/#13 — the old "SMS & Alert
 * dispatched" banner never actually sent anything).
 * @param {{ to: string, body: string, event?: string }} opts
 */
async function sendSms({ to, body, event = 'SMS_SEND' }) {
  if (!to) {
    return { sent: false, simulated: false, reason: 'no_recipient' };
  }

  const isLiveEligible = LIVE_EVENTS.has(event);
  const { authUser, authPass, twilioNumber } = getTwilioCredentials();
  if (!isLiveEligible || !authUser || !authPass) {
    const reason = !isLiveEligible ? ` ("${event}" isn't in SMS_LIVE_EVENTS)` : ' (set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN in Server/.env to send for real)';
    logger.external(event, `[SIMULATED] Would send SMS to ${to}: "${body}"${reason}`, { to, body });
    MessageModel.record({ channel: 'sms', to, event, status: 'simulated', body });
    return { sent: false, simulated: true };
  }

  // Testing mode: redirect real sends to a fixed test number instead of the
  // actual owner/contact phone on file, so live testing can't reach a real user.
  const testNumber = (process.env.TEST_SMS_NUMBER || '').trim();
  const recipient = testNumber || to;
  const outboundBody = testNumber && testNumber !== to ? `[TEST → meant for ${to}] ${body}` : body;

  try {
    const { accountSid, callerId } = await resolveAccountAndCallerId(authUser, authPass, twilioNumber);
    if (!callerId) {
      logger.warn(event, `No Twilio sender number configured/found — cannot SMS ${recipient}`);
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: 'No Twilio sender number configured', body: outboundBody });
      return { sent: false, simulated: false, error: 'No Twilio sender number configured' };
    }

    const result = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      To: recipient,
      From: callerId,
      Body: outboundBody,
    });

    if (result.status >= 200 && result.status < 300) {
      logger.external(event, `SMS sent to ${recipient}`, { to: recipient, sid: result.body.sid });
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'sent', sid: result.body.sid, body: outboundBody });
      return { sent: true, simulated: false, sid: result.body.sid };
    }

    logger.error(event, `Twilio SMS to ${recipient} failed`, result.body);
    MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: result.body?.message || 'Twilio SMS failed', body: outboundBody });
    return { sent: false, simulated: false, error: result.body?.message || 'Twilio SMS failed' };
  } catch (err) {
    logger.error(event, `Failed to send SMS to ${recipient}`, err);
    MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: err.message, body: outboundBody });
    return { sent: false, simulated: false, error: err.message };
  }
}

/**
 * Same Twilio Messages API as sendSms, just with whatsapp: prefixed numbers.
 * Requires a WhatsApp-enabled Twilio sender in TWILIO_WHATSAPP_NUMBER (the
 * Twilio Sandbox number while testing, or an approved WhatsApp Business
 * sender in production) — falls back to simulated mode without it, same
 * contract as sendSms/sendEmail.
 * @param {{ to: string, body: string, event?: string }} opts
 */
async function sendWhatsApp({ to, body, event = 'WHATSAPP_SEND' }) {
  if (!to) return { sent: false, simulated: false, reason: 'no_recipient' };

  const { authUser, authPass } = getTwilioCredentials();
  const whatsappNumber = (process.env.TWILIO_WHATSAPP_NUMBER || '').trim();

  if (!authUser || !authPass || !whatsappNumber) {
    logger.external(event, `[SIMULATED] Would send WhatsApp to ${to}: "${body}" (set TWILIO_WHATSAPP_NUMBER in Server/.env to send for real)`, { to, body });
    MessageModel.record({ channel: 'whatsapp', to, event, status: 'simulated', body });
    return { sent: false, simulated: true };
  }

  try {
    const { accountSid } = await resolveAccountAndCallerId(authUser, authPass, whatsappNumber);
    const result = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      To: `whatsapp:${to}`,
      From: `whatsapp:${whatsappNumber}`,
      Body: body,
    });

    if (result.status >= 200 && result.status < 300) {
      logger.external(event, `WhatsApp sent to ${to}`, { to, sid: result.body.sid });
      MessageModel.record({ channel: 'whatsapp', to, event, status: 'sent', sid: result.body.sid, body });
      return { sent: true, simulated: false, sid: result.body.sid };
    }

    logger.error(event, `Twilio WhatsApp to ${to} failed`, result.body);
    MessageModel.record({ channel: 'whatsapp', to, event, status: 'failed', error: result.body?.message || 'Twilio WhatsApp failed', body });
    return { sent: false, simulated: false, error: result.body?.message || 'Twilio WhatsApp failed' };
  } catch (err) {
    logger.error(event, `Failed to send WhatsApp to ${to}`, err);
    MessageModel.record({ channel: 'whatsapp', to, event, status: 'failed', error: err.message, body });
    return { sent: false, simulated: false, error: err.message };
  }
}

module.exports = { sendSms, sendWhatsApp };
