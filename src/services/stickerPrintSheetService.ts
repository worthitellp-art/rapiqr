import { QrRecord, StickerPos } from "../components/dashboard/admin/types";
import { generateQrDataUrl, qrFullUrl } from "../components/dashboard/admin/helpers";
import stickerTemplateImg from "../assets/template-sticker.jpeg";

// Natural pixel size of the sticker template artwork (src/assets/template-sticker.jpeg).
// Used below to work out how many rows actually fit on a sheet — keep this in
// sync if the template image is ever replaced with a different aspect ratio.
const TEMPLATE_NATURAL_WIDTH = 4720;
const TEMPLATE_NATURAL_HEIGHT = 2948;
const TEMPLATE_ASPECT_RATIO = TEMPLATE_NATURAL_WIDTH / TEMPLATE_NATURAL_HEIGHT;

const SHEET_WIDTH_INCHES = 12;
const SHEET_HEIGHT_INCHES = 18;
const DEFAULT_DPI = 300;
const GRID_COLUMNS = 3;
const MARGIN_INCHES = 0.25;
const GAP_INCHES = 0.2;

/**
 * A fixed 3-column grid sized to fill the sheet's width leaves most of a
 * 12×18 sheet blank if rows are also hardcoded to match (the sticker artwork
 * is wide/landscape, so 3 of them stack into far less than 18 inches of
 * height) — e.g. a hardcoded 3×3 grid used only ~42% of the sheet's height.
 * Compute how many rows of the same (width-constrained) cell size actually
 * fit, so the sheet prints at full capacity instead of wasting paper.
 */
function computeGridRows(): number {
  const dpi = DEFAULT_DPI;
  const marginPx = MARGIN_INCHES * dpi;
  const gapPx = GAP_INCHES * dpi;
  const availableWidth = SHEET_WIDTH_INCHES * dpi - 2 * marginPx;
  const availableHeight = SHEET_HEIGHT_INCHES * dpi - 2 * marginPx;

  const cellWidth = (availableWidth - (GRID_COLUMNS - 1) * gapPx) / GRID_COLUMNS;
  const cellHeight = cellWidth / TEMPLATE_ASPECT_RATIO;

  return Math.max(1, Math.floor((availableHeight + gapPx) / (cellHeight + gapPx)));
}

const GRID_ROWS = computeGridRows();

export const PRINT_SHEET_CONSTANTS = {
  SHEET_WIDTH_INCHES,
  SHEET_HEIGHT_INCHES,
  DEFAULT_DPI,
  GRID_COLUMNS,
  GRID_ROWS,
  STICKERS_PER_SHEET: GRID_COLUMNS * GRID_ROWS,
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
  cellPixelWidth: number;
  cellPixelHeight: number;
  cellXCoordinates: number[];
  cellYCoordinates: number[];
  cellGapPixels: number;
  scaleFactorX: number;
  scaleFactorY: number;
}

export type SheetPrintMode = "repeat-single" | "batch-selection";

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

