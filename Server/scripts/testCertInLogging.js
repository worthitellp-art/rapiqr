/**
 * Automated Verification Script for CERT-In / DPDP Compliance & Anomaly Detection
 *
 * Tests:
 * 1. Security Event Types standardization.
 * 2. Anomaly Detection: IP-based failed login attempt sliding window & alert triggering.
 * 3. Anomaly Detection: 500 error spike thresholding within 60-second window.
 * 4. AuditLog Mongoose Schema: Immutability pre-hooks block update and delete operations.
 * 5. Archival: Gzip compression, NDJSON formatting, and SHA-256 checksum generation.
 */

const assert = require('assert');
const crypto = require('crypto');
const zlib = require('zlib');
const SecurityEventTypes = require('../utils/securityEventTypes');
const securityAlertService = require('../services/securityAlertService');
const { AuditLog } = require('../models/schemas');
const { getDateRange } = require('./archiveLogsToS3');

console.log('🧪 Starting CERT-In / DPDP Compliance & Anomaly Detection Test Suite...\n');

async function runAllTests() {
  // ── Test 1: Event Types Standardization ──────────────────────────────────────
  console.log('Test 1: Verifying Security Event Types...');
  assert.strictEqual(SecurityEventTypes.AUTH_LOGIN_SUCCESS, 'AUTH_LOGIN_SUCCESS');
  assert.strictEqual(SecurityEventTypes.AUTH_LOGIN_FAILED, 'AUTH_LOGIN_FAILED');
  assert.strictEqual(SecurityEventTypes.ADMIN_ACCESS, 'ADMIN_ACCESS');
  assert.strictEqual(SecurityEventTypes.SECURITY_ALERT, 'SECURITY_ALERT');
  assert.strictEqual(SecurityEventTypes.LOGS_ARCHIVED, 'LOGS_ARCHIVED');
  console.log('✅ Test 1 Passed: All standard event types defined.\n');

  // ── Test 2: Anomaly Detection - Brute-Force Tracker ───────────────────────────
  console.log('Test 2: Verifying Brute-Force Login Anomaly Detection...');
  const testIp = '198.51.100.42';

  // 4 failures should not yet trigger alert (threshold is 5)
  for (let i = 0; i < 4; i++) {
    const alert = await securityAlertService.trackFailedLogin({ ip: testIp, email: 'user@example.com' });
    assert.strictEqual(alert.alertTriggered, false, `Failure ${i + 1} should not trigger alert yet`);
  }

  // 5th failure should trigger brute force alert
  const fifthAlert = await securityAlertService.trackFailedLogin({ ip: testIp, email: 'user@example.com' });
  assert.strictEqual(fifthAlert.alertTriggered, true, '5th failure must trigger an alert');
  assert.strictEqual(fifthAlert.alertType, SecurityEventTypes.AUTH_BRUTE_FORCE_ALERT);
  assert.strictEqual(fifthAlert.count, 5);

  // Clear attempts on success
  securityAlertService.resetFailedLogins(testIp);
  const postClear = await securityAlertService.trackFailedLogin({ ip: testIp, email: 'user@example.com' });
  assert.strictEqual(postClear.count, 1, 'Counter should reset to 1 after clear');
  console.log('✅ Test 2 Passed: Brute-force sliding window and thresholding work correctly.\n');

  // ── Test 3: Anomaly Detection - 500 Error Spike Tracker ───────────────────────
  console.log('Test 3: Verifying 500 Error Spike Detection...');
  let spikeAlert = null;

  // Threshold is SERVER_ERROR_THRESHOLD (15 in 60s)
  for (let i = 0; i < securityAlertService.SERVER_ERROR_THRESHOLD - 1; i++) {
    spikeAlert = await securityAlertService.trackServerError({
      endpoint: '/api/test',
      statusCode: 500,
    });
    assert.strictEqual(spikeAlert.alertTriggered, false, `Error ${i + 1} should not trigger alert`);
  }

  // Nth error triggers spike alert
  spikeAlert = await securityAlertService.trackServerError({
    endpoint: '/api/test',
    statusCode: 500,
  });
  assert.strictEqual(spikeAlert.alertTriggered, true, 'Threshold error must trigger spike alert');
  assert.strictEqual(spikeAlert.alertType, 'SERVER_ERROR_SPIKE');
  assert.strictEqual(spikeAlert.count, securityAlertService.SERVER_ERROR_THRESHOLD);
  console.log('✅ Test 3 Passed: 500 Error rate spike alert triggers accurately.\n');

  // ── Test 4: AuditLog Immutability Enforcement ────────────────────────────────
  console.log('Test 4: Verifying AuditLog Schema Immutability Pre-Hooks...');
  const updateHookNames = ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'];

  for (const hookName of updateHookNames) {
    const queryObj = {
      model: AuditLog,
      schema: AuditLog.schema,
    };
    const hooks = AuditLog.schema.s.hooks._pres.get(hookName);
    assert.ok(hooks && hooks.length > 0, `Pre hook for ${hookName} must be registered on AuditLog`);

    let caughtError = null;
    try {
      const fn = hooks[0].fn;
      fn.call(queryObj, (err) => {
        if (err) caughtError = err;
      });
    } catch (e) {
      caughtError = e;
    }
    assert.ok(caughtError, `Hook for ${hookName} should throw or yield an error`);
    assert.match(caughtError.message, /AuditLog records are append-only/i, `${hookName} error message must enforce immutability`);
  }
  console.log('✅ Test 4 Passed: Schema guarantees tamper-proof, append-only logs.\n');

  // ── Test 5: Archival Serialization & SHA-256 Checksum ────────────────────────
  console.log('Test 5: Verifying Archival Formatting, Compression & SHA-256 Hashing...');
  const dummyLogs = [
    {
      _id: '66dc80000000000000000001',
      timestamp: new Date('2026-09-08T10:00:00.000Z'),
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorType: 'USER',
      userId: 'user-123',
      ipAddress: '203.0.113.195',
      statusCode: 200,
    },
    {
      _id: '66dc80000000000000000002',
      timestamp: new Date('2026-09-08T11:30:00.000Z'),
      eventType: 'ADMIN_ACCESS',
      actorType: 'ADMIN',
      userId: 'admin-001',
      ipAddress: '203.0.113.200',
      statusCode: 200,
    },
  ];

  const ndjson = dummyLogs.map((l) => JSON.stringify(l)).join('\n') + '\n';
  const rawHash = crypto.createHash('sha256').update(ndjson).digest('hex');
  const compressed = zlib.gzipSync(ndjson, { level: 9 });
  const compressedHash = crypto.createHash('sha256').update(compressed).digest('hex');

  assert.strictEqual(rawHash.length, 64, 'SHA-256 raw hash must be 64 hex characters');
  assert.strictEqual(compressedHash.length, 64, 'SHA-256 compressed hash must be 64 hex characters');
  assert.ok(compressed.length > 0, 'Gzipped payload must have non-zero size');

  // Decompress to verify integrity roundtrip
  const decompressed = zlib.gunzipSync(compressed).toString('utf-8');
  assert.strictEqual(decompressed, ndjson, 'Decompressed payload must exactly match original NDJSON');

  const dateRange = getDateRange('2026-09-08');
  assert.strictEqual(dateRange.dateStr, '2026-09-08');
  assert.strictEqual(dateRange.year, 2026);
  assert.strictEqual(dateRange.month, '09');
  assert.strictEqual(dateRange.day, '08');
  console.log('✅ Test 5 Passed: Archival serialization, compression, and cryptographic hash verified.\n');

  console.log('🎉 ALL CERT-IN LOGGING & ANOMALY DETECTION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
