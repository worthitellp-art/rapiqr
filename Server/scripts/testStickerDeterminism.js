/**
 * Standalone determinism test for the id-scheme v2 sticker crypto + QR
 * pinning pipeline — no MongoDB/network required, exercises the real
 * modules used by QrModel.saveV2 / QrModel.recoverByCodeV2 directly.
 *
 *   node Server/scripts/testStickerDeterminism.js
 */
const assert = require('assert');
const {
  generateRecoveryCodeV2,
  deriveStickerIdV2,
  hashRecoveryCodeV2,
  isValidCodeFormat,
  normalizeCode,
} = require('../services/stickerCrypto');
const { computePinnedQrParams, renderPinnedQrPng } = require('../services/qrPinning');

function section(name, fn) {
  process.stdout.write(`- ${name} ... `);
  fn();
  console.log('ok');
}

async function asyncSection(name, fn) {
  process.stdout.write(`- ${name} ... `);
  await fn();
  console.log('ok');
}

async function main() {
  console.log('Sticker id-scheme v2 determinism tests\n');

  section('recovery code format is valid and check-symbol catches typos', () => {
    const code = generateRecoveryCodeV2();
    assert.strictEqual(isValidCodeFormat(code), true, 'freshly generated code must validate');

    const normalized = normalizeCode(code);
    const flipped = normalized.slice(0, -2) + (normalized.at(-2) === 'A' ? 'B' : 'A') + normalized.at(-1);
    assert.notStrictEqual(flipped, normalized);
    // A single-character corruption should usually fail the checksum. Not a
    // security property (typos aren't attacks) — just a UX sanity check.
    const flippedValid = isValidCodeFormat(flipped);
    assert.strictEqual(flippedValid, false, 'a corrupted code should usually fail the check symbol');
  });

  section('derivation is a pure function of the code', () => {
    const code = generateRecoveryCodeV2();
    const id1 = deriveStickerIdV2(code);
    const id2 = deriveStickerIdV2(code);
    assert.strictEqual(id1, id2, 'same code must always derive the same id');
    assert.strictEqual(id1.length, 26, '128-bit id encoded as 26 Crockford Base32 chars');
  });

  section('different codes derive to different ids (collision sanity check)', () => {
    const ids = new Set();
    for (let i = 0; i < 2000; i++) {
      ids.add(deriveStickerIdV2(generateRecoveryCodeV2()));
    }
    assert.strictEqual(ids.size, 2000, 'no collisions expected at 128 bits over 2000 samples');
  });

  section('id does not trivially reveal the code (formatting independence)', () => {
    const code = generateRecoveryCodeV2();
    const id = deriveStickerIdV2(code);
    assert.notStrictEqual(id, normalizeCode(code), 'id must not just be a re-encoding of the code');
  });

  section('recovery-code hash is deterministic and code-derived', () => {
    const code = generateRecoveryCodeV2();
    assert.strictEqual(hashRecoveryCodeV2(code), hashRecoveryCodeV2(code));
    assert.notStrictEqual(hashRecoveryCodeV2(code), hashRecoveryCodeV2(generateRecoveryCodeV2()));
  });

  section('pinned QR params are plain, Mongoose-storable types (not qrcode\'s internal objects)', () => {
    // Regression test: QRCode.create()'s returned `errorCorrectionLevel` is
    // qrcode's internal { bit: N } object, not a string — computePinnedQrParams
    // must normalize it, or Mongoose's String-enum qr_ecc_level field throws a
    // CastError at save time (caught in production once already).
    const pinned = computePinnedQrParams('https://rapiqr.worthitellp.workers.dev/regression-check');
    assert.strictEqual(typeof pinned.qrEccLevel, 'string', 'qrEccLevel must be a plain string');
    assert.ok(['L', 'M', 'Q', 'H'].includes(pinned.qrEccLevel), 'qrEccLevel must be one of L/M/Q/H');
    assert.strictEqual(typeof pinned.qrVersion, 'number', 'qrVersion must be a plain number');
    assert.strictEqual(typeof pinned.qrMaskPattern, 'number', 'qrMaskPattern must be a plain number');
  });

  await asyncSection('QR rendering is byte-identical across repeated regenerations', async () => {
    const code = generateRecoveryCodeV2();
    const id = deriveStickerIdV2(code);
    const payload = `https://rapiqr.worthitellp.workers.dev/${id}`;

    // Issuance-time: discover and pin version/ECC/mask once.
    const pinnedAtIssuance = computePinnedQrParams(payload);
    const renderParams = {
      ...pinnedAtIssuance,
      moduleSizePx: 8,
      marginModules: 2,
      fgColorHex: '#000000',
      bgColorHex: '#FFFFFF',
    };

    const first = await renderPinnedQrPng(payload, renderParams);
    const second = await renderPinnedQrPng(payload, renderParams);
    const third = await renderPinnedQrPng(payload, renderParams);

    assert.strictEqual(first.sha256, second.sha256, 'render #1 and #2 must match');
    assert.strictEqual(second.sha256, third.sha256, 'render #2 and #3 must match');
    assert.strictEqual(Buffer.compare(first.buffer, second.buffer), 0, 'buffers must be byte-identical, not just same hash');
  });

  await asyncSection('full issue -> recover round trip regenerates byte-identical output', async () => {
    // Simulates QrModel.saveV2 followed by QrModel.recoverByCodeV2, without touching MongoDB.
    const recoveryCode = generateRecoveryCodeV2();
    const id = deriveStickerIdV2(recoveryCode);
    const payload = `https://rapiqr.worthitellp.workers.dev/${id}`;
    const pinned = computePinnedQrParams(payload);
    const renderParams = { ...pinned, moduleSizePx: 8, marginModules: 2, fgColorHex: '#000000', bgColorHex: '#FFFFFF' };

    // Issuance render + stored hash.
    const issued = await renderPinnedQrPng(payload, renderParams);

    // "Recovery" re-derives the id from the code alone and re-renders through
    // the exact same stored parameters.
    const rederivedId = deriveStickerIdV2(recoveryCode);
    assert.strictEqual(rederivedId, id);
    const recovered = await renderPinnedQrPng(payload, renderParams);

    assert.strictEqual(recovered.sha256, issued.rendered_image_sha256 ?? issued.sha256);
    assert.strictEqual(Buffer.compare(recovered.buffer, issued.buffer), 0);
  });

  console.log('\nAll determinism tests passed.');
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
