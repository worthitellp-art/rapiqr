import React from "react";
import FolderIcon from "./FolderIcon";
import { StickerFolder } from "./folderStorage";
import { ChevronRight, ArrowLeft, Printer, Tag, Folder, Plus, Search, Edit3 } from "lucide-react";

interface FolderBreadcrumbsProps {
  currentFolder: string;
  folderCount: number;
  onBackToAll: () => void;
  onPrintFolder?: () => void;
  onAssignFolderLabel?: () => void;
  onRenameFolder?: () => void;
  onCreateStickerInFolder?: () => void;
  searchInFolder?: string;
  onSearchChange?: (val: string) => void;
}

export default function FolderBreadcrumbs({
  currentFolder,
  folderCount,
  onBackToAll,
  onPrintFolder,
  onAssignFolderLabel,
  onRenameFolder,
  onCreateStickerInFolder,
  searchInFolder = "",
  onSearchChange,
}: FolderBreadcrumbsProps) {
  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-3 shadow-2xs space-y-3">
      {/* Top Address / Navigation Bar (Windows 11 Explorer style) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb Path & Back Button */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={onBackToAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Back to All Stickers"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          {/* Windows 11 styled breadcrumb pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/80 border border-gray-200 text-xs font-semibold text-gray-700">
            <button
              type="button"
              onClick={onBackToAll}
              className="hover:text-gray-950 transition-colors cursor-pointer"
            >
              All Stickers
            </button>
            <ChevronRight size={13} className="text-gray-400" />
            <div className="flex items-center gap-1.5 text-gray-950 font-bold">
              <FolderIcon size={18} variant="empty" />
              <span>{currentFolder}</span>
            </div>
            {onRenameFolder && (
              <button
                type="button"
                onClick={onRenameFolder}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Rename this folder"
              >
                <Edit3 size={12} />
              </button>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {folderCount} {folderCount !== 1 ? "stickers" : "sticker"}
          </span>
        </div>

        {/* Action Buttons for Folder (Print & Add Label) */}
        <div className="flex items-center gap-2 flex-wrap">
          {onRenameFolder && (
            <button
              type="button"
              onClick={onRenameFolder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
              title="Rename folder"
            >
              <Edit3 size={13} className="text-gray-500" />
              <span>Rename</span>
            </button>
          )}

          {onAssignFolderLabel && (
            <button
              type="button"
              onClick={onAssignFolderLabel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
              title="Add or update batch label for stickers in this folder"
            >
              <Tag size={13} className="text-amber-600" />
              <span>Add Label</span>
            </button>
          )}

          {onPrintFolder && (
            <button
              type="button"
              onClick={onPrintFolder}
              disabled={folderCount === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-40"
              title="Print all stickers in this folder"
            >
              <Printer size={13} />
              <span>Print Folder ({folderCount})</span>
            </button>
          )}

          {onCreateStickerInFolder && (
            <button
              type="button"
              onClick={onCreateStickerInFolder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={13} />
              <span>+ Add Sticker</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
