const { logger } = require('../middleware/loggerMiddleware');
const { getTwilioCredentials, callTwilioApi, resolveAccountAndCallerId } = require('./twilioClient');
const {
  getMsg91Config,
  sendMsg91FlowSms,
  sendMsg91WhatsApp,
  sendMsg91SessionWhatsApp,
  sendMsg91Otp,
  verifyMsg91Otp,
} = require('./msg91Client');
const MessageModel = require('../models/messageModel');

// While validating live delivery, only these event types are allowed to hit
// external networks. Override with SMS_LIVE_EVENTS / WHATSAPP_LIVE_EVENTS in Server/.env (comma-separated).
const LIVE_SMS_EVENTS = new Set(
  (process.env.SMS_LIVE_EVENTS || 'CHAT_START_SMS,ALERT_SMS,ALERT_SMS_CONTACT,PHONE_VERIFY_SMS,ACTIVATION_OTP_SMS')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
);

const LIVE_WHATSAPP_EVENTS = new Set(
  (
    process.env.WHATSAPP_LIVE_EVENTS ||
    process.env.SMS_LIVE_EVENTS ||
    'CHAT_START_WHATSAPP,ALERT_WHATSAPP,ALERT_WHATSAPP_CONTACT,PHONE_VERIFY_WHATSAPP,ACTIVATION_OTP_WHATSAPP,WHATSAPP_SEND'
  )
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
);

/**
 * Resolves which SMS provider to use based on configuration and availability.
 * Priority: Explicit SMS_PROVIDER setting ('msg91' | 'twilio') -> MSG91 (if authKey set) -> Twilio -> Simulation
 *
 * @returns {'msg91' | 'twilio' | 'simulated'}
 */
function resolveSmsProvider() {
  const preferred = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const msg91Config = getMsg91Config();
  const twilioConfig = getTwilioCredentials();

  if (preferred === 'msg91' && msg91Config.isConfigured) return 'msg91';
  if (preferred === 'twilio' && twilioConfig.authUser && twilioConfig.authPass) return 'twilio';

  if (msg91Config.isConfigured) return 'msg91';
  if (twilioConfig.authUser && twilioConfig.authPass) return 'twilio';

  return 'simulated';
}

/**
 * Resolves which WhatsApp provider to use based on configuration and availability.
 * Priority: Explicit WHATSAPP_PROVIDER setting ('msg91' | 'twilio') -> MSG91 (if integrated number set) -> Twilio -> Simulation
 *
 * @returns {'msg91' | 'twilio' | 'simulated'}
 */
