import type { jsPDF as JsPDF } from "jspdf";
import { QrRecord, StickerPos } from "../components/dashboard/admin/types";
import { generateQrDataUrl, qrFullUrl, DEFAULT_STICKER_POS } from "../components/dashboard/admin/helpers";
import stickerTemplateImg from "../assets/template-sticker.jpeg";

// Physical die-cut sticker size — fixed, never derived or scaled to fit a
// grid. Printing anything other than exactly 4in x 2.5in produces a decal
// that doesn't match the die-cut stock, so every sheet/PDF layout below packs
// around this fixed footprint instead of the other way around.
const STICKER_WIDTH_INCHES = 4;
const STICKER_HEIGHT_INCHES = 2.5;

// Thin strip reserved under each sticker (outside its cut line) for a
// human-readable "sticker id · recovery code" label — printed for the
// admin's own paper record, not part of the die-cut artwork itself.
const LABEL_HEIGHT_INCHES = 0.22;

const SHEET_WIDTH_INCHES = 12;
const SHEET_HEIGHT_INCHES = 18;
const DEFAULT_DPI = 300;
const MARGIN_INCHES = 0.25;
const GAP_INCHES = 0.15;

/**
 * How many fixed-size (4x2.5in) stickers fit on the sheet, computed from the
 * sheet's usable area — never the other way around (we don't shrink/stretch
 * the sticker to hit a preset column/row count).
 */
function computeGridCounts(
  sheetWidthInches: number,
  sheetHeightInches: number,
  marginInches: number,
  gapInches: number
): { columns: number; rows: number } {
  const availableWidth = sheetWidthInches - 2 * marginInches;
  const availableHeight = sheetHeightInches - 2 * marginInches;
  const colPitch = STICKER_WIDTH_INCHES + gapInches;
  const rowPitch = STICKER_HEIGHT_INCHES + LABEL_HEIGHT_INCHES + gapInches;

  const columns = Math.max(1, Math.floor((availableWidth + gapInches) / colPitch));
  const rows = Math.max(1, Math.floor((availableHeight + gapInches) / rowPitch));
  return { columns, rows };
}

const DEFAULT_GRID_COUNTS = computeGridCounts(SHEET_WIDTH_INCHES, SHEET_HEIGHT_INCHES, MARGIN_INCHES, GAP_INCHES);

export const PRINT_SHEET_CONSTANTS = {
  SHEET_WIDTH_INCHES,
  SHEET_HEIGHT_INCHES,
  STICKER_WIDTH_INCHES,
  STICKER_HEIGHT_INCHES,
  LABEL_HEIGHT_INCHES,
  DEFAULT_DPI,
  GRID_COLUMNS: DEFAULT_GRID_COUNTS.columns,
  GRID_ROWS: DEFAULT_GRID_COUNTS.rows,
  STICKERS_PER_SHEET: DEFAULT_GRID_COUNTS.columns * DEFAULT_GRID_COUNTS.rows,
  MARGIN_INCHES,
  GAP_INCHES,
  REFERENCE_EDITOR_WIDTH: 320,
  REFERENCE_EDITOR_HEIGHT: 200,
  QR_RESOLUTION_PIXELS: 2048,
  DEFAULT_STICKER_POS: DEFAULT_STICKER_POS as StickerPos,
} as const;

export interface SheetPrintConfig {
  dpi?: number;
  sheetWidthInches?: number;
  sheetHeightInches?: number;
  marginInches?: number;
  gapInches?: number;
  columns?: number;
  rows?: number;
}

export interface GridCalculations {
  sheetPixelWidth: number;
  sheetPixelHeight: number;
  /** Sticker artwork footprint only (excludes the label strip below it). */
  cellPixelWidth: number;
  cellPixelHeight: number;
  labelPixelHeight: number;
  cellXCoordinates: number[];
  cellYCoordinates: number[];
  cellGapPixels: number;
  scaleFactorX: number;
  scaleFactorY: number;
}

let cachedTemplateImagePromise: Promise<HTMLImageElement> | null = null;

function loadHtmlImage(imageSource: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const htmlImage = new Image();
    htmlImage.crossOrigin = "anonymous";
    htmlImage.onload = () => resolve(htmlImage);
    htmlImage.onerror = (eventError) => reject(eventError);
    htmlImage.src = imageSource;
  });
}