export function calculateGridDimensions(
  stickerAspectRatio: number,
  config: SheetPrintConfig = {}
): GridCalculations {
  const targetDpi = config.dpi ?? PRINT_SHEET_CONSTANTS.DEFAULT_DPI;
  const sheetWidthInches = config.sheetWidthInches ?? PRINT_SHEET_CONSTANTS.SHEET_WIDTH_INCHES;
  const sheetHeightInches = config.sheetHeightInches ?? PRINT_SHEET_CONSTANTS.SHEET_HEIGHT_INCHES;
  const marginInches = config.marginInches ?? PRINT_SHEET_CONSTANTS.MARGIN_INCHES;
  const gapInches = config.gapInches ?? PRINT_SHEET_CONSTANTS.GAP_INCHES;
  const columns = config.columns ?? PRINT_SHEET_CONSTANTS.GRID_COLUMNS;
  const rows = config.rows ?? PRINT_SHEET_CONSTANTS.GRID_ROWS;

  const sheetPixelWidth = Math.round(sheetWidthInches * targetDpi);
  const sheetPixelHeight = Math.round(sheetHeightInches * targetDpi);
  const marginPixels = Math.round(marginInches * targetDpi);
  const cellGapPixels = Math.round(gapInches * targetDpi);

  const availableWidth = sheetPixelWidth - 2 * marginPixels;
  const availableHeight = sheetPixelHeight - 2 * marginPixels;

  const cellWidthBudgetFromSheetWidth = (availableWidth - (columns - 1) * cellGapPixels) / columns;
  const cellWidthBudgetFromSheetHeight = (stickerAspectRatio * (availableHeight - (rows - 1) * cellGapPixels)) / rows;

  // Fit within both width and height constraints without stretching the sticker artwork.
  const cellPixelWidth = Math.floor(Math.min(cellWidthBudgetFromSheetWidth, cellWidthBudgetFromSheetHeight));
  const cellPixelHeight = Math.round(cellPixelWidth / stickerAspectRatio);

  const totalGridWidth = columns * cellPixelWidth + (columns - 1) * cellGapPixels;
  const totalGridHeight = rows * cellPixelHeight + (rows - 1) * cellGapPixels;

  const originX = Math.round((sheetPixelWidth - totalGridWidth) / 2);
  const originY = Math.round((sheetPixelHeight - totalGridHeight) / 2);

  const cellXCoordinates = Array.from({ length: columns }, (_, colIndex) => originX + colIndex * (cellPixelWidth + cellGapPixels));
  const cellYCoordinates = Array.from({ length: rows }, (_, rowIndex) => originY + rowIndex * (cellPixelHeight + cellGapPixels));

  const scaleFactorX = cellPixelWidth / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_WIDTH;
  const scaleFactorY = cellPixelHeight / PRINT_SHEET_CONSTANTS.REFERENCE_EDITOR_HEIGHT;

  return {
    sheetPixelWidth,
    sheetPixelHeight,
    cellPixelWidth,
    cellPixelHeight,
    cellXCoordinates,
    cellYCoordinates,
    cellGapPixels,
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

  // Vertical trim lines running through cell gaps across the full 18-inch height.
  for (let colIndex = 1; colIndex < columns; colIndex++) {
    const lineX = grid.cellXCoordinates[colIndex - 1] + grid.cellPixelWidth + grid.cellGapPixels / 2;
    canvasContext.beginPath();
    canvasContext.moveTo(lineX, 0);
    canvasContext.lineTo(lineX, grid.sheetPixelHeight);
    canvasContext.stroke();
  }

  // Horizontal trim lines running through cell gaps across the full 12-inch width.
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

async function renderCellSticker(
  canvasContext: CanvasRenderingContext2D,
  stickerTemplate: HTMLImageElement,
  record: QrRecord,
  position: StickerPos,
  targetX: number,
  targetY: number,
  grid: GridCalculations
): Promise<void> {
  // 1. Draw the base sticker template artwork.
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
}

function convertCanvasToPngBlob(canvasElement: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvasElement.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Generates a 12×18 inch print sheet repeating a single sticker across a grid
 * sized to fill the sheet (see PRINT_SHEET_CONSTANTS.GRID_ROWS).
 */
export async function generateRepeatedStickerSheetBlob(
  record: QrRecord,
  position: StickerPos,
  config: SheetPrintConfig = {}
): Promise<Blob | null> {
  const stickerTemplate = await loadStickerTemplate();
  const aspectRatio = stickerTemplate.naturalWidth / stickerTemplate.naturalHeight;
  const grid = calculateGridDimensions(aspectRatio, config);

  const canvasElement = document.createElement("canvas");
  canvasElement.width = grid.sheetPixelWidth;
  canvasElement.height = grid.sheetPixelHeight;

  const canvasContext = canvasElement.getContext("2d");
  if (!canvasContext) return null;

  drawSheetBackground(canvasContext, grid.sheetPixelWidth, grid.sheetPixelHeight);

  const totalCells = PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET;
  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    const rowIndex = Math.floor(cellIndex / PRINT_SHEET_CONSTANTS.GRID_COLUMNS);
    const colIndex = cellIndex % PRINT_SHEET_CONSTANTS.GRID_COLUMNS;
    const targetX = grid.cellXCoordinates[colIndex];
    const targetY = grid.cellYCoordinates[rowIndex];

    await renderCellSticker(canvasContext, stickerTemplate, record, position, targetX, targetY, grid);
  }

  const targetDpi = config.dpi ?? PRINT_SHEET_CONSTANTS.DEFAULT_DPI;
  drawCutGuideLines(canvasContext, grid, PRINT_SHEET_CONSTANTS.GRID_COLUMNS, PRINT_SHEET_CONSTANTS.GRID_ROWS, targetDpi);
  drawCornerCropMarks(canvasContext, grid, PRINT_SHEET_CONSTANTS.GRID_COLUMNS, PRINT_SHEET_CONSTANTS.GRID_ROWS, targetDpi);

  return convertCanvasToPngBlob(canvasElement);
}

/**
 * Generates 12×18 inch print sheets tiling a batch of stickers, as many per
 * sheet as fit (see PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET).
 */
export async function generateBatchStickersSheetBlobs(
  records: QrRecord[],
  position: StickerPos,
  config: SheetPrintConfig = {}
): Promise<Blob[]> {
  if (records.length === 0) return [];

  const stickerTemplate = await loadStickerTemplate();
  const aspectRatio = stickerTemplate.naturalWidth / stickerTemplate.naturalHeight;
  const grid = calculateGridDimensions(aspectRatio, config);

  const stickersPerSheet = PRINT_SHEET_CONSTANTS.STICKERS_PER_SHEET;
  const columns = PRINT_SHEET_COLUMNS_COUNT(config);
  const rows = PRINT_SHEET_ROWS_COUNT(config);
  const targetDpi = config.dpi ?? PRINT_SHEET_CONSTANTS.DEFAULT_DPI;

  const generatedBlobs: Blob[] = [];
  const totalSheets = Math.ceil(records.length / stickersPerSheet);

  for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
    const chunkStart = sheetIndex * stickersPerSheet;
    const recordsChunk = records.slice(chunkStart, chunkStart + stickersPerSheet);

    const canvasElement = document.createElement("canvas");
    canvasElement.width = grid.sheetPixelWidth;
    canvasElement.height = grid.sheetPixelHeight;

    const canvasContext = canvasElement.getContext("2d");
    if (!canvasContext) continue;

    drawSheetBackground(canvasContext, grid.sheetPixelWidth, grid.sheetPixelHeight);

    for (let cellIndex = 0; cellIndex < recordsChunk.length; cellIndex++) {
      const rowIndex = Math.floor(cellIndex / columns);
      const colIndex = cellIndex % columns;
      const targetX = grid.cellXCoordinates[colIndex];
      const targetY = grid.cellYCoordinates[rowIndex];

      await renderCellSticker(canvasContext, stickerTemplate, recordsChunk[cellIndex], position, targetX, targetY, grid);
    }

    drawCutGuideLines(canvasContext, grid, columns, rows, targetDpi);
    drawCornerCropMarks(canvasContext, grid, columns, rows, targetDpi);

    const sheetBlob = await convertCanvasToPngBlob(canvasElement);
    if (sheetBlob) generatedBlobs.push(sheetBlob);
  }

  return generatedBlobs;
}

function PRINT_SHEET_COLUMNS_COUNT(config: SheetPrintConfig): number {
  return config.columns ?? PRINT_SHEET_CONSTANTS.GRID_COLUMNS;
}

function PRINT_SHEET_ROWS_COUNT(config: SheetPrintConfig): number {
  return config.rows ?? PRINT_SHEET_CONSTANTS.GRID_ROWS;
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

/**
 * Triggers browser print dialog with page layout formatted for 12x18 inch
 * portrait sheets. `copies` repeats the sheet across that many print pages
 * (via CSS page breaks) so one print job produces that many physical copies,
 * rather than relying on the OS print dialog's own (inconsistently placed)
 * copies field.
 */
export function printSheetBlobInBrowser(blob: Blob, documentTitle = "RapiQR Print Sheet", copies = 1): void {
  const objectUrl = URL.createObjectURL(blob);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback if popup blocker intercepted the new tab.
    downloadSheetBlob(blob, `${documentTitle.replace(/\s+/g, "_")}.png`);
    return;
  }

  const safeCopies = Math.max(1, Math.round(copies) || 1);
  const pagesHtml = Array.from(
    { length: safeCopies },
    () => `<div class="sheet-page"><img class="print-sheet-img" src="${objectUrl}" alt="Print Sheet" /></div>`
  ).join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${documentTitle}</title>
        <style>
          @page {
            size: 12in 18in portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .sheet-page {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
          .sheet-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .print-sheet-img {
            width: 12in;
            height: 18in;
            max-width: 100vw;
            max-height: 100vh;
            object-fit: contain;
            display: block;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-sheet-img {
              width: 100%;
              height: 100%;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          const images = Array.from(document.querySelectorAll(".print-sheet-img"));
          Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))).then(() => {
            window.focus();
            window.print();
            window.onafterprint = () => {
              window.close();
            };
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
