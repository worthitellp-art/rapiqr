import React, { useState } from "react";
import FolderIcon from "./FolderIcon";
import { StickerFolder } from "./folderStorage";
import { X, FolderPlus, Folder, Check } from "lucide-react";

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: StickerFolder[];
  selectedCount: number;
  onMoveToFolder: (folderName: string | null) => void;
  onCreateNewFolder: () => void;
}

export default function MoveToFolderModal({
  isOpen,
  onClose,
  folders,
  selectedCount,
  onMoveToFolder,
  onCreateNewFolder,
}: MoveToFolderModalProps) {
  if (!isOpen) return null;

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
            <Folder size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-950 font-display">
              Move {selectedCount} Sticker{selectedCount !== 1 ? "s" : ""}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Choose a destination folder to group and organize these {selectedCount} stickers.
        </p>

        {/* Folder List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {/* None / Unassigned Option */}
          <button
            type="button"
            onClick={() => {
              onMoveToFolder(null);
              onClose();
            }}
            className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                ∅
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Unassigned</p>
                <p className="text-[10px] text-gray-400">Remove from any folder</p>
              </div>
            </div>
          </button>

          {/* Existing Folders */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onMoveToFolder(folder.name);
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FolderIcon size={32} />
                <p className="text-xs font-bold text-gray-900 group-hover:text-amber-900">
                  {folder.name}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Create New Folder Action */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewFolder();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>+ Create New Folder</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
