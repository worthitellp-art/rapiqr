const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { getExotelCredentials, callExotelApi } = require('../services/exotelClient');

function formatToE164(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `+91${digits}` : (digits.startsWith('91') ? `+${digits}` : `+91${digits.slice(-10)}`);
}

// Standalone, one-off test of the masked call bridge at the Exotel API level —
// bypasses RapiQR's own backend/DB (no qrId or stored product needed), so it
// isolates whether the Exotel account/credentials/ExoPhone are wired correctly.
// Usage: node Server/scripts/testExotelMaskedCall.js [visitorPhone] [ownerPhone]
// With no args, both legs default to EXOTEL_TRIAL_NUMBER from .env, since a
// trial Exotel account can only place calls to its one verified number.
async function main() {
  const creds = getExotelCredentials();
  const trialNumber = (process.env.EXOTEL_TRIAL_NUMBER || '').trim();

  const visitorPhone = process.argv[2] || trialNumber;
  const ownerPhone = process.argv[3] || trialNumber;

  if (!creds.apiKey || !creds.apiToken || !creds.accountSid || !creds.callerId) {
    console.error('Missing Exotel credentials in .env (need EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_CALLER_ID).');
    process.exit(1);
  }
  if (!visitorPhone || !ownerPhone) {
    console.error('No phone number to call — pass one explicitly or set EXOTEL_TRIAL_NUMBER in .env.');
    process.exit(1);
  }

  const cleanVisitor = formatToE164(visitorPhone);
  const cleanOwner = formatToE164(ownerPhone);

  console.log(`Account SID:     ${creds.accountSid}`);
  console.log(`Masked CallerId: ${creds.callerId}  (this is the ONLY number either party will see)`);
  console.log(`Leg 1 (rings first, "customer/scanner"): ${cleanVisitor}`);
  console.log(`Leg 2 (bridged in after pickup, "owner"): ${cleanOwner}  <- real number, never shown to leg 1`);
  console.log('Placing call via Exotel Connect API...');

  const result = await callExotelApi(creds, 'POST', `/v1/Accounts/${creds.accountSid}/Calls/connect.json`, {
    From: cleanVisitor,
    To: cleanOwner,
    CallerId: creds.callerId,
    CallType: 'trans',
  });

  console.log(`HTTP ${result.status}`);
  console.log(JSON.stringify(result.body, null, 2));

  if (result.status >= 200 && result.status < 300 && result.body?.Call) {
    console.log(`\nCall SID: ${result.body.Call.Sid}, status: ${result.body.Call.Status}`);
    console.log('Success — the owner\'s real number was only ever sent to Exotel server-side, never to a browser/client.');
  } else {
    console.error('\nExotel rejected the call — see response body above (common trial-account cause: To/From number not verified on the account).');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
