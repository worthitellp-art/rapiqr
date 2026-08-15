const https = require('https');

// Cloudshope's outboundCallQr API mints a DID (virtual number) mapped to the
// target's real number — no TwiML/bridge dance needed, the visitor just
// dials the DID directly and Cloudshope's telecom layer connects the call
// (see cloudshopeController.js for the anonymous-calling flow this powers).

function getCloudshopeCredentials() {
  return {
    apiToken: (process.env.CLOUDSHOPE_API_TOKEN || '').trim(),
    apiHost: (process.env.CLOUDSHOPE_API_HOST || 'panelv3.cloudshope.com').trim(),
  };
}

function generateQrDid(creds, mobileNumber) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify({ mobile_number: mobileNumber });
    const options = {
      hostname: creds.apiHost,
      port: 443,
      path: '/api/outboundCallQr',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        Authorization: `Bearer ${creds.apiToken}`,
      },
    };

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
    req.write(dataString);
    req.end();
  });
}

module.exports = { getCloudshopeCredentials, generateQrDid };
