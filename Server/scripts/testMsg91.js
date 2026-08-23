require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const {
  formatRecipientMobile,
  getMsg91Config,
  buildMsg91WhatsAppComponents,
} = require('../services/msg91Client');
const {
  sendSms,
  sendWhatsApp,
  resolveSmsProvider,
  resolveWhatsAppProvider,
} = require('../services/smsService');

async function runTests() {
  console.log('====================================================');
  console.log('             MSG91 INTEGRATION TEST SUITE           ');
  console.log('====================================================\n');

  // 1. Test Number Sanitizer
  console.log('1. Testing Phone Number Sanitization:');
  const numberSamples = [
    { input: '9876543210', expected: '919876543210' },
    { input: '+91 98765 43210', expected: '919876543210' },
    { input: '+1 (555) 234-5678', expected: '15552345678' },
    { input: '919876543210', expected: '919876543210' },
  ];

  for (const { input, expected } of numberSamples) {
    const formatted = formatRecipientMobile(input);
    const pass = formatted === expected;
    console.log(`  ${pass ? '✓' : '✗'} formatRecipientMobile("${input}") => "${formatted}" (Expected: "${expected}")`);
  }

  // 2. Test WhatsApp Template Component Construction
  console.log('\n2. Testing WhatsApp Template Component Builders:');
  const arrayComponents = buildMsg91WhatsAppComponents({
    variables: ['Alex', 'DL-01-AB-1234', 'Wrong Parking'],
  });
  console.log('  Array variables =>', JSON.stringify(arrayComponents));
  if (arrayComponents.body_1?.value === 'Alex' && arrayComponents.body_2?.value === 'DL-01-AB-1234') {
    console.log('  ✓ Array variables correctly mapped to body_1, body_2');
  }

  const objectComponents = buildMsg91WhatsAppComponents({
    variables: { 1: 'OTP-123456', 2: '5 minutes' },
    headerMediaUrl: 'https://rapiqr.com/assets/logo.png',
  });
  console.log('  Object variables with header =>', JSON.stringify(objectComponents));
  if (objectComponents.body_1?.value === 'OTP-123456' && objectComponents.header_1?.value === 'https://rapiqr.com/assets/logo.png') {
    console.log('  ✓ Object variables and header media correctly mapped');
  }

  const bodyFallbackComponents = buildMsg91WhatsAppComponents({
    body: 'Emergency alert message for your vehicle',
  });
  console.log('  Body text fallback =>', JSON.stringify(bodyFallbackComponents));
  if (bodyFallbackComponents.body_1?.value === 'Emergency alert message for your vehicle') {
    console.log('  ✓ Body fallback mapped to body_1');
  }

  // 3. Test Configuration & Provider Resolution
  console.log('\n3. Testing Configuration & Providers:');
  const config = getMsg91Config();
  console.log('  Auth Key Present:', Boolean(config.authKey));
  console.log('  Sender ID:', config.senderId);
  console.log('  Integrated WhatsApp Number:', config.whatsappIntegratedNumber || '(none configured)');
  console.log('  Active SMS Provider:', resolveSmsProvider());
  console.log('  Active WhatsApp Provider:', resolveWhatsAppProvider());

  // 4. Test SMS Dispatch
  console.log('\n4. Testing sendSms (Simulation/Live Dispatch):');
  const smsResult = await sendSms({
    to: '+919023668558',
    body: 'Test MSG91 alert message from RapiQR system',
    event: 'ALERT_SMS',
  });
  console.log('  SMS Result:', smsResult);

  // 5. Test WhatsApp Template Send
  console.log('\n5. Testing sendWhatsApp (Template Dispatch):');
  const waResult = await sendWhatsApp({
    to: '+919023668558',
    templateName: 'rapiqr_alert_notification',
    variables: ['Alex', 'Vehicle Alert', 'https://rapiqr.com'],
    body: 'Test MSG91 WhatsApp notification from RapiQR system',
    event: 'ALERT_WHATSAPP',
  });
  console.log('  WhatsApp Template Result:', waResult);

  // 6. Test WhatsApp Session Send
  console.log('\n6. Testing sendWhatsApp (Session Message):');
  const sessionResult = await sendWhatsApp({
    to: '+919023668558',
    body: 'Hello, someone is at your vehicle.',
    isSessionMessage: true,
    event: 'CHAT_START_WHATSAPP',
  });
  console.log('  WhatsApp Session Result:', sessionResult);

  console.log('\n====================================================');
  console.log('       ALL MSG91 INTEGRATION TESTS COMPLETED        ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed with error:', err);
  process.exit(1);
});

