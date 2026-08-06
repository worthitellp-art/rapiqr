const crypto = require('crypto');
const { logger } = require('../middleware/loggerMiddleware');
const { getTwilioCredentials, callTwilioApi, resolveAccountAndCallerId } = require('../services/twilioClient');
const ProductModel = require('../models/productModel');

function formatToE164(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `+91${digits}` : (digits.startsWith('91') ? `+${digits}` : `+91${digits.slice(-10)}`);
}

function getPublicBaseUrl() {
  return (process.env.APP_URL || 'https://rapiqr.onrender.com').replace(/\/+$/, '');
}

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

// Twilio trial accounts hard-block the <Dial><Number> verb outright (it's on
// their documented anti-toll-fraud list — a nested Dial spawned from webhook
// TwiML could otherwise let anyone who can reach the URL make your account
// place free calls to arbitrary numbers). <Dial><Conference> is NOT on that
// blocked list, so instead of one call nesting a second via <Dial><Number>,
// we place two independent, separately-authenticated top-level Calls.json
// requests that each join the same short-lived private conference room —
// neither leg is "nested," so the restriction never triggers, on trial or
// paid accounts alike.
const bridgeSessions = new Map();
const BRIDGE_SESSION_TTL_MS = 10 * 60 * 1000;

function createBridgeSession(data) {
  const bridgeId = crypto.randomBytes(16).toString('hex');
  bridgeSessions.set(bridgeId, { ...data, expiresAt: Date.now() + BRIDGE_SESSION_TTL_MS });
  return bridgeId;
}


function consumeBridgeSession(bridgeId) {
  const session = bridgeSessions.get(bridgeId);
  if (!session) return null;
  bridgeSessions.delete(bridgeId);
  if (session.expiresAt < Date.now()) return null;
  return session;
}

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

    const { authUser, authPass, twilioNumber } = getTwilioCredentials();
    if (!authUser || !authPass) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured in Server/.env',
      });
    }

    const cleanVisitor = formatToE164(visitorPhone);
    const cleanTarget = formatToE164(targetPhone);

    const { accountSid, callerId } = await resolveAccountAndCallerId(authUser, authPass, twilioNumber);
    if (!callerId) {
      return res.status(400).json({
        success: false,
        error: 'No Twilio helpline number configured or found on account.',
      });
    }

    const confName = `rapiqr-${crypto.randomBytes(8).toString('hex')}`;
    const bridgeId = createBridgeSession({ targetPhone: cleanTarget, targetLabel, callerId, accountSid, confName });
    const twimlUrl = `${getPublicBaseUrl()}/api/twilio/twiml/bridge/${bridgeId}`;

    logger.event('TWILIO', '📞', `Initiating masked bridge call for QR ${qrId} -> ${targetLabel} via ${callerId}`);

    const callResult = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      To: cleanVisitor,
      From: callerId,
      Url: twimlUrl,
    });

    if (callResult.status >= 200 && callResult.status < 300) {
      return res.json({
        success: true,
        message: 'Masked call bridge initiated! Your phone will ring shortly.',
        callSid: callResult.body.sid,
        status: callResult.body.status,
        maskedHelplineNumber: callerId,
      });
    } else {
      return res.status(callResult.status || 500).json({
        success: false,
        error: callResult.body.message || 'Twilio call failed',
        code: callResult.body.code,
      });
    }
  } catch (err) {
    logger.error('TWILIO_CALL_ERROR', 'Failed to initiate masked bridge call', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Webhook Twilio fetches once the visitor answers, to learn what to do next.
 * POST/GET /api/twilio/twiml/bridge/:bridgeId
 *
 * Public by necessity (Twilio's servers call it, unauthenticated), but the
 * bridgeId is a random one-time token created in initiateMaskedBridgeCall and
 * consumed here — an outsider guessing/replaying it gets an empty hangup, not
 * a real number or a free call. Only now — once the visitor has genuinely
 * answered — do we place the second, independent call to the real target, so
 * the owner is never disturbed if the visitor never picks up.
 */
exports.serveBridgeTwiml = async (req, res) => {
  const session = consumeBridgeSession(req.params.bridgeId);
  res.type('text/xml');

  if (!session) {
    return res.send(`<Response>
  <Say voice="alice" language="en-IN">Sorry, this masked call link has expired.</Say>
</Response>`);
  }

  try {
    const { authUser, authPass } = getTwilioCredentials();
    const ownerTwimlUrl = `${getPublicBaseUrl()}/api/twilio/twiml/conference/${encodeURIComponent(session.confName)}`;
    const targetCallResult = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${session.accountSid}/Calls.json`, {
      To: session.targetPhone,
      From: session.callerId,
      Url: ownerTwimlUrl,
    });
    if (targetCallResult.status >= 200 && targetCallResult.status < 300) {
      logger.event('TWILIO', '📞', `Target leg placed for conference ${session.confName}: ${targetCallResult.body.sid}`);
    } else {
      logger.error('TWILIO_CALL_ERROR', `Target leg REJECTED by Twilio for conference ${session.confName}`, targetCallResult.body);
    }
  } catch (err) {
    logger.error('TWILIO_CALL_ERROR', 'Failed to place the second (target) leg of the masked bridge', err);
  }

  return res.send(`<Response>
  <Say voice="alice" language="en-IN">
    Connecting your masked call. Please stay on the line.
  </Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">${escapeXml(session.confName)}</Conference>
  </Dial>
</Response>`);
};

/**
 * TwiML for the target (owner/emergency contact) leg — joins the same
 * conference the visitor is already in. The spoken identification here is the
 * practical substitute for a branded Caller-ID NAME: India has no public CNAM
 * directory like the US, so we can't control what text a carrier displays,
 * but we can guarantee what the answering side actually hears.
 * POST/GET /api/twilio/twiml/conference/:confName
 */
exports.serveConferenceTwiml = (req, res) => {
  const confName = req.params.confName;
  res.type('text/xml');
  return res.send(`<Response>
  <Say voice="alice" language="en-IN">
    This is a masked call from Rapi Q R. Someone scanned your vehicle sticker and would like to reach you. Connecting you now.
  </Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">${escapeXml(confName)}</Conference>
  </Dial>
</Response>`);
};
