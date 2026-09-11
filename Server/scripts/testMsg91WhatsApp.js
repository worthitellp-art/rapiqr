/**
 * Live MSG91 WhatsApp template send test — uses the EXACT production path.
 *
 * This exercises the same code the scan page triggers:
 *   notificationTemplates → buildVariables → smsService.sendWhatsApp → sendMsg91WhatsApp
 *
 * It sends the approved `qr_scan_alert` template (a scan-page style message:
 * label + visitor text + dashboard link). Run it BEFORE scanning a QR to confirm
 * MSG91 has accepted and approved the template, otherwise you will see the
 * "template not approved" style error here instead of inside a live scan.
 *
 * Usage:
 *   node Server/scripts/testMsg91WhatsApp.js [recipientNumber] [--dry-run]
 *
 *   recipientNumber  optional; defaults to TEST_WHATSAPP_NUMBER / TEST_SMS_NUMBER
 *   --dry-run        print the exact payload MSG91 would receive, send nothing.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getTemplate, buildVariables, buildBody } = require('../services/notificationTemplates');
const { sendWhatsApp } = require('../services/smsService');
const { getMsg91Config, buildMsg91WhatsAppComponents } = require('../services/msg91Client');

const DRY_RUN = process.argv.includes('--dry-run');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const recipient =
  (args[0] || '').trim() ||
  process.env.TEST_WHATSAPP_NUMBER ||
  process.env.TEST_SMS_NUMBER ||
  process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER ||
  '';

const TYPE = 'QR_SCAN_ALERT';

const scanPageMessage = process.argv.includes('--message')
  ? process.argv[process.argv.indexOf('--message') + 1]
  : 'I scanned your car tag — your car is blocking the driveway.';

(async () => {
  console.log('📨 MSG91 WhatsApp template send test\n');
  console.log('Template:', TYPE);
  console.log('Template name:', getTemplate(TYPE).templateName);
  console.log('Recipient:', recipient || '(none set — pass a number as the first argument)');
  console.log('Scan-page message:', `"${scanPageMessage}"`);
  console.log('Recipient is a 10-digit local number → will be prefixed "91".\n');

  if (!recipient) {
    console.error('❌ No recipient. Usage: node Server/scripts/testMsg91WhatsApp.js [number] [--dry-run]');
    process.exit(1);
  }

  const cfg = getMsg91Config();
  console.log('Loaded config:');
  console.log('  MSG91_AUTH_KEY set:', Boolean(cfg.authKey));
  console.log('  Integrated number:', cfg.whatsappIntegratedNumber || '(missing)');
  console.log('  Default template:', cfg.whatsappTemplateName || '(missing)');

  const data = {
    label: 'Car GJ 01 XX 0000',
    message: scanPageMessage,
    link: 'https://rapiqr.worthitellp.workers.dev/#/dashboard?tab=chat',
  };

  // Exactly what NotificationService hands the provider in production.
  const variables = buildVariables(TYPE, data);
  const body = buildBody(TYPE, data);

  if (DRY_RUN) {
    console.log('\n── DRY RUN ─────────────────────────────────────────────');
    console.log('Would send template:', getTemplate(TYPE).templateName);
    console.log('Named variables ({{label}}, {{message}}, {{link}}):', variables);
    console.log('Components sent to MSG91:');
    console.log(JSON.stringify(buildMsg91WhatsAppComponents({ variables, body }), null, 2));
    console.log('────────────────────────────────────────────────────────');
    return;
  }

  try {
    const result = await sendWhatsApp({
      to: recipient,
      body,
      event: `NOTIFY_${TYPE}`, // must be present in WHATSAPP_LIVE_EVENTS
      templateName: getTemplate(TYPE).templateName,
      variables,
    });

    if (result.sent) {
      console.log(`\n✅ SENT — message_id: ${result.sid}`);
    } else if (result.simulated) {
      console.log(`\n⚠️  SIMULATED (${result.reason || 'no live provider'}) — nothing was sent.`);
      console.log('   Check: MSG91_AUTH_KEY, MSG91_WHATSAPP_INTEGRATED_NUMBER,');
      console.log('   NOTIFICATION_PROVIDER=whatsapp, and that NOTIFY_QR_SCAN_ALERT is in WHATSAPP_LIVE_EVENTS.');
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
      console.log('   Likely causes: template not created / not approved in MSG91,');
      console.log('   or the template body/variables do not match what you submitted.');
    }
  } catch (err) {
    console.error('\n❌ EXCEPTION:', err.message);
    process.exit(1);
  }
})();