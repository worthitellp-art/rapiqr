import type { jsPDF as JsPDF } from "jspdf";
import { QrRecord, StickerPos } from "../components/dashboard/admin/types";
import { generateQrDataUrl, qrFullUrl } from "../components/dashboard/admin/helpers";
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
  QR_RESOLUTION_PIXELS: 768,
  DEFAULT_STICKER_POS: { x: 193, y: 37, w: 110, h: 110 } as StickerPos,
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

function drawCornerCropMarks(
  canvasContext: CanvasRenderingContext2D,
  grid: GridCalculations,
  columns: number,
  rows: number,
  dpi: number
): void {
  canvasContext.save();
  const markLengthPixels = Math.round(0.12 * dpi);
  canvasContext.strokeStyle = "rgba(40, 40, 45, 0.9)";
  canvasContext.lineWidth = Math.max(1, Math.round((0.85 / 72) * dpi));

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < columns; colIndex++) {
      const cellLeft = grid.cellXCoordinates[colIndex];
      const cellTop = grid.cellYCoordinates[rowIndex];
      const cellRight = cellLeft + grid.cellPixelWidth;
      const cellBottom = cellTop + grid.cellPixelHeight;

      const cornerPoints = [
        [cellLeft, cellTop],
        [cellRight, cellTop],
        [cellLeft, cellBottom],
        [cellRight, cellBottom],
      ];

      for (const [cornerX, cornerY] of cornerPoints) {
        canvasContext.beginPath();
        canvasContext.moveTo(cornerX - markLengthPixels, cornerY);
        canvasContext.lineTo(cornerX + markLengthPixels, cornerY);
        canvasContext.moveTo(cornerX, cornerY - markLengthPixels);
        canvasContext.lineTo(cornerX, cornerY + markLengthPixels);
        canvasContext.stroke();
      }
    }
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
  drawCornerCropMarks(canvasContext, grid, columns, rows, dpi);

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

// A4 — the admin's actual printer paper. Every bulk-export page is this
// size; as many fixed 4x2.5in stickers as actually fit are packed onto it
// (never resized to hit a preset count), and the rest spill onto additional
// A4 pages — a normal printer prints a full A4 page at 100% with no "fit to
// page" scaling, so every sticker lands at its exact decided size.
const A4_WIDTH_INCHES = 8.27;
const A4_HEIGHT_INCHES = 11.69;

function computeA4GridCounts(): { columns: number; rows: number } {
  const availableWidth = A4_WIDTH_INCHES - 2 * MARGIN_INCHES;
  const availableHeight = A4_HEIGHT_INCHES - 2 * MARGIN_INCHES;
  const colPitch = STICKER_WIDTH_INCHES + GAP_INCHES;
  const rowPitch = STICKER_HEIGHT_INCHES + GAP_INCHES;
  const columns = Math.max(1, Math.floor((availableWidth + GAP_INCHES) / colPitch));
  const rows = Math.max(1, Math.floor((availableHeight + GAP_INCHES) / rowPitch));
  return { columns, rows };
}

const A4_GRID_COUNTS = computeA4GridCounts();

/** How many stickers fit on one A4 export page at their fixed 4x2.5in size. */
export const ADMIN_STICKERS_PER_PAGE = A4_GRID_COUNTS.columns * A4_GRID_COUNTS.rows;

function drawStickerCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  dpi: number
): void {
  ctx.save();
  const markLengthPixels = Math.round(0.12 * dpi);
  ctx.strokeStyle = "rgba(40, 40, 45, 0.9)";
  ctx.lineWidth = Math.max(1, Math.round((0.85 / 72) * dpi));

  const corners = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
  ];
  for (const [cornerX, cornerY] of corners) {
    ctx.beginPath();
    ctx.moveTo(cornerX - markLengthPixels, cornerY);
    ctx.lineTo(cornerX + markLengthPixels, cornerY);
    ctx.moveTo(cornerX, cornerY - markLengthPixels);
    ctx.lineTo(cornerX, cornerY + markLengthPixels);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders ONE A4 page packed with up to ADMIN_STICKERS_PER_PAGE stickers,
 * each at its exact physical size (4x2.5in) with corner crop marks — the
 * page is standard paper; only the stickers themselves are the fixed,
 * never-rescaled footprint. `recordsChunk` may be shorter than a full page
 * (the last page of a batch).
 */
async function renderA4GridPageCanvas(
  recordsChunk: QrRecord[],
  position: StickerPos,
  dpi: number
): Promise<HTMLCanvasElement> {
  const stickerTemplate = await loadStickerTemplate();
  const { columns } = A4_GRID_COUNTS;

  const pageWidthPx = Math.round(A4_WIDTH_INCHES * dpi);
  const pageHeightPx = Math.round(A4_HEIGHT_INCHES * dpi);
  const stickerWidthPx = Math.round(STICKER_WIDTH_INCHES * dpi);
  const stickerHeightPx = Math.round(STICKER_HEIGHT_INCHES * dpi);
  const gapPx = Math.round(GAP_INCHES * dpi);

  const totalGridWidth = A4_GRID_COUNTS.columns * stickerWidthPx + (A4_GRID_COUNTS.columns - 1) * gapPx;
  const totalGridHeight = A4_GRID_COUNTS.rows * stickerHeightPx + (A4_GRID_COUNTS.rows - 1) * gapPx;
  const originX = Math.round((pageWidthPx - totalGridWidth) / 2);
  const originY = Math.round((pageHeightPx - totalGridHeight) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = pageWidthPx;
  canvas.height = pageHeightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

  const scaleX = stickerWidthPx / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_WIDTH;
  const scaleY = stickerHeightPx / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_HEIGHT;

  for (let cellIndex = 0; cellIndex < recordsChunk.length; cellIndex++) {
    const rowIndex = Math.floor(cellIndex / columns);
    const colIndex = cellIndex % columns;
    const targetX = originX + colIndex * (stickerWidthPx + gapPx);
    const targetY = originY + rowIndex * (stickerHeightPx + gapPx);
    const record = recordsChunk[cellIndex];

    ctx.drawImage(stickerTemplate, targetX, targetY, stickerWidthPx, stickerHeightPx);

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

    drawStickerCropMarks(ctx, targetX, targetY, stickerWidthPx, stickerHeightPx, dpi);
  }

  return canvas;
}

/**
 * Live on-screen preview of one A4 export page (up to ADMIN_STICKERS_PER_PAGE
 * stickers).
 */
export async function generateStickerPagePreviewBlob(
  recordsChunk: QrRecord[],
  position: StickerPos,
  dpi = 100
): Promise<Blob | null> {
  if (recordsChunk.length === 0) return null;
  const canvas = await renderA4GridPageCanvas(recordsChunk, position, dpi);
  return convertCanvasToPngBlob(canvas);
}

/**
 * Appends a plain-text recovery-code manifest (sticker id -> recovery code)
 * on standard A4 pages at the end of the document — kept off the sticker
 * pages themselves since those are sized to the exact 4x2.5in artwork with
 * no spare room for a label.
 */
function appendRecoveryManifestPages(
  doc: JsPDF,
  records: QrRecord[],
  recoveryCodeMap: Record<string, string | null | undefined>
): void {
  const withCodes = records.filter((record) => recoveryCodeMap[record.id] ?? record.recoveryCode);
  if (withCodes.length === 0) return;

  const pageWidthIn = 8.27;
  const pageHeightIn = 11.69;
  const marginIn = 0.6;
  const lineHeightIn = 0.24;
  const headerHeightIn = 0.5;
  const rowsPerPage = Math.max(1, Math.floor((pageHeightIn - 2 * marginIn - headerHeightIn) / lineHeightIn));

  for (let start = 0; start < withCodes.length; start += rowsPerPage) {
    doc.addPage([pageWidthIn, pageHeightIn], "portrait");
    let cursorY = marginIn;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("RapiQR Recovery Code Manifest", marginIn, cursorY);
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

/**
 * Bulk PDF export — packs as many stickers as fit (ADMIN_STICKERS_PER_PAGE)
 * onto each A4 page at their exact physical size (4x2.5in) with corner crop
 * marks, spilling the rest onto additional A4 pages. Prints true-to-size on
 * any normal printer loaded with A4 paper at 100%/"actual size" (no custom
 * label stock required). `copies` repeats the whole batch that many times
 * without re-rendering the artwork. Recovery codes are appended as a
 * manifest at the end, not on the sticker pages (see appendRecoveryManifestPages).
 */
export async function generateStickerBatchPdfBlob(
  records: QrRecord[],
  position: StickerPos,
  recoveryCodeMap: Record<string, string | null | undefined> = {},
  copies = 1,
  dpi = PRINT_SHEET_CONSTANTS.DEFAULT_DPI
): Promise<Blob | null> {
  if (records.length === 0) return null;

  const pageDataUrls: string[] = [];
  for (let start = 0; start < records.length; start += ADMIN_STICKERS_PER_PAGE) {
    const chunk = records.slice(start, start + ADMIN_STICKERS_PER_PAGE);
    const canvas = await renderA4GridPageCanvas(chunk, position, dpi);
    pageDataUrls.push(canvas.toDataURL("image/png"));
  }

  if (pageDataUrls.length === 0) return null;

  const { jsPDF } = await import("jspdf");
  const safeCopies = Math.max(1, Math.round(copies) || 1);

  let doc: InstanceType<typeof jsPDF> | null = null;
  for (let copyIndex = 0; copyIndex < safeCopies; copyIndex++) {
    for (const pageDataUrl of pageDataUrls) {
      if (!doc) {
        doc = new jsPDF({ unit: "in", format: [A4_WIDTH_INCHES, A4_HEIGHT_INCHES], orientation: "portrait" });
      } else {
        doc.addPage([A4_WIDTH_INCHES, A4_HEIGHT_INCHES], "portrait");
      }
      doc.addImage(pageDataUrl, "PNG", 0, 0, A4_WIDTH_INCHES, A4_HEIGHT_INCHES);
    }
  }

  if (!doc) return null;
  appendRecoveryManifestPages(doc, records, recoveryCodeMap);
  return doc.output("blob");
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
