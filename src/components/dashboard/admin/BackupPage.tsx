import type React from "react";
import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Database,
  Image as ImageIcon,
  FolderArchive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  Layers
} from "lucide-react";
import JSZip from "jszip";
import { QrRecord, StickerPos } from "./types";
import {
  createBackupPackage,
  restoreFromBackupPackage,
} from "../../../lib/googleDriveService";
import { generateQrDataUrl, qrFullUrl, compositeQrOnSticker } from "./helpers";

export default function BackupPage({
  qrList,
  setQrList,
  stickerPos,
  setStickerPos,
  setToast,
}: {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  stickerPos: StickerPos;
  setStickerPos: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
}) {
  const [isZippingStickers, setIsZippingStickers] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 1. DOWNLOAD ALL DATA (JSON SNAPSHOT) ──────────────────────────────────
  function handleDownloadAllData() {
    try {
      const packageData = createBackupPackage(qrList, stickerPos);
      const jsonString = JSON.stringify(packageData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const timestampStr = new Date().toISOString().slice(0, 10);
      const filename = `rapiqr_all_data_${timestampStr}.json`;

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      setToast(`Downloaded full database snapshot (${qrList.length} records)`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast(`Failed to export data: ${err.message}`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  // ─── 2. DOWNLOAD ALL STICKERS (ZIP ARCHIVE) ────────────────────────────────
  async function handleDownloadAllStickersZip() {
    if (!qrList || qrList.length === 0) {
      setToast("No stickers found in fleet to export.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsZippingStickers(true);
    setZipProgress({ current: 0, total: qrList.length, percent: 0 });
    setToast("Compositing and bundling sticker images...");

    try {
      const zip = new JSZip();
      const stickersFolder = zip.folder("rapiqr_stickers") || zip;

      for (let i = 0; i < qrList.length; i++) {
        const item = qrList[i];
        const progressCount = i + 1;
        setZipProgress({
          current: progressCount,
          total: qrList.length,
          percent: Math.round((progressCount / qrList.length) * 100),
        });

        // Generated locally (no network call) and composited onto the sticker
        // template — deterministic from the sticker's own id + colors, so this
        // always reproduces the same image regardless of when it's exported.
        try {
          const qrDataUrl = await generateQrDataUrl(qrFullUrl(item.id), item.fg || "EAB308", item.bg || "FFFFFF", 512);
          const stickerBlob = await compositeQrOnSticker(qrDataUrl, stickerPos);
          if (stickerBlob) {
            const safeVehicle = (item.vehicleNumber || item.vehicleName || "sticker").replace(/[^a-zA-Z0-9_-]/g, "_");
            const fileName = `${item.id}_${safeVehicle}.png`;
            stickersFolder.file(fileName, stickerBlob);
          }
        } catch (itemErr) {
          console.warn(`Could not generate sticker for ${item.id}:`, itemErr);
        }
      }

      // Generate the final ZIP blob
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const timestampStr = new Date().toISOString().slice(0, 10);
      const zipFileName = `rapiqr_stickers_all_${timestampStr}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = zipFileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      setToast(`Downloaded ZIP with all ${qrList.length} sticker images!`);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast(`Error creating ZIP: ${err.message}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsZippingStickers(false);
      setZipProgress(null);
    }
  }

  // ─── 3. RESTORE DATABASE FROM JSON FILE ────────────────────────────────────
  function handleImportJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = await restoreFromBackupPackage(parsed, setQrList, setStickerPos);
        setToast(`Successfully restored ${result.restoredCount} stickers & positions!`);
        setTimeout(() => setToast(null), 4000);
      } catch (err: any) {
        setToast(`Failed to restore backup: ${err.message}`);
        setTimeout(() => setToast(null), 4000);
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setToast("Failed to read selected file");
      setIsRestoring(false);
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-[#17181A] font-body">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8ECF4] p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D26] flex items-center gap-2.5">
            <span>Admin Data & Stickers Export</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Directly download complete database records and all sticker graphic images to your device.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-xl shrink-0">
          <Layers size={16} className="text-[#5C78DF]" />
          <span className="text-xs font-bold text-[#1E293B]">{qrList.length} Active Stickers</span>
        </div>
      </div>

      {/* ── 2 Main Export Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Download All Data */}
        <div className="bg-white border border-[#E8ECF4] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#CBD5E1] transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8EDFF] text-[#5C78DF] flex items-center justify-center shadow-2xs">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1D26]">Download All Fleet Data</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Exports all QR codes, vehicle details, sticker coordinates, and database records as a complete JSON backup file.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E8ECF4] rounded-xl p-3.5 space-y-1.5 text-xs font-mono text-[#64748B]">
              <div className="flex justify-between">
                <span>Total records:</span>
                <span className="font-bold text-[#1E293B]">{qrList.length} stickers</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-bold text-[#1E293B]">JSON (.json)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllData}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <Download size={15} />
            <span>Download All Data (.json)</span>
          </button>
        </div>

        {/* Card 2: Download All Sticker Images */}
        <div className="bg-white border border-[#E8ECF4] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#CBD5E1] transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shadow-2xs">
              <FolderArchive size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1D26]">Download All Sticker Images</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Generates and bundles high-resolution PNG composite images for every sticker in the fleet into a downloadable ZIP file.
              </p>
            </div>

            {/* Progress Display when zipping */}
            {isZippingStickers && zipProgress && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#92400E]">
                  <span>Generating stickers: {zipProgress.current} / {zipProgress.total}</span>
                  <span>{zipProgress.percent}%</span>
                </div>
                <div className="h-2 bg-[#FDE68A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                    style={{ width: `${zipProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {!isZippingStickers && (
              <div className="bg-[#F8FAFC] border border-[#E8ECF4] rounded-xl p-3.5 space-y-1.5 text-xs font-mono text-[#64748B]">
                <div className="flex justify-between">
                  <span>Included images:</span>
                  <span className="font-bold text-[#1E293B]">{qrList.length} PNG files</span>
                </div>
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-bold text-[#1E293B]">ZIP Archive (.zip)</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadAllStickersZip}
            disabled={isZippingStickers || qrList.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#5C78DF] hover:bg-[#4A64C2] text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            {isZippingStickers ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Creating ZIP ({zipProgress?.percent || 0}%)...</span>
              </>
            ) : (
              <>
                <FolderArchive size={15} />
                <span>Download All Stickers (.zip)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Restore Section ── */}
      <div className="bg-white border border-[#E8ECF4] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center shrink-0 shadow-2xs">
            <Upload size={22} />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#1A1D26]">Restore Database from File</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Upload a previously exported JSON file to restore stickers and position settings.
            </p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportJsonFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
        >
          {isRestoring ? (
            <span className="flex items-center gap-2">
              <RefreshCw size={13} className="animate-spin text-[#5C78DF]" /> Restoring...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload size={14} /> Upload & Restore JSON
            </span>
          )}
        </button>
      </div>

    </div>
  );
}