function resolveWhatsAppProvider() {
  const preferred = (process.env.WHATSAPP_PROVIDER || process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const msg91Config = getMsg91Config();
  const { authUser, authPass } = getTwilioCredentials();
  const twilioWhatsAppNumber = (process.env.TWILIO_WHATSAPP_NUMBER || '').trim();

  const msg91Ready = Boolean(msg91Config.isConfigured && msg91Config.whatsappIntegratedNumber);
  const twilioReady = Boolean(authUser && authPass && twilioWhatsAppNumber);

  if (preferred === 'msg91' && msg91Ready) return 'msg91';
  if (preferred === 'twilio' && twilioReady) return 'twilio';

  if (msg91Ready) return 'msg91';
  if (twilioReady) return 'twilio';

  return 'simulated';
}

/**
 * Dispatches an SMS using the active messaging provider (MSG91 or Twilio).
 * Falls back to simulation if credentials are not configured or the event is not live-eligible.
 *
 * @param {{ to: string, body: string, event?: string, flowId?: string, variables?: Record<string, any> }} opts
 * @returns {Promise<{ sent: boolean, simulated: boolean, sid?: string, error?: string, reason?: string }>}
 */
async function sendSms({ to, body, event = 'SMS_SEND', flowId, variables }) {
  if (!to) {
    return { sent: false, simulated: false, reason: 'no_recipient' };
  }

  const isLiveEligible = LIVE_SMS_EVENTS.has(event);
  const provider = resolveSmsProvider();

  // If not eligible for live send or no provider credentials configured
  if (!isLiveEligible || provider === 'simulated') {
    const reason = !isLiveEligible
      ? ` ("${event}" isn't in SMS_LIVE_EVENTS)`
      : ' (configure MSG91_AUTH_KEY or TWILIO credentials in Server/.env to send for real)';
    logger.external(event, `[SIMULATED] Would send SMS to ${to}: "${body}"${reason}`, { to, body });
    MessageModel.record({ channel: 'sms', to, event, status: 'simulated', body });
    return { sent: false, simulated: true };
  }

  // Testing mode: redirect real sends to a fixed test number if set
  const testNumber = (process.env.TEST_SMS_NUMBER || '').trim();
  const recipient = testNumber || to;
  const outboundBody = testNumber && testNumber !== to ? `[TEST -> meant for ${to}] ${body}` : body;

  // --- 1. MSG91 SMS Execution ---
  if (provider === 'msg91') {
    try {
      const msg91Result = await sendMsg91FlowSms({
        to: recipient,
        flowId,
        variables,
        body: outboundBody,
      });

      if (msg91Result.success) {
        logger.external(event, `MSG91 SMS sent to ${recipient}`, { to: recipient, messageId: msg91Result.messageId });
        MessageModel.record({ channel: 'sms', to: recipient, event, status: 'sent', sid: msg91Result.messageId, body: outboundBody });
        return { sent: true, simulated: false, sid: msg91Result.messageId };
      }

      logger.error(event, `MSG91 SMS to ${recipient} failed`, msg91Result.error);
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: msg91Result.error, body: outboundBody });
      return { sent: false, simulated: false, error: msg91Result.error };
    } catch (err) {
      logger.error(event, `Exception while sending MSG91 SMS to ${recipient}`, err);
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: err.message, body: outboundBody });
      return { sent: false, simulated: false, error: err.message };
    }
  }

  // --- 2. Twilio SMS Execution ---
  if (provider === 'twilio') {
    const { authUser, authPass, twilioNumber } = getTwilioCredentials();
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
        logger.external(event, `Twilio SMS sent to ${recipient}`, { to: recipient, sid: result.body.sid });
        MessageModel.record({ channel: 'sms', to: recipient, event, status: 'sent', sid: result.body.sid, body: outboundBody });
        return { sent: true, simulated: false, sid: result.body.sid };
      }

      logger.error(event, `Twilio SMS to ${recipient} failed`, result.body);
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: result.body?.message || 'Twilio SMS failed', body: outboundBody });
      return { sent: false, simulated: false, error: result.body?.message || 'Twilio SMS failed' };
    } catch (err) {
      logger.error(event, `Failed to send Twilio SMS to ${recipient}`, err);
      MessageModel.record({ channel: 'sms', to: recipient, event, status: 'failed', error: err.message, body: outboundBody });
      return { sent: false, simulated: false, error: err.message };
    }
  }

  return { sent: false, simulated: true };
}

/**
 * Dispatches a WhatsApp notification using MSG91 WhatsApp Outbound API or Twilio WhatsApp.
 * Supports template outbound messages with components, session messages, test redirects, and database logging.
 *
 * @param {{ to: string|string[], body?: string, event?: string, templateName?: string, variables?: Record<string, any>, components?: Record<string, any>, headerMediaUrl?: string, isSessionMessage?: boolean, languageCode?: string, templateNamespace?: string }} opts
 * @returns {Promise<{ sent: boolean, simulated: boolean, sid?: string, error?: string, reason?: string }>}
 */
