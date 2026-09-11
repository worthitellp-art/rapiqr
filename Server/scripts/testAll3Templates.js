/**
 * Test first 3 MSG91 WhatsApp templates end-to-end.
 *
 * Templates tested:
 *   1. qr_scan_alert            (QR_SCAN_ALERT)
 *   2. emergency_alert          (EMERGENCY_ALERT)
 *   3. emergency_contact_alert  (EMERGENCY_CONTACT_ALERT)
 *
 * Usage:
 *   node Server/scripts/testAll3Templates.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getTemplate, buildVariables, buildBody } = require('../services/notificationTemplates');
const { sendWhatsApp } = require('../services/smsService');

const RECIPIENT = '9574713004'; // +91 9574713004
const SENDER   = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER || '';

const tests = [
  {
    TYPE: 'QR_SCAN_ALERT',
    data: { label: 'Car MH 12 AB 1234', message: 'Test scan alert from RepiQR.', link: 'https://rapiqr.worthitellp.workers.dev/#/dashboard' },
  },
  {
    TYPE: 'EMERGENCY_ALERT',
    data: { label: 'Car MH 12 AB 1234', message: 'Test emergency alert from RepiQR.', link: 'https://rapiqr.worthitellp.workers.dev/#/dashboard' },
  },
  {
    TYPE: 'EMERGENCY_CONTACT_ALERT',
    data: { label: 'Car MH 12 AB 1234', message: 'Test emergency contact alert from RepiQR.' },
  },
];

(async () => {
  console.log('=== MSG91 WhatsApp Template Test ===\n');
  console.log(`Sender  : ${SENDER}`);
  console.log(`Recipient: +91 ${RECIPIENT}\n`);

  for (const t of tests) {
    const tpl = getTemplate(t.TYPE);
    if (!tpl) { console.log(`❌ Template "${t.TYPE}" not found\n`); continue; }

    console.log(`--- ${t.TYPE} (msg91: ${tpl.templateName}) ---`);
    console.log(`Variables: ${JSON.stringify(buildVariables(t.TYPE, t.data))}`);
    console.log(`Body preview: ${buildBody(t.TYPE, t.data).slice(0, 120)}...`);
    console.log('Sending...');

    try {
      const result = await sendWhatsApp({
        to: RECIPIENT,
        body: buildBody(t.TYPE, t.data),
        event: `NOTIFY_${t.TYPE}`,
        templateName: tpl.templateName,
        variables: buildVariables(t.TYPE, t.data),
      });

      if (result.sent) {
        console.log(`✅ SENT — message_id: ${result.sid}\n`);
      } else if (result.simulated) {
        console.log(`⚠️  SIMULATED (${result.reason || 'no live provider'}) — nothing was sent.\n`);
      } else {
        console.log(`❌ FAILED: ${result.error}\n`);
      }
    } catch (err) {
      console.log(`❌ EXCEPTION: ${err.message}\n`);
    }
  }

  console.log('=== Done ===');
})();
