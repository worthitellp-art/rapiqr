import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  CloudUpload,
  HardDriveDownload,
  Key,
  Folder,
  RefreshCw,
  Download,
  Upload,
  Check,
  AlertTriangle,
  Database,
  Lock,
  ExternalLink,
  FileJson
} from "lucide-react";
import { QrRecord, StickerPos } from "./types";
import {
  getGoogleDriveConfig,
  saveGoogleDriveConfig,
  GoogleDriveConfig,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadAndRestoreFromDrive,
  createBackupPackage,
  restoreFromBackupPackage,
  getLocalBackupHistory,
} from "../../../lib/googleDriveService";

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
  const [config, setConfig] = useState<GoogleDriveConfig>(getGoogleDriveConfig());
  const [accessTokenInput, setAccessTokenInput] = useState(config.accessToken || "");
  const [folderIdInput, setFolderIdInput] = useState(config.folderId || "");
  const [isConfigSaved, setIsConfigSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isListingDrive, setIsListingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; createdTime: string; size?: string }>>([]);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config.accessToken) {
      handleRefreshDriveList(config);
    }
  }, []);

  function handleSaveConfig() {
    const updated: GoogleDriveConfig = {
      ...config,
      accessToken: accessTokenInput.trim(),
      folderId: folderIdInput.trim(),
    };
    setConfig(updated);
    saveGoogleDriveConfig(updated);
    setIsConfigSaved(true);
    setToast("Google Drive API settings saved");
    setTimeout(() => {
      setIsConfigSaved(false);
      setToast(null);
    }, 2000);

    if (updated.accessToken) {
      handleRefreshDriveList(updated);
    }
  }

  async function handleRefreshDriveList(targetConfig = config) {
    if (!targetConfig.accessToken) return;
    setIsListingDrive(true);
    const result = await listGoogleDriveBackups(targetConfig);
    setIsListingDrive(false);
    if (result.success && result.files) {
      setDriveFiles(result.files);
    }
  }

  async function handleBackupToGoogleDrive() {
    if (!config.accessToken) {
      setToast("Please enter your Google Drive Access Token first");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsUploading(true);
    const res = await uploadBackupToGoogleDrive(config, qrList, stickerPos);
    setIsUploading(false);

    if (res.success) {
      setToast(`Backup created & uploaded to Google Drive! (${res.fileName})`);
      setTimeout(() => setToast(null), 4000);
      handleRefreshDriveList();
    } else {
      setToast(`Backup Failed: ${res.error}`);
      setTimeout(() => setToast(null), 5000);
    }
  }

  function handleExportLocalJson() {
    const pkg = createBackupPackage(qrList, stickerPos);
    const str = JSON.stringify(pkg, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const timestampStr = new Date().toISOString().slice(0, 10);
    const filename = `rapiqr_fleet_backup_${timestampStr}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setToast("Local JSON backup downloaded");
    setTimeout(() => setToast(null), 2500);
  }

  function handleImportLocalJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = await restoreFromBackupPackage(parsed, setQrList, setStickerPos);
        setToast(`Restored ${result.restoredCount} tags from local backup file!`);
        setTimeout(() => setToast(null), 4000);
      } catch (err: any) {
        setToast(`Failed to parse backup JSON file: ${err.message}`);
        setTimeout(() => setToast(null), 4000);
      }
    };
    reader.readAsText(file);
  }

  async function handleRestoreFromDriveFile(fileId: string) {
    setRestoringFileId(fileId);
    const res = await downloadAndRestoreFromDrive(fileId, config, setQrList, setStickerPos);
    setRestoringFileId(null);

    if (res.success) {
      setToast(`Restored ${res.restoredCount} tags directly from Google Drive!`);
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast(`Restore Failed: ${res.error}`);
      setTimeout(() => setToast(null), 5000);
    }
  }

  const localHistory = getLocalBackupHistory();
  const inputCls = "w-full px-3.5 py-2.5 text-[13.5px] rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] outline-none focus:border-[#5C78DF] focus:ring-2 focus:ring-[#5C78DF]/15 transition-all font-mono";

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[21px] font-semibold text-[#17181A]">
            Backup & Google Drive Sync
          </h1>
        </div>
      </div>

      {/* ── Top Hero Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Google Drive One-Click Upload */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E7] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center">
                  <CloudUpload size={22} />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-[#17181A]">
                    Google Drive Cloud Backup
                  </h3>
                </div>
              </div>

              {config.accessToken ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#E9F9EF] text-[#2E9E5B] font-bold text-[11px] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#4FC47A] animate-pulse" />
                  Drive Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FBF3E4] text-[#B8863F] font-bold text-[11px] uppercase tracking-wider">
                  Setup Required
                </span>
              )}
            </div>

            <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] p-4 font-mono text-[12px] space-y-2 mb-2">
              <div className="flex items-center justify-between text-[#777B80]">
                <span>Total Fleet Records:</span>
                <span className="font-bold text-[#17181A]">{qrList.length} QR Stickers</span>
              </div>
              <div className="flex items-center justify-between text-[#777B80]">
                <span>Target Drive Folder:</span>
                <span className="font-bold text-[#17181A]">{config.folderId || "Root My Drive Folder"}</span>
              </div>
              <div className="flex items-center justify-between text-[#777B80]">
                <span>Last Cloud Sync:</span>
                <span className="font-bold text-[#2E9E5B]">{config.lastBackupTime ? new Date(config.lastBackupTime).toLocaleString("en-IN") : "Never"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleBackupToGoogleDrive}
              disabled={isUploading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-[4px] bg-[#5C78DF] text-white font-bold text-[14px] hover:bg-[#4A63C0] active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Uploading to Drive...
                </>
              ) : (
                <>
                  <CloudUpload size={18} strokeWidth={2.4} /> Backup Now to Google Drive
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Local File Export & Import Card */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E7] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[4px] bg-[#F3F3F4] text-[#777B80] flex items-center justify-center">
                <HardDriveDownload size={20} />
              </div>
              <div>
                <h3 className="font-display text-[14px] font-semibold text-[#17181A]">
                  Local Backup File
                </h3>
                <p className="text-[12px] font-mono text-[#777B80]">
                  Export or Restore JSON File
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleExportLocalJson}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] font-bold text-[13.5px] hover:bg-[#F7F7F8] transition-all cursor-pointer"
            >
              <Download size={16} /> Export Local JSON File
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportLocalJson}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[4px] border border-[#5C78DF] text-[#5C78DF] font-bold text-[13.5px] hover:bg-[#E8EDFF] transition-all cursor-pointer"
            >
              <Upload size={16} /> Restore from JSON File
            </button>
          </div>
        </div>
      </div>

      {/* ── Admin Google Drive API Setup Panel ──────────────────────── */}
      <div className="bg-white border border-[#E5E5E7] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center">
              <Key size={16} />
            </div>
            <h3 className="font-display text-[14px] font-semibold text-[#17181A]">
              Google Drive API Credentials
            </h3>
          </div>
          <a
            href="https://developers.google.com/oauthplayground/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11.5px] font-bold text-[#5C78DF] hover:underline flex items-center gap-1"
          >
            Google OAuth Token Helper <ExternalLink size={11} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-body font-semibold uppercase tracking-[1px] text-[#777B80]">
              OAuth 2.0 Access Token / API Token
            </label>
            <input
              type="password"
              placeholder="Paste Google Drive OAuth Access Token (ya29...)"
              value={accessTokenInput}
              onChange={(e) => setAccessTokenInput(e.target.value)}
              className={inputCls}
            />
            <p className="text-[11px] font-mono text-[#777B80]">
              Scope required: <code className="bg-[#F7F7F8] border border-[#E5E5E7] px-1 py-0.5 rounded-[4px] text-[#17181A]">https://www.googleapis.com/auth/drive.file</code>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-body font-semibold uppercase tracking-[1px] text-[#777B80]">
              Google Drive Target Folder ID (Optional)
            </label>
            <input
              type="text"
              placeholder="Folder ID from Google Drive URL (1a2b3c...)"
              value={folderIdInput}
              onChange={(e) => setFolderIdInput(e.target.value)}
              className={inputCls}
            />
            <p className="text-[11px] font-mono text-[#777B80]">
              Leave empty to save directly in root "My Drive"
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#17181A] text-white font-bold text-[13px] hover:bg-[#2A2B2E] transition-all cursor-pointer"
          >
            {isConfigSaved ? <Check size={14} className="text-[#5C78DF]" /> : null} Save Credentials
          </button>

          {config.accessToken && (
            <button
              onClick={() => handleRefreshDriveList()}
              disabled={isListingDrive}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 rounded-[4px] border border-[#E5E5E7] text-[#17181A] bg-white hover:bg-[#F7F7F8] transition-all cursor-pointer"
            >
              <RefreshCw size={12} className={isListingDrive ? "animate-spin" : ""} /> Refresh Remote Backups
            </button>
          )}
        </div>
      </div>

      {/* ── Remote Google Drive Backups List ───────────────────────── */}
      <div className="bg-white border border-[#E5E5E7] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center">
              <Folder size={16} />
            </div>
            <h3 className="font-display text-[14px] font-semibold text-[#17181A]">
              Google Drive Remote Backups
            </h3>
          </div>
          <span className="font-mono text-[12px] text-[#777B80]">
            {driveFiles.length} cloud files
          </span>
        </div>

        {driveFiles.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] text-[#777B80] font-mono text-[13px]">
            {config.accessToken
              ? "No backups yet."
              : "Connect Google Drive above to view backups."}
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E7] border border-[#E5E5E7] rounded-[4px] overflow-hidden">
            {driveFiles.map((file) => (
              <div key={file.id} className="p-4 bg-white hover:bg-[#F7F7F8] flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center">
                    <FileJson size={18} />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-[13.5px] text-[#17181A]">{file.name}</p>
                    <p className="font-mono text-[11px] text-[#777B80]">
                      {new Date(file.createdTime).toLocaleString("en-IN")} · ID: {file.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRestoreFromDriveFile(file.id)}
                  disabled={restoringFileId === file.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#5C78DF] text-white font-bold text-[12px] hover:bg-[#4A63C0] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {restoringFileId === file.id ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
