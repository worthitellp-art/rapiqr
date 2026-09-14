const nodemailer = require('nodemailer');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Two possible real-delivery paths, tried in this order:
 *  1. Resend (RESEND_API_KEY) — a plain HTTPS API call, no SMTP transport needed.
 *  2. SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) — used only when Resend isn't configured.
 * Without either, sendEmail() still logs exactly what WOULD have been sent
 * (visible in the admin Live Logs page) instead of silently doing nothing —
 * the moment real credentials are added, sends start working with no code changes.
 */
const isResendConfigured = Boolean(process.env.RESEND_API_KEY);
const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const isEmailConfigured = isResendConfigured || isSmtpConfigured;

let transporter = null;
function getTransporter() {
  if (!isSmtpConfigured) return null;
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

async function sendViaResend({ to, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API returned ${response.status}: ${body.slice(0, 300)}`);
  }
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string, event?: string }} opts
 */
async function sendEmail({ to, subject, html, text, event = 'EMAIL_SEND' }) {
  if (!to) {
    logger.warn(event, `Skipped email "${subject}" — no recipient email on file`);
    return { sent: false, simulated: false, reason: 'no_recipient' };
  }

  if (!isEmailConfigured) {
    logger.external(
      event,
      `[SIMULATED] Would send email to ${to}: "${subject}" (set RESEND_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS, in Server/.env to send for real)`,
      { to, subject }
    );
    return { sent: false, simulated: true };
  }

  try {
    if (isResendConfigured) {
      await sendViaResend({ to, subject, html, text });
    } else {
      await getTransporter().sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html, text });
    }
    logger.external(event, `Email sent to ${to}: "${subject}"`, { to, subject });
    return { sent: true, simulated: false };
  } catch (err) {
    logger.error(event, `Failed to send email to ${to}`, err);
    return { sent: false, simulated: false, error: err.message };
  }
}

module.exports = { sendEmail, isEmailConfigured };
