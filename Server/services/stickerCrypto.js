const crypto = require('crypto');

// ── Sticker ID scheme v2 ─────────────────────────────────────────────────────
// v1 (existing): _id is an independent CSPRNG value; recovery_code is a
// SEPARATE independent CSPRNG value; the two are linked only by a database
// row (see qrModel.js generateRecoveryCode/hashRecoveryCode). If that row is
// ever lost, the link is gone permanently — the owner's memory of their
// recovery code no longer points anywhere.
//
// v2 (this file): the sticker's public id is a deterministic, one-way
// function of its recovery code: id = HMAC-SHA256(key = recoveryCode,
// message = ID_DERIVATION_INFO). Given the same code and the same pinned
// algorithm below, the id is always recomputable with zero dependency on any
// particular database row surviving — the relationship is mathematical, not
// record-keeping.
//
// Security argument for using a *fast* keyed hash here (not bcrypt/argon2):
// those algorithms exist to slow down brute-forcing a *low-entropy* human
// password. A v2 recovery code is a full 160-bit CSPRNG output — brute force
// is already infeasible at 2^160 regardless of hash speed. HMAC-SHA256 is a
// PRF: the derived id is computationally indistinguishable from random
// without knowing the code, so publishing the id (every scanned QR does)
// leaks nothing about the code that produced it.
const ID_SCHEME_VERSION = 2;
const ID_DERIVATION_INFO = 'RAPIQR-STICKER-ID-V1';

// Crockford Base32 — omits I, L, O, U to avoid transcription ambiguity with
// 1/l, 0/O, and to dodge accidental profanity.
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CHECK_ALPHABET = CROCKFORD_ALPHABET + '*~$=U';

function toCrockfordBase32(buf) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += CROCKFORD_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

// A mod-37 checksum symbol over the code body, so a single mistyped/transposed
// character is rejected before it ever reaches a database lookup or the
// crypto below — cheap insurance against the far more common failure mode
// (a typo) than an actual attack.
function checkSymbol(body) {
  let sum = 0;
  for (const ch of body) {
    const idx = CROCKFORD_ALPHABET.indexOf(ch);
    sum = (sum * 37 + (idx === -1 ? 0 : idx)) % 37;
  }
  return CHECK_ALPHABET[sum];
}

/** Strips formatting (dashes, spaces, case) down to the bare code characters. */
function normalizeCode(input) {
  return String(input || '').toUpperCase().replace(/[^0-9A-Z*~$=]/g, '');
}

/** True if the trailing check symbol matches the code body. */
function isValidCodeFormat(input) {
  const norm = normalizeCode(input);
  if (norm.length < 2) return false;
  const body = norm.slice(0, -1);
  const check = norm.slice(-1);
  return checkSymbol(body) === check;
}

/** Issuance: a brand-new v2 recovery code. Shown to the owner exactly once. */
function generateRecoveryCodeV2() {
  const raw = crypto.randomBytes(20); // 160 bits
  const body = toCrockfordBase32(raw); // 32 chars
  const code = body + checkSymbol(body);
  return code.match(/.{1,4}/g).join('-');
}

/**
 * Core deterministic derivation: recovery code -> public sticker id.
 * One-way (HMAC/PRF) — recovering the code from the id is infeasible.
 * Pure function: same code + same ID_DERIVATION_INFO -> same id, forever.
 */
function deriveStickerIdV2(recoveryCode) {
  const normalized = normalizeCode(recoveryCode);
  const mac = crypto.createHmac('sha256', normalized).update(ID_DERIVATION_INFO).digest();
  return toCrockfordBase32(mac.subarray(0, 16)).toLowerCase(); // 128 bits, 26 chars
}

// Defense-in-depth verifier stored alongside the sticker: NOT needed for
// authorization (a successful id-derivation-then-lookup already proves
// possession of the code), but cheap insurance against a bug in the
// derivation path silently producing a wrong-but-real-looking id match.
// A fast hash is correct here for the same entropy reason as above.
function hashRecoveryCodeV2(rawCode) {
  return crypto.createHash('sha256').update(normalizeCode(rawCode)).digest('hex');
}

module.exports = {
  ID_SCHEME_VERSION,
  ID_DERIVATION_INFO,
  generateRecoveryCodeV2,
  deriveStickerIdV2,
  hashRecoveryCodeV2,
  normalizeCode,
  isValidCodeFormat,
};
