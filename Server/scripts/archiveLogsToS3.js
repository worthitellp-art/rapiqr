/**
 * CERT-In Compliance Log Archival Job
 *
 * Periodically archives daily AuditLog (and optionally ServerLog) records to
 * immutable cloud object storage (AWS S3, Cloudflare R2, or compatible),
 * compressed with gzip and signed with a cryptographic SHA-256 digest.
 *
 * Usage via CLI:
 *   node scripts/archiveLogsToS3.js
 *   node scripts/archiveLogsToS3.js --date=2026-09-08
 *   node scripts/archiveLogsToS3.js --dry-run
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { AuditLog } = require('../models/schemas');
const { uploadPrivateFile } = require('../services/storageService');
const { logger } = require('../middleware/loggerMiddleware');
const SecurityEventTypes = require('../utils/securityEventTypes');

/**
 * Compute UTC start-of-day and end-of-day for a given YYYY-MM-DD string or Date.
 */
function getDateRange(dateInput) {
  let targetDate;
  if (!dateInput) {
    // Default to yesterday UTC
    targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() - 1);
  } else if (typeof dateInput === 'string') {
    targetDate = new Date(dateInput);
  } else {
    targetDate = dateInput;
  }

  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  return { dateStr, year, month, day, startOfDay, endOfDay };
}

/**
 * Archives AuditLog records for a specific date to S3/R2.
 *
 * @param {string|Date} targetDate - Date to archive
 * @param {Object} options - Configuration options
 * @param {boolean} options.dryRun - If true, skips S3 upload
 * @returns {Promise<Object>} Archival result summary
 */
async function archiveAuditLogsForDate(targetDate, options = {}) {
  const { dryRun = false } = options;
  const { dateStr, year, month, startOfDay, endOfDay } = getDateRange(targetDate);

  logger.info('LOG_ARCHIVE', `Starting audit log archival for ${dateStr}...`);

  // Query all audit logs for the specified day in timestamp order
  const logs = await AuditLog.find({
    timestamp: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ timestamp: 1 })
    .lean()
    .exec();

  const recordCount = logs.length;
  logger.info('LOG_ARCHIVE', `Retrieved ${recordCount} audit log records for ${dateStr}`);

  if (recordCount === 0) {
    return {
      success: true,
      date: dateStr,
      recordCount: 0,
      message: `No audit log records found for ${dateStr}`,
    };
  }

  // Format records as Newline-Delimited JSON (NDJSON)
  const ndjsonPayload = logs.map((log) => JSON.stringify(log)).join('\n') + '\n';
  const rawSha256 = crypto.createHash('sha256').update(ndjsonPayload).digest('hex');

  // Compress using gzip
  const compressedBuffer = zlib.gzipSync(ndjsonPayload, { level: 9 });
  const compressedSha256 = crypto.createHash('sha256').update(compressedBuffer).digest('hex');

  const s3Key = `compliance/audit-logs/${year}/${month}/audit-logs-${dateStr}.ndjson.gz`;

  if (dryRun) {
    logger.info('LOG_ARCHIVE', `[DryRun] Would upload ${recordCount} records (${compressedBuffer.length} bytes) to ${s3Key}`);
    return {
      success: true,
      dryRun: true,
      date: dateStr,
      recordCount,
      s3Key,
      rawSha256,
      compressedSha256,
      sizeBytes: compressedBuffer.length,
    };
  }

  // Upload compressed archive to S3/R2
  const uploadResult = await uploadPrivateFile(
    s3Key,
    compressedBuffer,
    'application/gzip',
    {
      'x-amz-meta-date': dateStr,
      'x-amz-meta-record-count': String(recordCount),
      'x-amz-meta-raw-sha256': rawSha256,
      'x-amz-meta-compressed-sha256': compressedSha256,
    }
  );

  logger.success('LOG_ARCHIVE', `Archived ${recordCount} audit logs to S3: ${s3Key} (SHA-256: ${compressedSha256})`);

  // Record this archival event itself into AuditLog
  try {
    const archivalAuditEntry = new AuditLog({
      timestamp: new Date(),
      eventType: SecurityEventTypes.LOGS_ARCHIVED,
      actorType: 'SYSTEM',
      resourceType: 'AUDIT_LOG_ARCHIVE',
      resourceId: s3Key,
      statusCode: 200,
      metadata: {
        archivedDate: dateStr,
        recordCount,
        s3Bucket: uploadResult.bucket,
        s3Key,
        rawSha256,
        compressedSha256,
        sizeBytes: compressedBuffer.length,
      },
    });
    await archivalAuditEntry.save();
  } catch (err) {
    logger.warn('LOG_ARCHIVE', `Failed to write archival event to AuditLog: ${err.message}`);
  }

  return {
    success: true,
    date: dateStr,
    recordCount,
    s3Key,
    s3Bucket: uploadResult.bucket,
    rawSha256,
    compressedSha256,
    sizeBytes: compressedBuffer.length,
  };
}

/**
 * Standalone CLI Runner
 */
async function runCli() {
  const args = process.argv.slice(2);
  const dateArg = args.find((a) => a.startsWith('--date='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    const result = await archiveAuditLogsForDate(dateArg, { dryRun });
    console.log('Archival Summary:', JSON.stringify(result, null, 2));

    await mongoose.disconnect();
    console.log('Closed MongoDB connection.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Archival job failed:', err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  archiveAuditLogsForDate,
  getDateRange,
};
