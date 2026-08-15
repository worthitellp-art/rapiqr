const { logger } = require('../middleware/loggerMiddleware');
const { getExotelCredentials, callExotelApi } = require('../services/exotelClient');
const ProductModel = require('../models/productModel');

function formatToE164(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `+91${digits}` : (digits.startsWith('91') ? `+${digits}` : `+91${digits.slice(-10)}`);
}

/**
 * Masked emergency call bridge via Exotel's Connect Call API — the scan-page
 * visitor's phone rings first, and once they pick up, Exotel dials the
 * vehicle owner (or a named emergency contact, resolved server-side from
 * qrId same as the Twilio version) and joins both legs, showing the shared
 * ExoPhone as caller ID on each side. Real numbers are never sent to or
 * echoed back to the browser.
 */
exports.initiateMaskedBridgeCall = async (req, res) => {
  try {
    const { qrId, visitorPhone, contactName } = req.body;

    if (!qrId || !visitorPhone) {
      return res.status(400).json({
        success: false,
        error: 'qrId and visitorPhone are required for masked calling.',
      });
    }

    const product = await ProductModel.getByQrCodeId(qrId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Sticker not found.' });
    }

    let targetPhone = product.details?.ownerPhone;
    let targetLabel = 'the vehicle owner';
    if (contactName) {
      const contacts = Array.isArray(product.details?.emergencyContacts) ? product.details.emergencyContacts : [];
      const match = contacts.find((c) => String(c?.name || '').trim().toLowerCase() === String(contactName).trim().toLowerCase());
      if (!match?.phone) {
        return res.status(404).json({ success: false, error: 'That emergency contact was not found on this sticker.' });
      }
      targetPhone = match.phone;
      targetLabel = match.name || 'the emergency contact';
    }

    if (!targetPhone) {
      return res.status(404).json({ success: false, error: 'No phone number is registered for this sticker yet.' });
    }

    const creds = getExotelCredentials();
    if (!creds.apiKey || !creds.apiToken || !creds.accountSid || !creds.callerId) {
      return res.status(500).json({
        success: false,
        error: 'Exotel credentials not configured in Server/.env (EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_CALLER_ID).',
      });
    }

    const cleanVisitor = formatToE164(visitorPhone);
    const cleanTarget = formatToE164(targetPhone);

    logger.event('EXOTEL', '📞', `Initiating masked bridge call for QR ${qrId} -> ${targetLabel} via ${creds.callerId}`);

    const callResult = await callExotelApi(creds, 'POST', `/v1/Accounts/${creds.accountSid}/Calls/connect.json`, {
      From: cleanVisitor,
      To: cleanTarget,
      CallerId: creds.callerId,
      CallType: 'trans',
    });

    if (callResult.status >= 200 && callResult.status < 300 && callResult.body?.Call) {
      return res.json({
        success: true,
        message: 'Masked call bridge initiated! Your phone will ring shortly.',
        callSid: callResult.body.Call.Sid,
        status: callResult.body.Call.Status,
        maskedHelplineNumber: creds.callerId,
      });
    }

    logger.error('EXOTEL_CALL_ERROR', `Exotel call bridge failed for QR ${qrId}`, callResult.body);
    return res.status(callResult.status || 500).json({
      success: false,
      error: callResult.body?.RestException?.Message || callResult.body?.message || 'Exotel call failed',
    });
  } catch (err) {
    logger.error('EXOTEL_CALL_ERROR', 'Failed to initiate masked bridge call', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
