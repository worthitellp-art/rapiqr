const nodemailer = require('nodemailer');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Real delivery requires SMTP_HOST/SMTP_USER/SMTP_PASS in Server/.env.
 * Without them, sendEmail() still logs exactly what WOULD have been sent
 * (visible in the admin Live Logs page) instead of silently doing nothing —
 * the moment real credentials are added, sends start working with no code changes.
 */
const isEmailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!isEmailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string, event?: string }} opts
 */
async function sendEmail({ to, subject, html, text, event = 'EMAIL_SEND' }) {
  if (!to) {
    logger.warn(event, `Skipped email "${subject}" — no recipient email on file`);
    return { sent: false, simulated: false, reason: 'no_recipient' };
  }

  const t = getTransporter();
  if (!t) {
    logger.external(
      event,
      `[SIMULATED] Would send email to ${to}: "${subject}" (set SMTP_HOST/SMTP_USER/SMTP_PASS in Server/.env to send for real)`,
      { to, subject }
    );
    return { sent: false, simulated: true };
  }

  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html, text });
    logger.external(event, `Email sent to ${to}: "${subject}"`, { to, subject });
    return { sent: true, simulated: false };
  } catch (err) {
    logger.error(event, `Failed to send email to ${to}`, err);
    return { sent: false, simulated: false, error: err.message };
  }
}

module.exports = { sendEmail, isEmailConfigured };
