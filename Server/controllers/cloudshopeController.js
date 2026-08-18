const { logger } = require('../middleware/loggerMiddleware');
const { getCloudshopeCredentials, generateQrDid } = require('../services/cloudshopeClient');
const ProductModel = require('../models/productModel');
const HelplineModel = require('../models/helplineModel');

function formatToLocal10(num) {
  const digits = String(num || '').replace(/\D/g, '');
  return digits.length <= 10 ? digits : digits.slice(-10);
}

/**
 * Anonymous QR calling bridge via Cloudshope's outboundCallQr API — active
 * replacement for the Exotel bridge (exotelController.js). Unlike Exotel,
 * Cloudshope never dials anyone from the server: it mints a DID (virtual
 * number) mapped to the resolved target number, which the visitor dials
 * directly from their own phone. Cloudshope's telecom layer bridges the call,
 * and later auto-connects any callback on that DID back to this same
 * visitor. The real number is resolved server-side — from qrId (owner /
 * emergency contact) or from a helplineId (admin-configured provider) — and
 * never sent to, or echoed back to, the browser — only the DID is. The
 * browser can never supply a raw phone number directly; every target is
 * looked up server-side by an id it doesn't control the value of.
 */
exports.getAnonymousCallNumber = async (req, res) => {
  try {
    const { qrId, contactName, helplineId } = req.body;

    let targetPhone;
    let targetLabel;

    if (helplineId) {
      const helpline = await HelplineModel.getById(helplineId);
      if (!helpline || helpline.active === false) {
        return res.status(404).json({ success: false, error: 'That helpline is not available.' });
      }
      targetPhone = helpline.phone;
      targetLabel = helpline.label || 'the helpline';
    } else {
      if (!qrId) {
        return res.status(400).json({ success: false, error: 'qrId is required for anonymous calling.' });
      }

      const product = await ProductModel.getByQrCodeId(qrId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Sticker not found.' });
      }

      targetPhone = product.details?.ownerPhone;
      targetLabel = 'the vehicle owner';
      if (contactName) {
        const contacts = Array.isArray(product.details?.emergencyContacts) ? product.details.emergencyContacts : [];
        const match = contacts.find((c) => String(c?.name || '').trim().toLowerCase() === String(contactName).trim().toLowerCase());
        if (!match?.phone) {
          return res.status(404).json({ success: false, error: 'That emergency contact was not found on this sticker.' });
        }
        targetPhone = match.phone;
        targetLabel = match.name || 'the emergency contact';
      }
    }

    if (!targetPhone) {
      return res.status(404).json({ success: false, error: 'No phone number is registered for this sticker yet.' });
    }

    const creds = getCloudshopeCredentials();
    if (!creds.apiToken) {
      return res.status(500).json({
        success: false,
        error: 'Cloudshope credentials not configured in .env (CLOUDSHOPE_API_TOKEN).',
      });
    }

    const cleanTarget = formatToLocal10(targetPhone);
    const source = helplineId ? `helpline ${helplineId}` : `QR ${qrId}`;
    logger.event('CLOUDSHOPE', '📞', `Requesting anonymous call DID for ${source} -> ${targetLabel}`);

    const result = await generateQrDid(creds, cleanTarget);
    const did = result.body?.data?.did;

    if (result.status >= 200 && result.status < 300 && did) {
      return res.json({
        success: true,
        did,
        label: targetLabel,
        message: `Call ${did} to reach ${targetLabel} — your number stays hidden.`,
      });
    }

    logger.error('CLOUDSHOPE_CALL_ERROR', `Cloudshope DID request failed for ${source}`, result.body);
    return res.status(result.status || 500).json({
      success: false,
      error: result.body?.message || 'Could not generate a call number. Please try again.',
    });
  } catch (err) {
    logger.error('CLOUDSHOPE_CALL_ERROR', 'Failed to generate anonymous call DID', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
