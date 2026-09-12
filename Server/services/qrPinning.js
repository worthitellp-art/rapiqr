const crypto = require('crypto');
const QRCode = require('qrcode'); // pinned to exact 1.5.4 in package.json — see stickerCrypto.js
                                   // for why exact-pin (not ^) matters here.

const ENCODER_NAME = 'qrcode-node';
const ENCODER_VERSION = require('qrcode/package.json').version;

// Rendering-layer defaults for v2 stickers — explicit, never left to the
// encoder's own defaults, so a future library upgrade can't silently change
// output for stickers already issued (old stickers keep whatever values were
// recorded on their own row; these are only "defaults" for new issuance).
const DEFAULT_ECC_LEVEL = 'M';
const DEFAULT_MODULE_SIZE_PX = 8;
const DEFAULT_MARGIN_MODULES = 2;

// qrcode's own ErrorCorrectionLevel module (lib/core/error-correction-level.js)
// represents each level internally as { bit: N }, not as the 'L'/'M'/'Q'/'H'
// string the public API accepts — QRCode.create()'s returned `symbol` exposes
// that internal object, not the string, so it must be mapped back to a label
// before it's stored anywhere (e.g. Mongoose's qr_ecc_level is a String enum).
const ECC_BIT_TO_LABEL = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' };

function normalizeEccLevel(level) {
  if (typeof level === 'string') return level.toUpperCase();
  if (level && typeof level.bit === 'number' && level.bit in ECC_BIT_TO_LABEL) {
    return ECC_BIT_TO_LABEL[level.bit];
  }
  throw new Error(`Unrecognized error correction level: ${JSON.stringify(level)}`);
}

/**
 * Issuance-time only: asks the pinned encoder what QR version and mask
 * pattern it would choose for this exact payload + ECC level, so that
 * decision can be persisted and never re-computed (and therefore never
 * silently changed by a future library upgrade) again for this sticker.
 */
function computePinnedQrParams(payload, eccLevel = DEFAULT_ECC_LEVEL) {
  const symbol = QRCode.create(payload, { errorCorrectionLevel: eccLevel });
  return {
    qrVersion: symbol.version,
    qrEccLevel: normalizeEccLevel(symbol.errorCorrectionLevel),
    qrMaskPattern: symbol.maskPattern,
  };
}

/**
 * Renders a PNG using ONLY explicitly-pinned parameters — every option below
 * must come from the sticker's stored row, never from a default, so
 * regeneration reproduces the exact bit matrix and pixel grid every time.
 */
async function renderPinnedQrPng(payload, pinned) {
  const {
    qrVersion, qrEccLevel, qrMaskPattern,
    moduleSizePx = DEFAULT_MODULE_SIZE_PX,
    marginModules = DEFAULT_MARGIN_MODULES,
    fgColorHex = '#000000',
    bgColorHex = '#FFFFFF',
  } = pinned;

  if (!qrVersion || !qrEccLevel || qrMaskPattern === undefined || qrMaskPattern === null) {
    throw new Error('renderPinnedQrPng requires qrVersion, qrEccLevel and qrMaskPattern to be explicitly set');
  }

  const buffer = await QRCode.toBuffer(payload, {
    type: 'png',
    version: qrVersion,
    errorCorrectionLevel: qrEccLevel,
    maskPattern: qrMaskPattern,
    scale: moduleSizePx,
    margin: marginModules,
    color: { dark: fgColorHex, light: bgColorHex },
  });

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, sha256 };
}

module.exports = {
  ENCODER_NAME,
  ENCODER_VERSION,
  DEFAULT_ECC_LEVEL,
  DEFAULT_MODULE_SIZE_PX,
  DEFAULT_MARGIN_MODULES,
  computePinnedQrParams,
  renderPinnedQrPng,
};
