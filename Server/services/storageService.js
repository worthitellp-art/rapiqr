const {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

// Works against any S3-compatible provider (AWS S3, Cloudflare R2, Backblaze
// B2, MinIO, ...) — set S3_ENDPOINT for anything that isn't real AWS.
// Replaces the Supabase Storage "Stickers" bucket used for sticker images.
let client = null;

function getClient() {
  if (client) return client;
  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error('Object storage is not configured — set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY in Server/.env.');
  }
  client = new S3Client({
    region: S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    // Most non-AWS S3-compatible providers require path-style addressing.
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

// Bucket must be configured for public read (bucket policy or a CDN in front
// of it) — ACL: 'public-read' isn't sent because several S3-compatible
// providers (e.g. R2) reject or ignore ACLs on the object API.
function publicUrlFor(key) {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/+$/, '')}/${key}`;
  const { S3_BUCKET, S3_REGION, S3_ENDPOINT } = process.env;
  if (S3_ENDPOINT) return `${S3_ENDPOINT.replace(/\/+$/, '')}/${S3_BUCKET}/${key}`;
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

async function uploadPublicFile(key, buffer, contentType) {
  const s3 = getClient();
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return publicUrlFor(key);
}

/**
 * Upload private objects (such as compliance log archives).
 * Does not expose public URL and supports custom metadata/encryption.
 */
async function uploadPrivateFile(key, buffer, contentType = 'application/octet-stream', metadata = {}) {
  const s3 = getClient();
  const bucket = process.env.S3_AUDIT_BUCKET || process.env.S3_BUCKET;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ServerSideEncryption: process.env.S3_ENDPOINT ? undefined : 'AES256',
    Metadata: metadata,
  }));
  return { bucket, key };
}

// Best-effort: callers treat storage cleanup failures as non-fatal (an
// orphaned file is a cost/tidiness issue, not a correctness one).
async function deleteFiles(keys) {
  const list = keys.filter(Boolean);
  if (!list.length) return;
  const s3 = getClient();
  await s3.send(new DeleteObjectsCommand({
    Bucket: process.env.S3_BUCKET,
    Delete: { Objects: list.map((Key) => ({ Key })) },
  }));
}

async function listKeys(prefix) {
  const s3 = getClient();
  const out = [];
  let ContinuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, Prefix: prefix, ContinuationToken }));
    (res.Contents || []).forEach((o) => out.push(o.Key));
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

module.exports = { uploadPublicFile, uploadPrivateFile, deleteFiles, listKeys };