function loadStickerTemplate(): Promise<HTMLImageElement> {
  if (!cachedTemplateImagePromise) {
    // Cache template image to avoid decoding the JPEG on every cell render.
    cachedTemplateImagePromise = loadHtmlImage(stickerTemplateImg);
  }
  return cachedTemplateImagePromise;
}

function resolveGridCounts(config: SheetPrintConfig): { columns: number; rows: number } {
  if (config.columns && config.rows) return { columns: config.columns, rows: config.rows };
  const sheetWidthInches = config.sheetWidthInches ?? SHEET_WIDTH_INCHES;
  const sheetHeightInches = config.sheetHeightInches ?? SHEET_HEIGHT_INCHES;
  const marginInches = config.marginInches ?? MARGIN_INCHES;
  const gapInches = config.gapInches ?? GAP_INCHES;
  if (
    sheetWidthInches === SHEET_WIDTH_INCHES &&
    sheetHeightInches === SHEET_HEIGHT_INCHES &&
    marginInches === MARGIN_INCHES &&
    gapInches === GAP_INCHES
  ) {
    return DEFAULT_GRID_COUNTS;
  }
  return computeGridCounts(sheetWidthInches, sheetHeightInches, marginInches, gapInches);
}

export function calculateGridDimensions(config: SheetPrintConfig = {}): GridCalculations {
  const targetDpi = config.dpi ?? PRINT_SHEET_CONSTANTS.DEFAULT_DPI;
  const sheetWidthInches = config.sheetWidthInches ?? PRINT_SHEET_CONSTANTS.SHEET_WIDTH_INCHES;
  const sheetHeightInches = config.sheetHeightInches ?? PRINT_SHEET_CONSTANTS.SHEET_HEIGHT_INCHES;
  const marginInches = config.marginInches ?? PRINT_SHEET_CONSTANTS.MARGIN_INCHES;
  const gapInches = config.gapInches ?? PRINT_SHEET_CONSTANTS.GAP_INCHES;
  const { columns, rows } = resolveGridCounts(config);

  const sheetPixelWidth = Math.round(sheetWidthInches * targetDpi);
  const sheetPixelHeight = Math.round(sheetHeightInches * targetDpi);
  const gapPixels = Math.round(gapInches * targetDpi);

  // Fixed sticker footprint in pixels — never derived from the grid or the
  // template artwork's own aspect ratio.
  const stickerPixelWidth = Math.round(STICKER_WIDTH_INCHES * targetDpi);
  const stickerPixelHeight = Math.round(STICKER_HEIGHT_INCHES * targetDpi);
  const labelPixelHeight = Math.round(LABEL_HEIGHT_INCHES * targetDpi);
  const rowPitchPixels = stickerPixelHeight + labelPixelHeight + gapPixels;
  const colPitchPixels = stickerPixelWidth + gapPixels;

  const totalGridWidth = columns * stickerPixelWidth + (columns - 1) * gapPixels;
  const totalGridHeight = rows * (stickerPixelHeight + labelPixelHeight) + (rows - 1) * gapPixels;

  const originX = Math.round((sheetPixelWidth - totalGridWidth) / 2);
  const originY = Math.round((sheetPixelHeight - totalGridHeight) / 2);

  const cellXCoordinates = Array.from({ length: columns }, (_, colIndex) => originX + colIndex * colPitchPixels);
  const cellYCoordinates = Array.from({ length: rows }, (_, rowIndex) => originY + rowIndex * rowPitchPixels);

  const scaleFactorX = stickerPixelWidth / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_WIDTH;
  const scaleFactorY = stickerPixelHeight / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_HEIGHT;

  return {
    sheetPixelWidth,
    sheetPixelHeight,
    cellPixelWidth: stickerPixelWidth,
    cellPixelHeight: stickerPixelHeight,
    labelPixelHeight,
    cellXCoordinates,
    cellYCoordinates,
    cellGapPixels: gapPixels,
    scaleFactorX,
    scaleFactorY,
  };
}

