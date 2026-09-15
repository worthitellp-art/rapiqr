const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { logger } = require('../middleware/loggerMiddleware');

const UPLOADS_ROOT_DIRECTORY = path.resolve(__dirname, '../uploads');
const PRIVATE_UPLOADS_DIRECTORY = path.resolve(UPLOADS_ROOT_DIRECTORY, 'private');

let cachedS3Client = null;

function isS3Configured() {
  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  return Boolean(
    S3_BUCKET && S3_BUCKET.trim() &&
    S3_REGION && S3_REGION.trim() &&
    S3_ACCESS_KEY_ID && S3_ACCESS_KEY_ID.trim() &&
    S3_SECRET_ACCESS_KEY && S3_SECRET_ACCESS_KEY.trim()
  );
}

function getClient() {
  if (cachedS3Client) return cachedS3Client;
  if (!isS3Configured()) {
    return null;
  }

  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;

  cachedS3Client = new S3Client({
    region: S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    // Most non-AWS S3-compatible providers (Cloudflare R2, MinIO) require path-style addressing.
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });

  return cachedS3Client;
}

function getPublicS3Url(key) {
  const customBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (customBaseUrl) {
    return `${customBaseUrl.replace(/\/+$/, '')}/${key}`;
  }

  const { S3_BUCKET, S3_REGION, S3_ENDPOINT } = process.env;
  if (S3_ENDPOINT) {
    return `${S3_ENDPOINT.replace(/\/+$/, '')}/${S3_BUCKET}/${key}`;
  }

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

function getLocalPublicUrl(key) {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const customBaseUrl = process.env.S3_PUBLIC_BASE_URL || process.env.LOCAL_STORAGE_BASE_URL;
  if (customBaseUrl) {
    return `${customBaseUrl.replace(/\/+$/, '')}/${normalizedKey}`;
  }

  // During local development, route through localhost port to avoid external host mismatches
  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const serverPort = process.env.PORT || 5000;

  if (isDevelopmentEnvironment) {
    return `http://localhost:${serverPort}/uploads/${normalizedKey}`;
  }

  // /uploads is served by THIS backend (see server.js's express.static mount),
  // not the frontend — needs the backend's own public origin (BACKEND_URL),
  // never APP_URL (the web app the user's browser loads).
  const backendBaseUrl = process.env.BACKEND_URL || process.env.APP_URL;
  if (backendBaseUrl) {
    return `${backendBaseUrl.replace(/\/+$/, '')}/uploads/${normalizedKey}`;
  }

  return `http://localhost:${serverPort}/uploads/${normalizedKey}`;
}

async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.promises.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function uploadPublicFile(key, buffer, contentType) {
  if (isS3Configured()) {
    const s3Client = getClient();
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return getPublicS3Url(key);
  }

  // Graceful fallback to local disk storage when cloud S3 is not configured
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const destinationFilePath = path.join(UPLOADS_ROOT_DIRECTORY, normalizedKey);
  const destinationDirectory = path.dirname(destinationFilePath);

  await ensureDirectoryExists(destinationDirectory);
  await fs.promises.writeFile(destinationFilePath, buffer);

  logger.event('STORAGE', '📁', `Saved public attachment locally: ${normalizedKey} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return getLocalPublicUrl(normalizedKey);
}

/**
 * Upload private objects (such as compliance log archives).
 * Supports cloud S3 when configured, or local private storage when running standalone.
 */
async function uploadPrivateFile(key, buffer, contentType = 'application/octet-stream', metadata = {}) {
  if (isS3Configured()) {
    const s3Client = getClient();
    const bucketName = process.env.S3_AUDIT_BUCKET || process.env.S3_BUCKET;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: process.env.S3_ENDPOINT ? undefined : 'AES256',
      Metadata: metadata,
    }));
    return { bucket: bucketName, key };
  }

  // Local private filesystem storage fallback
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const destinationFilePath = path.join(PRIVATE_UPLOADS_DIRECTORY, normalizedKey);
  const destinationDirectory = path.dirname(destinationFilePath);

  await ensureDirectoryExists(destinationDirectory);
  await fs.promises.writeFile(destinationFilePath, buffer);

  logger.event('STORAGE', '🔒', `Saved private archive locally: ${normalizedKey} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return { bucket: 'local-filesystem', key: normalizedKey };
}

async function deleteFiles(keys) {
  const fileKeyList = keys.filter(Boolean);
  if (!fileKeyList.length) return;

  if (isS3Configured()) {
    const s3Client = getClient();
    await s3Client.send(new DeleteObjectsCommand({
      Bucket: process.env.S3_BUCKET,
      Delete: { Objects: fileKeyList.map((Key) => ({ Key })) },
    }));
    return;
  }

  // Local filesystem deletion fallback
  for (const key of fileKeyList) {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const publicFilePath = path.join(UPLOADS_ROOT_DIRECTORY, normalizedKey);
    const privateFilePath = path.join(PRIVATE_UPLOADS_DIRECTORY, normalizedKey);

    await fs.promises.unlink(publicFilePath).catch(() => {});
    await fs.promises.unlink(privateFilePath).catch(() => {});
  }
}

async function listKeys(prefix = '') {
  if (isS3Configured()) {
    const s3Client = getClient();
    const matchedKeys = [];
    let continuationToken;
    do {
      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      (response.Contents || []).forEach((item) => matchedKeys.push(item.Key));
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
    return matchedKeys;
  }

  // Local filesystem scan fallback
  const collectedKeys = [];

  async function scanDirectoryRecursively(currentDirectory) {
    let directoryEntries;
    try {
      directoryEntries = await fs.promises.readdir(currentDirectory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of directoryEntries) {
      const fullPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await scanDirectoryRecursively(fullPath);
      } else if (entry.isFile()) {
        const relativeKey = path.relative(UPLOADS_ROOT_DIRECTORY, fullPath).replace(/\\/g, '/');
        if (!prefix || relativeKey.startsWith(prefix)) {
          collectedKeys.push(relativeKey);
        }
      }
    }
  }

  await scanDirectoryRecursively(UPLOADS_ROOT_DIRECTORY);
  return collectedKeys;
}

module.exports = {
  uploadPublicFile,
  uploadPrivateFile,
  deleteFiles,
  listKeys,
  isS3Configured,
};
