const https = require('https');
const querystring = require('querystring');

// Shared Exotel REST helpers for the masked call bridge. Exotel's Connect
// Call API bridges both legs in a single request — it rings `From` first,
// and once picked up, dials `To` and joins the two legs with `CallerId` (the
// ExoPhone) shown on both sides — so unlike Twilio, no TwiML webhook/
// conference dance is needed (see twilioController.js for that version).

function getExotelCredentials() {
  return {
    apiKey: (process.env.EXOTEL_API_KEY || '').trim(),
    apiToken: (process.env.EXOTEL_API_TOKEN || '').trim(),
    accountSid: (process.env.EXOTEL_ACCOUNT_SID || '').trim(),
    callerId: (process.env.EXOTEL_CALLER_ID || '').trim(),
    apiHost: (process.env.EXOTEL_API_HOST || 'api.exotel.com').trim(),
  };
}

function callExotelApi(creds, method, apiPath, postBody = null) {
  return new Promise((resolve, reject) => {
    const authHeader = 'Basic ' + Buffer.from(`${creds.apiKey}:${creds.apiToken}`).toString('base64');
    const options = {
      hostname: creds.apiHost,
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

module.exports = { getExotelCredentials, callExotelApi };
