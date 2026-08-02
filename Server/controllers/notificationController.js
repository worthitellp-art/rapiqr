const { sendEmail } = require('../services/emailService');
const { logger } = require('../middleware/loggerMiddleware');

const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

class NotificationController {
  /**
   * Fired once a sticker activation finishes (after emergency contacts are collected).
   * Sends the owner a confirmation email, plus a sample "test scan" email previewing
   * what a responder sees when they scan the tag — per the Activation Confirmation spec.
   */
  static async sendActivationConfirmation(req, res) {
    try {
      const { qrId, ownerName, ownerEmail, category } = req.body;

      if (!qrId) {
        return res.status(400).json({ success: false, error: 'qrId is required' });
      }

      const name = ownerName || 'there';
      const dashboardUrl = `${APP_URL}/`;

      const confirmation = await sendEmail({
        to: ownerEmail,
        subject: 'Your RapiQR sticker is now active!',
        event: 'ACTIVATION_CONFIRMATION_EMAIL',
        html: `
          <p>Hi ${name},</p>
          <p>Your RapiQR sticker <strong>${qrId}</strong> is now active! It's protecting you with instant scan-and-alert notifications.</p>
          <p>You can manage it, update your emergency contacts, and view scan history anytime on your dashboard:</p>
          <p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
          <p>— The RapiQR Team</p>
        `,
        text: `Hi ${name}, your RapiQR sticker ${qrId} is now active! You can manage it on your dashboard: ${dashboardUrl}`,
      });

      const sample = await sendEmail({
        to: ownerEmail,
        subject: 'What a responder sees when your RapiQR sticker is scanned',
        event: 'SAMPLE_TEST_SCAN_EMAIL',
        html: `
          <p>Hi ${name},</p>
          <p>Here's a preview of what someone sees the moment they scan your ${category || 'car'} sticker — this is exactly the screen a responder would use to reach you or your emergency contacts:</p>
          <ul>
            <li>Your registered emergency contacts, tap-to-call (numbers are masked from public view)</li>
            <li>One-tap options: wrong parking alert, request roadside help, or report an emergency</li>
            <li>Your live location is shared with you (the owner) the moment someone scans and requests help</li>
          </ul>
          <p>Nothing here reveals your personal contact number directly — all calls are routed anonymously.</p>
          <p>— The RapiQR Team</p>
        `,
        text: `Preview: this is what a responder sees when they scan your ${category || 'car'} sticker — your emergency contacts (masked), quick emergency options, and anonymous call routing.`,
      });

      logger.business('ACTIVATION_CONFIRMATION_SENT', `Activation confirmation flow completed for ${qrId}`, {
        qrId,
        confirmationSent: confirmation.sent,
        confirmationSimulated: confirmation.simulated,
        sampleSent: sample.sent,
        sampleSimulated: sample.simulated,
      });

      return res.json({ success: true, confirmation, sample });
    } catch (err) {
      logger.error('ACTIVATION_CONFIRMATION_SEND_FAILED', 'Failed to send activation confirmation emails', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to send activation confirmation' });
    }
  }
}

module.exports = NotificationController;
