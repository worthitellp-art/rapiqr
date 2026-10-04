// Sends ONE real urgent-alert WhatsApp to the number you pass, through the same
// MSG91 template path the scan page uses, and prints exactly what MSG91 answered.
// It skips the anti-spam cooldowns on purpose, so you can run it repeatedly.
//
// Usage:  node scripts/testWhatsappAlert.js 9876543210
//
// Read the output:
//   success: true  -> MSG91 accepted the message. If it still doesn't arrive,
//                     the fault is on the delivery side (template status, number
//                     opt-in, or the WhatsApp Business account), not this server.
//   success: false -> MSG91 rejected it. The `error` line is the real reason.

const { sendMsg91WhatsApp, formatRecipientMobile } = require('../services/msg91Client');
const { MSG91_TEMPLATES, buildVariables } = require('../services/msg91Templates');

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: node scripts/testWhatsappAlert.js <10-digit mobile number>');
  process.exit(1);
}

const template = MSG91_TEMPLATES.EMERGENCY_ALERT;
const data = {
  item_name: 'TEST VEHICLE',
  message: 'Test alert from the server test script — ignore this message.',
  session: 'test',
};

(async () => {
  console.log('Recipient (formatted):', formatRecipientMobile(phone));
  console.log('Template:', template.name, '| variables:', JSON.stringify(buildVariables('EMERGENCY_ALERT', data)));

  const result = await sendMsg91WhatsApp({
    to: phone,
    templateName: template.name,
    variables: buildVariables('EMERGENCY_ALERT', data),
    body: '',
    languageCode: template.languageCode,
    templateNamespace: template.templateNamespace,
  });

  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(result?.success ? 0 : 2);
})().catch((err) => {
  console.error('Script crashed:', err);
  process.exit(3);
});
