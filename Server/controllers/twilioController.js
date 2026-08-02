const { logger } = require('../middleware/loggerMiddleware');
const { getTwilioCredentials, callTwilioApi } = require('../services/twilioClient');

/**
 * Initiate an Anonymous Masked Call Bridge between Visitor & Owner
 * POST /api/twilio/call-bridge
 * Body: { visitorPhone: "+919876543210", ownerPhone: "+919023668558" }
 */
exports.initiateMaskedBridgeCall = async (req, res) => {
  try {
    const { visitorPhone, ownerPhone } = req.body;

    if (!visitorPhone || !ownerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Both visitorPhone and ownerPhone are required for masked calling.',
      });
    }

    const { rawSid, authUser, authPass, twilioNumber } = getTwilioCredentials();

    if (!authUser || !authPass) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured in Server/.env',
      });
    }

    // Format Indian numbers to E.164 (+91)
    const formatNumber = (num) => {
      const digits = num.replace(/\D/g, '');
      return digits.length === 10 ? `+91${digits}` : (digits.startsWith('91') ? `+${digits}` : `+91${digits.slice(-10)}`);
    };

    const cleanVisitor = formatNumber(visitorPhone);
    const cleanOwner = formatNumber(ownerPhone);

    let accountSid = authUser;
    if (authUser.startsWith('SK')) {
      const accountsRes = await callTwilioApi(authUser, authPass, 'GET', '/2010-04-01/Accounts.json');
      if (accountsRes.status === 200 && accountsRes.body.accounts?.length > 0) {
        accountSid = accountsRes.body.accounts[0].sid;
      }
    }

    let callerId = twilioNumber;
    if (!callerId) {
      const numbersRes = await callTwilioApi(authUser, authPass, 'GET', `/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`);
      if (numbersRes.status === 200 && numbersRes.body.incoming_phone_numbers?.length > 0) {
        callerId = numbersRes.body.incoming_phone_numbers[0].phone_number;
      }
    }

    if (!callerId) {
      return res.status(400).json({
        success: false,
        error: 'No Twilio helpline number configured or found on account.',
      });
    }

    // TwiML script: Twilio calls Visitor first, then dials Owner with Caller ID masked to Twilio Helpline number!
    const twimlBridge = `<Response>
  <Say voice="alice" language="en-IN">
    Connecting your emergency masked call with the vehicle owner. Please stay on the line.
  </Say>
  <Dial callerId="${callerId}">
    <Number>${cleanOwner}</Number>
  </Dial>
</Response>`;

    logger.event('TWILIO', '📞', `Initiating Masked Bridge Call from ${cleanVisitor} -> ${cleanOwner} via ${callerId}`);

    const callResult = await callTwilioApi(authUser, authPass, 'POST', `/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      To: cleanVisitor,
      From: callerId,
      Twiml: twimlBridge,
    });

    if (callResult.status >= 200 && callResult.status < 300) {
      return res.json({
        success: true,
        message: 'Masked call bridge initiated! Phone will ring shortly.',
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
