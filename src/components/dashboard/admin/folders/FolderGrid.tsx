import React from "react";
import FolderCard from "./FolderCard";
import { StickerFolder } from "./folderStorage";
import { FolderPlus, Folder as FolderOutline, ChevronDown, ChevronUp } from "lucide-react";

interface FolderGridProps {
  folders: StickerFolder[];
  stickerCounts: Record<string, number>;
  selectedFolderId?: string | null;
  onSelectFolder?: (folder: StickerFolder) => void;
  onOpenFolder: (folder: StickerFolder) => void;
  onPrintFolder?: (folder: StickerFolder) => void;
  onAssignLabelFolder?: (folder: StickerFolder) => void;
  onDeleteFolder?: (folder: StickerFolder) => void;
  onRenameFolder?: (folder: StickerFolder) => void;
  onCreateFolderClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function FolderGrid({
  folders,
  stickerCounts,
  selectedFolderId,
  onSelectFolder,
  onOpenFolder,
  onPrintFolder,
  onAssignLabelFolder,
  onDeleteFolder,
  onRenameFolder,
  onCreateFolderClick,
  isCollapsed = false,
  onToggleCollapse,
}: FolderGridProps) {
  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
      {/* Folder Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs font-display">
            <FolderOutline size={15} className="text-amber-500" />
            <span>Folders</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
            {folders.length}
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            (Double-click or double-tap to open collection)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateFolderClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <FolderPlus size={13} className="text-amber-600" />
            <span>+ New Folder</span>
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              title={isCollapsed ? "Expand folders" : "Collapse folders"}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Windows 11 Explorer Style Folder Row/Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-1">
          {folders.map((folder) => {
            const count = stickerCounts[folder.name.toLowerCase()] || 0;
            const isSelected = selectedFolderId === folder.id;

            return (
              <FolderCard
                key={folder.id}
                folder={folder}
                stickerCount={count}
                isSelected={isSelected}
                onClick={() => onSelectFolder?.(folder)}
                onOpen={onOpenFolder}
                onPrint={onPrintFolder}
                onAssignLabel={onAssignLabelFolder}
                onDelete={onDeleteFolder}
                onRename={onRenameFolder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
