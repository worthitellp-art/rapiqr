import { QrRecord, StickerPos } from "../components/dashboard/admin/types";
import { saveQrCodeToDb, bulkSaveQrCodesToDb } from "./supabaseService";

export interface GoogleDriveConfig {
  accessToken: string;
  folderId: string;
  folderName: string;
  autoBackup: boolean;
  lastBackupTime?: string;
}

export interface BackupPackage {
  appName: string;
  version: string;
  timestamp: string;
  totalQrCount: number;
  qrList: QrRecord[];
  stickerPos: StickerPos;
  metadata: {
    createdBy: string;
    environment: string;
    protected: boolean;
  };
}

const CONFIG_STORAGE_KEY = "repiqr-gdrive-config";
const BACKUP_HISTORY_KEY = "repiqr-backup-history";

/**
 * Get stored Google Drive configuration
 */
export function getGoogleDriveConfig(): GoogleDriveConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return {
    accessToken: "",
    folderId: "",
    folderName: "RapiQR Fleet Backups",
    autoBackup: false,
  };
}

/**
 * Save Google Drive configuration
 */
export function saveGoogleDriveConfig(config: GoogleDriveConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch { /* fallback */ }
}

/**
 * Get stored backup history list
 */
export function getLocalBackupHistory(): Array<{ id: string; name: string; timestamp: string; size: string; driveFileId?: string }> {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return [];
}

/**
 * Record a new backup in local history log
 */
export function recordBackupEntry(entry: { id: string; name: string; timestamp: string; size: string; driveFileId?: string }): void {
  try {
    const current = getLocalBackupHistory();
    const updated = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, 30);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch { /* fallback */ }
}

/**
 * Generate a complete JSON backup package object
 */
export function createBackupPackage(qrList: QrRecord[], stickerPos: StickerPos): BackupPackage {
  return {
    appName: "RapiQR Fleet Manager",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    totalQrCount: qrList.length,
    qrList,
    stickerPos,
    metadata: {
      createdBy: "Admin Console",
      environment: "Production",
      protected: true,
    },
  };
}

/**
 * Upload backup package to Google Drive via Drive v3 REST API
 */
export async function uploadBackupToGoogleDrive(
  config: GoogleDriveConfig,
  qrList: QrRecord[],
  stickerPos: StickerPos
): Promise<{ success: boolean; fileId?: string; fileName?: string; error?: string }> {
  if (!config.accessToken || !config.accessToken.trim()) {
    return { success: false, error: "Google Drive Access Token is missing. Please configure your API token." };
  }

  const packageData = createBackupPackage(qrList, stickerPos);
  const jsonContent = JSON.stringify(packageData, null, 2);
  const timestampStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `rapiqr_fleet_backup_${timestampStr}.json`;

  const fileMetadata: Record<string, any> = {
    name: fileName,
    mimeType: "application/json",
    description: "RapiQR Fleet Database Backup (Protected)",
  };

  if (config.folderId && config.folderId.trim()) {
    fileMetadata.parents = [config.folderId.trim()];
  }

  try {
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(fileMetadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      jsonContent +
      closeDelimiter;

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken.trim()}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Google Drive API Error (${response.status}): ${errText}` };
    }

    const result = await response.json();
    const driveFileId = result.id;

    // Record entry in local history log
    recordBackupEntry({
      id: driveFileId || `local-${Date.now()}`,
      name: fileName,
      timestamp: packageData.timestamp,
      size: `${(jsonContent.length / 1024).toFixed(1)} KB`,
      driveFileId,
    });

    // Update config last backup time
    saveGoogleDriveConfig({
      ...config,
      lastBackupTime: packageData.timestamp,
    });

    return { success: true, fileId: driveFileId, fileName };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while connecting to Google Drive" };
  }
}

/**
 * Fetch list of backups stored in the Google Drive folder
 */
export async function listGoogleDriveBackups(
  config: GoogleDriveConfig
): Promise<{ success: boolean; files?: Array<{ id: string; name: string; createdTime: string; size?: string }>; error?: string }> {
  if (!config.accessToken || !config.accessToken.trim()) {
    return { success: false, error: "Access token required" };
  }

  try {
    let query = "name contains 'rapiqr_fleet_backup_' and trashed = false";
    if (config.folderId && config.folderId.trim()) {
      query += ` and '${config.folderId.trim()}' in parents`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Failed to list files: ${errText}` };
    }

    const data = await response.json();
    return { success: true, files: data.files || [] };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to query Google Drive files" };
  }
}

/**
 * Restore fleet data from a BackupPackage object into React state and database
 */
export async function restoreFromBackupPackage(
  backup: BackupPackage,
  setQrList: (updater: (prev: QrRecord[]) => QrRecord[]) => void,
  setStickerPos?: (pos: StickerPos) => void
): Promise<{ restoredCount: number }> {
  if (!backup || !Array.isArray(backup.qrList)) {
    throw new Error("Invalid backup format: qrList array missing");
  }

  const qrItems = backup.qrList;
  setQrList(() => qrItems);

  try {
    localStorage.setItem("repiqr-qrlist", JSON.stringify(qrItems));
    localStorage.setItem("namoqr-qrlist", JSON.stringify(qrItems));
    // Clear any deleted tracking set for restored IDs
    localStorage.removeItem("repiqr-deleted-qr-ids");
  } catch { /* ignore */ }

  if (backup.stickerPos && setStickerPos) {
    setStickerPos(backup.stickerPos);
    try {
      localStorage.setItem("repiqr-sticker-pos", JSON.stringify(backup.stickerPos));
    } catch { /* ignore */ }
  }

  // Bulk sync restored records to Supabase / Backend DB
  if (qrItems.length > 0) {
    await bulkSaveQrCodesToDb(qrItems);
  }

  return { restoredCount: qrItems.length };
}

/**
 * Download a file from Google Drive and restore its content
 */
export async function downloadAndRestoreFromDrive(
  fileId: string,
  config: GoogleDriveConfig,
  setQrList: (updater: (prev: QrRecord[]) => QrRecord[]) => void,
  setStickerPos?: (pos: StickerPos) => void
): Promise<{ success: boolean; restoredCount?: number; error?: string }> {
  if (!config.accessToken || !config.accessToken.trim()) {
    return { success: false, error: "Access token required" };
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Failed to download file from Google Drive: ${errText}` };
    }

    const backupData: BackupPackage = await response.json();
    const result = await restoreFromBackupPackage(backupData, setQrList, setStickerPos);
    return { success: true, restoredCount: result.restoredCount };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to download and restore backup" };
  }
}
