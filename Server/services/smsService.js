const { logger } = require('../middleware/loggerMiddleware');
const { getTwilioCredentials, callTwilioApi, resolveAccountAndCallerId } = require('./twilioClient');

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

  const { authUser, authPass, twilioNumber } = getTwilioCredentials();
  if (!authUser || !authPass) {
    logger.external(event, `[SIMULATED] Would send SMS to ${to}: "${body}" (set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN in Server/.env to send for real)`, { to, body });
    return { sent: false, simulated: true };
  }

  try {
    const { accountSid, callerId } = await resolveAccountAndCallerId(authUser, authPass, twilioNumber);
    if (!callerId) {
      logger.warn(event, `No Twilio sender number configured/found — cannot SMS ${to}`);
      return { sent: false, simulated: false, error: 'No Twilio sender number configured' };
    }

    const result = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      To: to,
      From: callerId,
      Body: body,
    });

    if (result.status >= 200 && result.status < 300) {
      logger.external(event, `SMS sent to ${to}`, { to, sid: result.body.sid });
      return { sent: true, simulated: false, sid: result.body.sid };
    }

    logger.error(event, `Twilio SMS to ${to} failed`, result.body);
    return { sent: false, simulated: false, error: result.body?.message || 'Twilio SMS failed' };
  } catch (err) {
    logger.error(event, `Failed to send SMS to ${to}`, err);
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
      return { sent: true, simulated: false, sid: result.body.sid };
    }

    logger.error(event, `Twilio WhatsApp to ${to} failed`, result.body);
    return { sent: false, simulated: false, error: result.body?.message || 'Twilio WhatsApp failed' };
  } catch (err) {
    logger.error(event, `Failed to send WhatsApp to ${to}`, err);
    return { sent: false, simulated: false, error: err.message };
  }
}

module.exports = { sendSms, sendWhatsApp };
