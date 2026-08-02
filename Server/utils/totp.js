/**
 * Minimal RFC 4226 (HOTP) / RFC 6238 (TOTP) implementation using Node's built-in
 * crypto module — no external authenticator-app dependency required.
 */
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;
const WINDOW = 1; // allow ±1 step (±30s) of clock drift

function generateSecret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  return base32Encode(bytes);
}

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.substring(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.substring(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binCode % 10 ** DIGITS).padStart(DIGITS, '0');
}

function generateTOTP(secretBase32, forTime = Date.now()) {
  const counter = Math.floor(forTime / 1000 / STEP_SECONDS);
  return hotp(secretBase32, counter);
}

/**
 * Verify a 6-digit code against the secret, allowing a small window of clock drift.
 */
function verifyTOTP(secretBase32, code, forTime = Date.now()) {
  const cleanCode = String(code || '').trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;
  const counter = Math.floor(forTime / 1000 / STEP_SECONDS);
  for (let errorWindow = -WINDOW; errorWindow <= WINDOW; errorWindow++) {
    if (hotp(secretBase32, counter + errorWindow) === cleanCode) return true;
  }
  return false;
}

function buildOtpauthUrl({ secret, accountName, issuer = 'RapiQR' }) {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  buildOtpauthUrl,
};
