const https = require('https');
const querystring = require('querystring');

// Shared Twilio REST helpers — used by both the SMS service and the masked
// call-bridge controller so the credential/auth logic lives in one place.

function getTwilioCredentials() {
  const rawSid = (process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '').trim();
  let authUser = rawSid;
  let authPass = (process.env.TWILIO_AUTH_TOKEN || '').trim();

  if (rawSid.startsWith('SK') && (process.env.TWILIO_CLIENT_SECRATE || process.env.TWILIO_CLIENT_SECRET)) {
    authPass = (process.env.TWILIO_CLIENT_SECRATE || process.env.TWILIO_CLIENT_SECRET).trim();
  }

  const twilioNumber = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_NUMBER || '').trim();
  return { rawSid, authUser, authPass, twilioNumber };
}

function callTwilioApi(authUser, authPass, method, apiPath, postBody = null) {
  return new Promise((resolve, reject) => {
    const authHeader = 'Basic ' + Buffer.from(`${authUser}:${authPass}`).toString('base64');
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: apiPath,
      method,
      headers: { Authorization: authHeader },
    };

    let dataString = null;
    if (postBody) {
      dataString = querystring.stringify(postBody);
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

/** Resolves the Twilio Account SID (looking it up when only an API Key SID is configured) and a caller/sender number. */
async function resolveAccountAndCallerId(authUser, authPass, twilioNumber) {
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

  return { accountSid, callerId };
}

module.exports = { getTwilioCredentials, callTwilioApi, resolveAccountAndCallerId };