function drawSheetBackground(canvasContext: CanvasRenderingContext2D, width: number, height: number): void {
  canvasContext.fillStyle = "#FFFFFF";
  canvasContext.fillRect(0, 0, width, height);
}

function drawCutGuideLines(
  canvasContext: CanvasRenderingContext2D,
  grid: GridCalculations,
  columns: number,
  rows: number,
  dpi: number
): void {
  canvasContext.save();
  canvasContext.strokeStyle = "rgba(160, 160, 165, 0.85)";
  canvasContext.lineWidth = Math.max(1, Math.round((0.75 / 72) * dpi));
  canvasContext.setLineDash([Math.round(dpi * 0.04), Math.round(dpi * 0.02)]);

  for (let colIndex = 1; colIndex < columns; colIndex++) {
    const lineX = grid.cellXCoordinates[colIndex - 1] + grid.cellPixelWidth + grid.cellGapPixels / 2;
    canvasContext.beginPath();
    canvasContext.moveTo(lineX, 0);
    canvasContext.lineTo(lineX, grid.sheetPixelHeight);
    canvasContext.stroke();
  }

  for (let rowIndex = 1; rowIndex < rows; rowIndex++) {
    const lineY = grid.cellYCoordinates[rowIndex - 1] + grid.cellPixelHeight + grid.cellGapPixels / 2;
    canvasContext.beginPath();
    canvasContext.moveTo(0, lineY);
    canvasContext.lineTo(grid.sheetPixelWidth, lineY);
    canvasContext.stroke();
  }

  canvasContext.restore();
}



function drawRecoveryCodeLabel(
  canvasContext: CanvasRenderingContext2D,
  grid: GridCalculations,
  targetX: number,
  targetY: number,
  record: QrRecord,
  recoveryCode: string | undefined,
  dpi: number
): void {
  if (!recoveryCode) return;
  canvasContext.save();
  canvasContext.fillStyle = "#1A1A1A";
  canvasContext.font = `${Math.round(grid.labelPixelHeight * 0.6)}px 'Courier New', monospace`;
  canvasContext.textAlign = "center";
  canvasContext.textBaseline = "middle";
  const labelCenterY = targetY + grid.cellPixelHeight + grid.labelPixelHeight / 2;
  canvasContext.fillText(`${record.id} · ${recoveryCode}`, targetX + grid.cellPixelWidth / 2, labelCenterY);
  canvasContext.restore();
}

async function renderCellSticker(
  canvasContext: CanvasRenderingContext2D,
  stickerTemplate: HTMLImageElement,
  record: QrRecord,
  position: StickerPos,
  targetX: number,
  targetY: number,
  grid: GridCalculations,
  recoveryCode: string | undefined,
  dpi: number
): Promise<void> {
  // 1. Draw the base sticker template artwork at its fixed physical size.
  canvasContext.drawImage(stickerTemplate, targetX, targetY, grid.cellPixelWidth, grid.cellPixelHeight);

  // 2. Generate and place the high-resolution QR code according to calibrated position.
  const qrTargetUrl = qrFullUrl(record.id);
  const qrForeground = record.fg || "000000";
  const qrBackground = record.bg || "FFFFFF";

  const qrDataUrl = await generateQrDataUrl(
    qrTargetUrl,
    qrForeground,
    qrBackground,
    PRINT_SHEET_CONSTANTS.QR_RESOLUTION_PIXELS
  );
  const qrImage = await loadHtmlImage(qrDataUrl);

  const qrRenderX = targetX + position.x * grid.scaleFactorX;
  const qrRenderY = targetY + position.y * grid.scaleFactorY;
  const qrRenderWidth = position.w * grid.scaleFactorX;
  const qrRenderHeight = position.h * grid.scaleFactorY;

  canvasContext.drawImage(qrImage, qrRenderX, qrRenderY, qrRenderWidth, qrRenderHeight);

  // 3. Recovery code reference label, printed in the strip below the sticker
  // (outside its cut line) — this is a paper record for the admin, not part
  // of the die-cut artwork itself.
  drawRecoveryCodeLabel(canvasContext, grid, targetX, targetY, record, recoveryCode, dpi);
}