async function sendWhatsApp({
  to,
  body = '',
  event = 'WHATSAPP_SEND',
  templateName,
  variables,
  components,
  headerMediaUrl,
  isSessionMessage = false,
  languageCode,
  templateNamespace,
}) {
  if (!to) return { sent: false, simulated: false, reason: 'no_recipient' };

  const isLiveEligible = LIVE_WHATSAPP_EVENTS.has(event);
  const provider = resolveWhatsAppProvider();

  // If not eligible for live send or no provider credentials configured
  if (!isLiveEligible || provider === 'simulated') {
    const reason = !isLiveEligible
      ? ` ("${event}" isn't in WHATSAPP_LIVE_EVENTS)`
      : ' (configure MSG91_WHATSAPP_INTEGRATED_NUMBER or TWILIO_WHATSAPP_NUMBER in Server/.env to send for real)';
    logger.external(event, `[SIMULATED] Would send WhatsApp to ${to}: "${body}"${reason}`, { to, body });
    MessageModel.record({ channel: 'whatsapp', to: Array.isArray(to) ? to.join(',') : to, event, status: 'simulated', body });
    return { sent: false, simulated: true };
  }

  // Testing mode: redirect real sends to a fixed test number if set
  const testNumber = (process.env.TEST_WHATSAPP_NUMBER || process.env.TEST_SMS_NUMBER || '').trim();
  const recipient = testNumber || to;
  const outboundBody = testNumber && testNumber !== to ? `[TEST -> meant for ${to}] ${body}` : body;

  // --- 1. MSG91 WhatsApp Execution ---
  if (provider === 'msg91') {
    try {
      const msg91Res = isSessionMessage
        ? await sendMsg91SessionWhatsApp({
            to: recipient,
            text: outboundBody,
          })
        : await sendMsg91WhatsApp({
            to: recipient,
            templateName,
            variables,
            components,
            body: outboundBody,
            headerMediaUrl,
            languageCode,
            templateNamespace,
          });

      if (msg91Res.success) {
        logger.external(event, `MSG91 WhatsApp sent to ${recipient}`, { to: recipient, sid: msg91Res.messageId });
        MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'sent', sid: msg91Res.messageId, body: outboundBody });
        return { sent: true, simulated: false, sid: msg91Res.messageId };
      }

      logger.error(event, `MSG91 WhatsApp to ${recipient} failed`, msg91Res.error);
      MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'failed', error: msg91Res.error, body: outboundBody });
      return { sent: false, simulated: false, error: msg91Res.error };
    } catch (err) {
      logger.error(event, `Exception while sending MSG91 WhatsApp to ${recipient}`, err);
      MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'failed', error: err.message, body: outboundBody });
      return { sent: false, simulated: false, error: err.message };
    }
  }

  // --- 2. Twilio WhatsApp Execution ---
  if (provider === 'twilio') {
    const { authUser, authPass } = getTwilioCredentials();
    const twilioWhatsAppNumber = (process.env.TWILIO_WHATSAPP_NUMBER || '').trim();

    try {
      const { accountSid } = await resolveAccountAndCallerId(authUser, authPass, twilioWhatsAppNumber);
      const result = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        To: `whatsapp:${recipient}`,
        From: `whatsapp:${twilioWhatsAppNumber}`,
        Body: outboundBody,
      });

      if (result.status >= 200 && result.status < 300) {
        logger.external(event, `Twilio WhatsApp sent to ${recipient}`, { to: recipient, sid: result.body.sid });
        MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'sent', sid: result.body.sid, body: outboundBody });
        return { sent: true, simulated: false, sid: result.body.sid };
      }

      logger.error(event, `Twilio WhatsApp to ${recipient} failed`, result.body);
      MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'failed', error: result.body?.message || 'Twilio WhatsApp failed', body: outboundBody });
      return { sent: false, simulated: false, error: result.body?.message || 'Twilio WhatsApp failed' };
    } catch (err) {
      logger.error(event, `Failed to send Twilio WhatsApp to ${recipient}`, err);
      MessageModel.record({ channel: 'whatsapp', to: recipient, event, status: 'failed', error: err.message, body: outboundBody });
      return { sent: false, simulated: false, error: err.message };
    }
  }

  return { sent: false, simulated: true };
}

// Authentication-category templates (unlike the rest of the WhatsApp catalogue in
// msg91Templates.js) don't support named variables or custom body text — Meta
// auto-generates "{{1}} is your verification code." and expects a single
// positional component, hence the fixed `body_1` key here rather than a named one.
const OTP_WHATSAPP_TEMPLATE = 'otp_verification';

/**
 * Sends a WhatsApp OTP via the `otp_verification` Authentication template.
 *
 * @param {{ to: string, code: string|number, event: string }} opts
 * @returns {Promise<{ sent: boolean, simulated: boolean, sid?: string, error?: string, reason?: string }>}
 */
async function sendWhatsAppOtp({ to, code, event }) {
  return sendWhatsApp({
    to,
    body: `Your RapiQR verification code is ${code}.`,
    event,
    templateName: OTP_WHATSAPP_TEMPLATE,
    components: { body_1: { type: 'text', value: String(code) } },
  });
}

module.exports = {
  sendSms,
  sendWhatsApp,
  sendWhatsAppOtp,
  sendMsg91Otp,
  verifyMsg91Otp,
  sendMsg91WhatsApp,
  sendMsg91SessionWhatsApp,
  getMsg91Config,
  resolveSmsProvider,
  resolveWhatsAppProvider,
};
