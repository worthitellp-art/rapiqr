/**
 * One-off manual test: send a real MSG91 OTP SMS to a phone number via the
 * MSG91 Dedicated OTP API (sendMsg91Otp in services/msg91Client.js).
 * Run: node scripts/testMsg91Otp.js <10-digit-mobile>
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const { getMsg91Config } = require('../services/msg91Client');
const { sendSmsOtp, resolveSmsProvider } = require('../services/smsService');

async function main() {
  const mobile = process.argv[2] || '9574713004';
  const config = getMsg91Config();

  console.log('MSG91 config:', {
    authKeySet: config.isConfigured,
    senderId: config.senderId,
    smsFlowId: config.smsFlowId || '(none)',
    otpTemplateId: config.otpTemplateId || '(none)',
  });
  console.log('Resolved SMS provider:', resolveSmsProvider());
  console.log('SMS_LIVE_EVENTS:', process.env.SMS_LIVE_EVENTS);

  if (!config.isConfigured) {
    console.error('MSG91_AUTH_KEY is not set — aborting.');
    process.exit(1);
  }

  const code = '482913';
  console.log(`Sending OTP (via sendSmsOtp, event PHONE_VERIFY_SMS) to +91${mobile}...`);
  const result = await sendSmsOtp({
    to: `+91${mobile}`,
    code,
    body: `Your RapiQR phone verification code is ${code}. It expires in 5 minutes.`,
    event: 'PHONE_VERIFY_SMS',
  });
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
