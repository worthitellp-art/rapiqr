import React, { useRef, useState } from "react";
import FolderIcon from "./FolderIcon";
import { StickerFolder } from "./folderStorage";
import { MoreVertical, Printer, Tag, Trash2, FolderOpen, Edit3 } from "lucide-react";

interface FolderCardProps {
  key?: React.Key;
  folder: StickerFolder;
  stickerCount: number;
  isSelected?: boolean;
  onOpen: (folder: StickerFolder) => void;
  onPrint?: (folder: StickerFolder) => void;
  onAssignLabel?: (folder: StickerFolder) => void;
  onDelete?: (folder: StickerFolder) => void;
  onRename?: (folder: StickerFolder) => void;
  onClick?: () => void;
}

export default function FolderCard({
  folder,
  stickerCount,
  isSelected = false,
  onOpen,
  onPrint,
  onAssignLabel,
  onDelete,
  onRename,
  onClick,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Handle double-click for desktop
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen(folder);
  };

  // Handle touch tap / double-tap for mobile
  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      onOpen(folder);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`
        group relative flex flex-col items-center justify-between p-3.5 rounded-2xl
        transition-all duration-150 select-none cursor-pointer border
        ${menuOpen ? "z-40" : ""}
        ${
          isSelected
            ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
            : "bg-white/80 hover:bg-gray-50/90 border-gray-200/90 hover:border-gray-300 shadow-2xs hover:shadow-xs"
        }
      `}
      title="Double-click to open folder"
    >
      {/* 3-dots context menu trigger */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div
              className="absolute right-0 top-6 z-30 w-44 rounded-xl bg-white border border-gray-200 shadow-xl py-1 text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(folder);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <FolderOpen size={13} className="text-amber-500" />
                <span>Open Folder</span>
              </button>

              {onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onPrint(folder);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={13} className="text-gray-500" />
                  <span>Print All Stickers</span>
                </button>
              )}

              {onAssignLabel && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAssignLabel(folder);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Tag size={13} className="text-gray-500" />
                  <span>Assign Label</span>
                </button>
              )}

              {onRename && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(folder);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 size={13} className="text-gray-500" />
                  <span>Rename</span>
                </button>
              )}

              {onDelete && (
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(folder);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Folder</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Windows 11 Yellow Folder Icon */}
      <div className="pt-2 pb-1.5 flex items-center justify-center">
        <FolderIcon size={68} variant={stickerCount > 0 ? "sheet" : "empty"} />
      </div>

      {/* Folder Name & Sticker Count */}
      <div className="text-center w-full px-1">
        <p className="text-xs font-bold text-gray-900 truncate max-w-full font-display">
          {folder.name}
        </p>
        <span className="text-[10px] text-gray-500 font-medium">
          {stickerCount} {stickerCount === 1 ? "sticker" : "stickers"}
        </span>
      </div>

      {/* Hover action hint */}
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Double-click to open
        </span>
      </div>
    </div>
  );
}
