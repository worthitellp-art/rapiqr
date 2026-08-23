/**
 * Live WhatsApp provider.
 *
 * Deliberately thin: the existing smsService already resolves between MSG91 and
 * Twilio and handles test-number redirection and delivery logging, so this
 * adapts the notification contract onto `sendWhatsApp` rather than opening a
 * second, competing integration.
 *
 * Which BSP we buy tomorrow is still open (Meta Cloud API / Gupshup / Twilio).
 * Only this file needs to change if it is one smsService does not already speak.
 *
 * Note: with no credentials configured, `sendWhatsApp` reports
 * `{ sent:false, simulated:true }` rather than throwing — so selecting this
 * provider before the API is purchased degrades to a simulated send, it does not
 * crash a scan.
 */
const { sendWhatsApp } = require('../smsService');

async function send({ to, body, type, templateName, variables = [] }) {
  const result = await sendWhatsApp({
    to,
    body,
    event: `NOTIFY_${type}`,
    templateName,
    variables,
    // Templates are required to open a conversation. Until ours are approved the
    // underlying client falls back to the plain body, which is also what a
    // session message (inside the 24h window) needs.
    isSessionMessage: !templateName,
  });

  return {
    sent: Boolean(result.sent),
    mock: false,
    status: result.sent ? 'sent' : result.simulated ? 'simulated' : 'failed',
    providerMessageId: result.sid || null,
    error: result.error || null,
  };
}

module.exports = { name: 'whatsapp', send };
