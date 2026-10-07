import React, { useState, useEffect } from "react";
import FolderIcon from "./FolderIcon";
import { StickerFolder } from "./folderStorage";
import { X, Edit3 } from "lucide-react";

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: StickerFolder | null;
  onRename: (folder: StickerFolder, newName: string) => void;
}

export default function RenameFolderModal({
  isOpen,
  onClose,
  folder,
  onRename,
}: RenameFolderModalProps) {
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) return;
    onRename(folder, trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-950 font-display">Rename Folder</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-center py-2">
          <FolderIcon size={64} variant="sheet" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Folder Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Clients, Batch March, Lab"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || folderName.trim() === folder.name}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-black transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
