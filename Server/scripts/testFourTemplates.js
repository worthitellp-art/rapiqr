// One-off: sends the 4 templates the user asked about directly by their real
// MSG91 template name (bypassing msg91Templates.js's current type->name
// mapping, since LOCATION_SHARED there now points at rapi_tag_scan, not the
// older `location_shared` template) so we find out if each template NAME is
// actually live/approved in MSG91 right now.
//
// Usage: node scripts/testFourTemplates.js 9574713004

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

const { sendMsg91WhatsApp, formatRecipientMobile } = require('../services/msg91Client');

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: node scripts/testFourTemplates.js <10-digit mobile number>');
  process.exit(1);
}

const cases = [
  {
    templateName: 'emergency_contact_added',
    variables: { contact_name: 'Test Contact', owner_name: 'RapiQR Test' },
  },
  {
    templateName: 'qr_activated',
    variables: { label: 'TEST TAG 0001' },
  },
  {
    templateName: 'safe_status',
    variables: { label: 'TEST TAG 0001' },
  },
  {
    templateName: 'location_shared',
    variables: {
      label: 'TEST TAG 0001',
      maps_url: 'https://maps.google.com/?q=23.0225,72.5714',
      link: 'https://repiqr.com/#/dashboard?tab=chat',
    },
  },
];

(async () => {
  console.log('Recipient (formatted):', formatRecipientMobile(phone));
  console.log('='.repeat(60));

  const results = [];
  for (const { templateName, variables } of cases) {
    console.log(`\n--> Sending "${templateName}" with`, JSON.stringify(variables));
    const result = await sendMsg91WhatsApp({
      to: phone,
      templateName,
      variables,
      languageCode: 'en',
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    results.push({ templateName, success: result.success, error: result.error });
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  for (const r of results) {
    console.log(`  ${r.success ? 'OK  ' : 'FAIL'}  ${r.templateName}${r.error ? '  -> ' + (r.error.whatFailed || r.error.message || JSON.stringify(r.error)) : ''}`);
  }

  process.exit(results.every((r) => r.success) ? 0 : 2);
})().catch((err) => {
  console.error('Script crashed:', err);
  process.exit(3);
});
