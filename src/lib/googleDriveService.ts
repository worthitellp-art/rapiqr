import { QrRecord, StickerPos } from "../components/dashboard/admin/types";
import { apiClient } from "./apiClient";

export interface GoogleDriveConfig {
  accessToken: string;
  folderId: string;
  folderName: string;
  autoBackup: boolean;
  lastBackupTime?: string;
  connectedEmail?: string;
  connectedName?: string;
  connectedAvatar?: string;
  connectedAt?: string;
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
export const DEFAULT_GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  "640446362534-73ub5mvtklhs4e3eldvde892q8jbtlbo.apps.googleusercontent.com";

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
 * Disconnect Google Drive account
 */
export function disconnectGoogleDrive(): GoogleDriveConfig {
  const cleared: GoogleDriveConfig = {
    accessToken: "",
    folderId: "",
    folderName: "RapiQR Fleet Backups",
    autoBackup: false,
    connectedEmail: undefined,
    connectedName: undefined,
    connectedAvatar: undefined,
    connectedAt: undefined,
  };
  saveGoogleDriveConfig(cleared);
  return cleared;
}

/**
 * Ensure Google Identity Services script is loaded
 */
export function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).google?.accounts?.oauth2 !== "undefined") {
      resolve();
      return;
    }
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Connect Google Drive using official Google OAuth Token Client (1-Click Popup)
 */
export async function connectGoogleDriveOAuth(
  customClientId?: string
): Promise<{ success: boolean; config?: GoogleDriveConfig; error?: string }> {
  try {
    await loadGoogleGsiScript();

    const clientId = (customClientId || DEFAULT_GOOGLE_CLIENT_ID).trim();
    if (!clientId) {
      return { success: false, error: "Google Client ID is not configured." };
    }

    const tokenResponse = await new Promise<any>((resolve, reject) => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: [
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ].join(" "),
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else if (!response.access_token) {
              reject(new Error("No access token returned from Google."));
            } else {
              resolve(response);
            }
          },
          error_callback: (err: any) => {
            reject(new Error(err?.message || "Google OAuth sign-in was cancelled or failed."));
          },
        });

        client.requestAccessToken({ prompt: "consent" });
      } catch (err: any) {
        reject(err);
      }
    });

    const accessToken = tokenResponse.access_token;

    // Fetch user profile info to verify connection and display user details
    let connectedEmail: string | undefined;
    let connectedName: string | undefined;
    let connectedAvatar: string | undefined;

    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        connectedEmail = userData.email;
        connectedName = userData.name;
        connectedAvatar = userData.picture;
      }
    } catch {
      // Non-critical, fallback gracefully
    }

    // Automatically locate or create the "RapiQR Fleet Backups" folder on Drive
    let folderId = "";
    try {
      folderId = await ensureDriveBackupFolder(accessToken, "RapiQR Fleet Backups");
    } catch (folderErr) {
      console.warn("Could not create/locate backup folder, using root Drive:", folderErr);
    }

    const currentConfig = getGoogleDriveConfig();
    const updatedConfig: GoogleDriveConfig = {
      ...currentConfig,
      accessToken,
      folderId: folderId || currentConfig.folderId || "",
      folderName: "RapiQR Fleet Backups",
      connectedEmail: connectedEmail || "Connected Google Account",
      connectedName: connectedName || "Google Drive User",
      connectedAvatar,
      connectedAt: new Date().toISOString(),
    };

    saveGoogleDriveConfig(updatedConfig);
    return { success: true, config: updatedConfig };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to authenticate with Google Drive." };
  }
}

/**
 * Locate or create the backup folder on Google Drive
 */
export async function ensureDriveBackupFolder(accessToken: string, folderName = "RapiQR Fleet Backups"): Promise<string> {
  // Check if folder already exists
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      description: "Automated database backups from RapiQR Fleet Manager",
    }),
  });

  if (createRes.ok) {
    const createData = await createRes.json();
    return createData.id;
  }

  return "";
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
    return { success: false, error: "Google Drive is not connected. Please connect your Google account first." };
  }

  const packageData = createBackupPackage(qrList, stickerPos);
  const jsonContent = JSON.stringify(packageData, null, 2);
  const timestampStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `rapiqr_fleet_backup_${timestampStr}.json`;

  const fileMetadata: Record<string, any> = {
    name: fileName,
    mimeType: "application/json",
    description: `RapiQR Fleet Database Backup (${qrList.length} QR stickers)`,
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
      if (response.status === 401) {
        return { success: false, error: "Google Drive session expired. Please re-connect your Google Account." };
      }
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
    return { success: false, error: "Google Drive is not connected." };
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
      if (response.status === 401) {
        return { success: false, error: "Google Drive session expired. Please re-connect your Google Account." };
      }
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

  // Bulk sync restored records to the backend (no bulk endpoint — loop single saves)
  if (qrItems.length > 0) {
    for (const qr of qrItems) {
      try {
        await apiClient.qr.saveQrCode(qr);
      } catch (err) {
        console.warn(`Failed to sync restored QR ${(qr as any)?.id} to backend:`, err);
      }
    }
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