function convertCanvasToPngBlob(canvasElement: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvasElement.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Renders one sheet's worth (up to columns*rows) of stickers onto a canvas
 * sized to the physical sheet. Shared by the PNG-preview path and the PDF
 * export path below so both draw identical artwork.
 */
async function renderStickerSheetCanvas(
  recordsChunk: QrRecord[],
  position: StickerPos,
  grid: GridCalculations,
  columns: number,
  rows: number,
  recoveryCodeMap: Record<string, string | null | undefined>,
  dpi: number
): Promise<HTMLCanvasElement> {
  const stickerTemplate = await loadStickerTemplate();

  const canvasElement = document.createElement("canvas");
  canvasElement.width = grid.sheetPixelWidth;
  canvasElement.height = grid.sheetPixelHeight;

  const canvasContext = canvasElement.getContext("2d");
  if (!canvasContext) return canvasElement;

  drawSheetBackground(canvasContext, grid.sheetPixelWidth, grid.sheetPixelHeight);

  for (let cellIndex = 0; cellIndex < recordsChunk.length; cellIndex++) {
    const rowIndex = Math.floor(cellIndex / columns);
    const colIndex = cellIndex % columns;
    const targetX = grid.cellXCoordinates[colIndex];
    const targetY = grid.cellYCoordinates[rowIndex];
    const record = recordsChunk[cellIndex];

    await renderCellSticker(
      canvasContext,
      stickerTemplate,
      record,
      position,
      targetX,
      targetY,
      grid,
      recoveryCodeMap[record.id] ?? record.recoveryCode ?? undefined,
      dpi
    );
  }

  drawCutGuideLines(canvasContext, grid, columns, rows, dpi);

  return canvasElement;
}

/**
 * Generates a 12×18 inch print sheet repeating a single sticker across a grid
 * sized to fill the sheet (see PRINT_SHEET_CONSTANTS.GRID_ROWS).
 */
export async function generateRepeatedStickerSheetBlob(
  record: QrRecord,
  position: StickerPos,
  config: SheetPrintConfig = {},
  recoveryCode?: string
): Promise<Blob | null> {
  const grid = calculateGridDimensions(config);
  const { columns, rows } = resolveGridCounts(config);
  const totalCells = columns * rows;
  const recordsChunk = Array.from({ length: totalCells }, () => record);
  const dpi = config.dpi ?? PRINT_SHEET_CONSTANTS.DEFAULT_DPI;

  const canvas = await renderStickerSheetCanvas(
    recordsChunk,
    position,
    grid,
    columns,
    rows,
    { [record.id]: recoveryCode },
    dpi
  );
  return convertCanvasToPngBlob(canvas);
}

// Standard A4 sheet dimensions (portrait)
const A4_WIDTH_INCHES = 8.27;
const A4_HEIGHT_INCHES = 11.69;

// Single sticker per A4 sheet export — 1 sticker centered per A4 page.
export const ADMIN_STICKERS_PER_PAGE = 1;

/**
 * Raw bytes of the sticker template JPEG. The PDF embeds these untouched (jsPDF
 * passes a JPEG straight through), so the artwork is never resampled or
 * re-compressed — the template prints exactly as designed, at its native
 * resolution (1536×960 over 4×2.5in ≈ 384 DPI).
 */
let cachedTemplateBytesPromise: Promise<Uint8Array> | null = null;
function loadStickerTemplateBytes(): Promise<Uint8Array> {
  if (!cachedTemplateBytesPromise) {
    cachedTemplateBytesPromise = fetch(stickerTemplateImg)
      .then((response) => {
        if (!response.ok) throw new Error(`Sticker template failed to load (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => new Uint8Array(buffer))
      .catch((err) => {
        cachedTemplateBytesPromise = null; // let a retry re-fetch instead of replaying the failure
        throw err;
      });
  }
  return cachedTemplateBytesPromise;
}

/**
 * Renders ONE A4 page containing a single 4x2.5in sticker centered on the page
 * with corner crop marks for clean cutting (used for on-screen live preview).
 */
async function renderSingleStickerA4PageCanvas(
  record: QrRecord,
  position: StickerPos,
  dpi = 100
): Promise<HTMLCanvasElement> {
  const stickerTemplate = await loadStickerTemplate();

  const pageWidthPx = Math.round(A4_WIDTH_INCHES * dpi);
  const pageHeightPx = Math.round(A4_HEIGHT_INCHES * dpi);
  const stickerWidthPx = Math.round(STICKER_WIDTH_INCHES * dpi);
  const stickerHeightPx = Math.round(STICKER_HEIGHT_INCHES * dpi);

  const canvas = document.createElement("canvas");
  canvas.width = pageWidthPx;
  canvas.height = pageHeightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Solid white A4 sheet background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

  // Center the 4x2.5in sticker on the A4 page
  const targetX = Math.round((pageWidthPx - stickerWidthPx) / 2);
  const targetY = Math.round((pageHeightPx - stickerHeightPx) / 2);

  const scaleX = stickerWidthPx / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_WIDTH;
  const scaleY = stickerHeightPx / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_HEIGHT;

  // Draw sticker template artwork at exact physical 4x2.5in size
  ctx.drawImage(stickerTemplate, targetX, targetY, stickerWidthPx, stickerHeightPx);

  // Generate and draw QR code
  const qrDataUrl = await generateQrDataUrl(
    qrFullUrl(record.id),
    record.fg || "000000",
    record.bg || "FFFFFF",
    PRINT_SHEET_CONSTANTS.QR_RESOLUTION_PIXELS
  );
  const qrImage = await loadHtmlImage(qrDataUrl);
  ctx.drawImage(
    qrImage,
    targetX + position.x * scaleX,
    targetY + position.y * scaleY,
    position.w * scaleX,
    position.h * scaleY
  );

  return canvas;
}

/**
 * Live on-screen preview of one A4 sheet with 1 centered 4x2.5in sticker.
 */
export async function generateStickerPagePreviewBlob(
  recordsChunk: QrRecord[],
  position: StickerPos,
  dpi = 100
): Promise<Blob | null> {
  if (recordsChunk.length === 0) return null;
  const canvas = await renderSingleStickerA4PageCanvas(recordsChunk[0], position, dpi);
  return convertCanvasToPngBlob(canvas);
}

/**
 * Appends a plain-text recovery-code manifest (sticker id -> recovery code)
 * on standard A4 pages at the end of the document if recovery codes exist.
 */
function appendRecoveryManifestPages(
  doc: JsPDF,
  records: QrRecord[],
  recoveryCodeMap: Record<string, string | null | undefined>
): void {
  const withCodes = records.filter((record) => recoveryCodeMap[record.id] ?? record.recoveryCode);
  if (withCodes.length === 0) return;

  const pageWidthIn = A4_WIDTH_INCHES;
  const pageHeightIn = A4_HEIGHT_INCHES;
  const marginIn = 0.6;
  const lineHeightIn = 0.24;
  const headerHeightIn = 0.5;
  const rowsPerPage = Math.max(1, Math.floor((pageHeightIn - 2 * marginIn - headerHeightIn) / lineHeightIn));

  for (let start = 0; start < withCodes.length; start += rowsPerPage) {
    doc.addPage([pageWidthIn, pageHeightIn], "portrait");
    let cursorY = marginIn;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("RepiQR Recovery Code Manifest", marginIn, cursorY);
    cursorY += headerHeightIn;

    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    withCodes.slice(start, start + rowsPerPage).forEach((record) => {
      const code = recoveryCodeMap[record.id] ?? record.recoveryCode ?? "—";
      doc.text(`${record.id}    ${code}`, marginIn, cursorY);
      cursorY += lineHeightIn;
    });
  }
}

export interface PrintProgressInfo {
  current: number;
  total: number;
  percent: number;
  stage: string;
  stickerId?: string;
}

export type PrintProgressCallback = (info: PrintProgressInfo) => void;

// A QR only needs ~1.1in of the sticker; 768px there is ~700 DPI — far past what
// a press resolves — and keeps every embedded QR small and quick to encode
// (about half the build time of 1024px for a large batch).
const QR_PDF_PIXELS = 768;
const TEMPLATE_PDF_ALIAS = "repiqr-sticker-template";

/**
 * Bulk PDF export — one A4 page per sticker, the 4x2.5in sticker centered.
 *
 * Quality + size: the template JPEG is embedded ONCE, byte-for-byte, and reused
 * by every page; only each sticker's own QR is added on top, as a crisp
 * image (QR_PDF_PIXELS). Nothing is re-rasterised, so the artwork stays exactly as designed and
 * a 500-sticker PDF is a few MB instead of hundreds. Pages are built one at a
 * time (yielding to the event loop) so large batches never freeze the tab.
 */
export async function generateStickerBatchPdfBlob(
  records: QrRecord[],
  position: StickerPos,
  recoveryCodeMap: Record<string, string | null | undefined> = {},
  copies = 1,
  onProgress?: PrintProgressCallback,
  shouldCancel?: () => boolean
): Promise<Blob | null> {
  if (records.length === 0) return null;

  const total = records.length;
  const safeCopies = Math.max(1, Math.round(copies) || 1);
  const totalPages = total * safeCopies;
  const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  onProgress?.({ current: 0, total, percent: 5, stage: "Preparing sticker template…" });
  await tick(30); // let the progress widget paint

  if (shouldCancel?.()) return null;

  const [{ jsPDF }, templateBytes] = await Promise.all([import("jspdf"), loadStickerTemplateBytes()]);

  if (shouldCancel?.()) return null;

  // Exact centered coordinates on the A4 page, and the QR's box inside the sticker.
  const stickerX = (A4_WIDTH_INCHES - STICKER_WIDTH_INCHES) / 2;
  const stickerY = (A4_HEIGHT_INCHES - STICKER_HEIGHT_INCHES) / 2;
  const inchesPerEditorX = STICKER_WIDTH_INCHES / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_WIDTH;
  const inchesPerEditorY = STICKER_HEIGHT_INCHES / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_HEIGHT;
  const qrX = stickerX + position.x * inchesPerEditorX;
  const qrY = stickerY + position.y * inchesPerEditorY;
  const qrW = position.w * inchesPerEditorX;
  const qrH = position.h * inchesPerEditorY;

  const doc = new jsPDF({
    unit: "in",
    format: [A4_WIDTH_INCHES, A4_HEIGHT_INCHES],
    orientation: "portrait",
    compress: true,
  });

  let pageNumber = 0;
  for (let copyIndex = 0; copyIndex < safeCopies; copyIndex++) {
    for (let index = 0; index < total; index++) {
      if (shouldCancel?.()) return null;

      const record = records[index];
      if (pageNumber > 0) doc.addPage([A4_WIDTH_INCHES, A4_HEIGHT_INCHES], "portrait");
      pageNumber++;

      // Same alias on every page → the template is stored once in the file.
      doc.addImage(templateBytes, "JPEG", stickerX, stickerY, STICKER_WIDTH_INCHES, STICKER_HEIGHT_INCHES, TEMPLATE_PDF_ALIAS, "NONE");

      // Per-sticker QR (cached by generateQrDataUrl); alias = sticker id so extra copies reuse it.
      const qrDataUrl = await generateQrDataUrl(
        qrFullUrl(record.id),
        record.fg || "000000",
        record.bg || "FFFFFF",
        QR_PDF_PIXELS
      );
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrW, qrH, `qr-${record.id}`, "FAST");

      if (pageNumber % 4 === 0 || pageNumber === totalPages) {
        onProgress?.({
          current: Math.min(total, pageNumber),
          total,
          percent: Math.round(5 + (pageNumber / totalPages) * 90),
          stage: `Building page ${pageNumber} of ${totalPages} (${record.id})…`,
          stickerId: record.id,
        });
        await tick(); // yield so the bar animates and the tab stays responsive
        if (shouldCancel?.()) return null;
      }
    }
  }

  if (shouldCancel?.()) return null;

  onProgress?.({ current: total, total, percent: 97, stage: "Adding recovery-code list…" });
  await tick(10);
  if (shouldCancel?.()) return null;

  appendRecoveryManifestPages(doc, records, recoveryCodeMap);

  const outputBlob = doc.output("blob");
  onProgress?.({ current: total, total, percent: 100, stage: "PDF ready! Starting download…" });
  await tick(250);

  return outputBlob;
}

export function downloadSheetBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = objectUrl;
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(objectUrl);
}
