export interface StickerFolder {
  id: string;
  name: string;
  createdAt: string;
  color?: string;
  description?: string;
}

const STORAGE_KEY = "repiqr-sticker-folders";

const DEFAULT_FOLDERS: StickerFolder[] = [
  { id: "f-clients", name: "Clients", createdAt: new Date().toISOString() },
  { id: "f-lab", name: "Lab", createdAt: new Date().toISOString() },
  { id: "f-projects", name: "Projects", createdAt: new Date().toISOString() },
];

export function getStoredFolders(): StickerFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse error
  }
  // Initial default folders if none set
  saveStoredFolders(DEFAULT_FOLDERS);
  return DEFAULT_FOLDERS;
}

export function saveStoredFolders(folders: StickerFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch {
    // Ignore storage quota error
  }
}

export function addFolder(name: string): StickerFolder {
  const trimmed = name.trim();
  const current = getStoredFolders();
  const existing = current.find((f) => f.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newFolder: StickerFolder = {
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newFolder];
  saveStoredFolders(updated);
  return newFolder;
}

export function renameFolder(id: string, newName: string): StickerFolder[] {
  const trimmed = newName.trim();
  const current = getStoredFolders();
  const updated = current.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
  saveStoredFolders(updated);
  return updated;
}

export function removeFolder(id: string): StickerFolder[] {
  const current = getStoredFolders();
  const updated = current.filter((f) => f.id !== id);
  saveStoredFolders(updated);
  return updated;
}
