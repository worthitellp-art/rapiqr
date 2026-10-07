import React, { useState, useMemo } from "react";
import FolderCard from "./FolderCard";
import { StickerFolder } from "./folderStorage";
import {
  FolderPlus,
  Search,
  Monitor,
  ChevronRight,
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  HardDrive,
  FolderOpen,
} from "lucide-react";

interface FolderGridProps {
  folders: StickerFolder[];
  stickerCounts: Record<string, number>;
  totalStickersCount?: number;
  selectedFolderId?: string | null;
  onSelectFolder?: (folder: StickerFolder) => void;
  onOpenFolder: (folder: StickerFolder) => void;
  onPrintFolder?: (folder: StickerFolder) => void;
  onAssignLabelFolder?: (folder: StickerFolder) => void;
  onDeleteFolder?: (folder: StickerFolder) => void;
  onRenameFolder?: (folder: StickerFolder) => void;
  onCreateFolderClick: () => void;
}

export default function FolderGrid({
  folders,
  stickerCounts,
  totalStickersCount = 0,
  selectedFolderId,
  onSelectFolder,
  onOpenFolder,
  onPrintFolder,
  onAssignLabelFolder,
  onDeleteFolder,
  onRenameFolder,
  onCreateFolderClick,
}: FolderGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count" | "date">("name");
  const [viewDensity, setViewDensity] = useState<"comfortable" | "compact">("comfortable");

  // Filter & sort folders
  const displayedFolders = useMemo(() => {
    let list = [...folders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "count") {
        const countA = stickerCounts[a.name.toLowerCase()] || 0;
        const countB = stickerCounts[b.name.toLowerCase()] || 0;
        return countB - countA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [folders, searchQuery, sortBy, stickerCounts]);

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden select-none">
      {/* ── 1. Windows 11 Explorer Address Bar & Search ─────────────────────── */}
      <div className="p-3 bg-gray-50/70 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Address Bar (This PC > New Volume (D:) style) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200/80 shadow-2xs text-xs font-medium text-gray-700 flex-1 min-w-[260px] max-w-xl">
          <Monitor size={14} className="text-blue-500 shrink-0" />
          <span className="text-gray-500">This PC</span>
          <ChevronRight size={12} className="text-gray-400" />
          <HardDrive size={13} className="text-amber-500 shrink-0" />
          <span className="font-bold text-gray-950">QR Stickers (D:)</span>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-400 text-[11px]">Folders Root</span>
        </div>

        {/* Search Folders */}
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200/80 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 transition-all font-medium"
          />
        </div>
      </div>

      {/* ── 2. Windows 11 Explorer Command Toolbar ──────────────────────────── */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* + New Folder */}
          <button
            type="button"
            onClick={onCreateFolderClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-black text-white font-bold transition-all cursor-pointer shadow-xs"
          >
            <FolderPlus size={14} />
            <span>+ New Folder</span>
          </button>

          {/* Sort Menu */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-xl">
            <ArrowUpDown size={12} className="text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="name">Sort: Name</option>
              <option value="count">Sort: Stickers Count</option>
              <option value="date">Sort: Created Date</option>
            </select>
          </div>

          {/* Density toggle */}
          <button
            type="button"
            onClick={() => setViewDensity(viewDensity === "comfortable" ? "compact" : "comfortable")}
            className="p-1.5 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg cursor-pointer"
            title={`Switch to ${viewDensity === "comfortable" ? "compact" : "comfortable"} grid`}
          >
            {viewDensity === "comfortable" ? <LayoutGrid size={14} /> : <List size={14} />}
          </button>
        </div>

        {/* Helpful Hint */}
        <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
          <FolderOpen size={12} className="text-amber-500" />
          <span>Double-tap or double-click any folder to open its sticker collection</span>
        </div>
      </div>

      {/* ── 3. Windows 11 Explorer Folder Canvas ────────────────────────────── */}
      <div className="p-6 bg-white min-h-[320px]">
        {displayedFolders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <FolderPlus size={26} />
            </div>
            <p className="text-sm font-bold text-gray-800">
              {searchQuery ? "No matching folders found" : "No folders yet"}
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery
                ? `No folder matching "${searchQuery}". Clear search or create a new folder.`
                : "Create your first folder to organize and print stickers in batches."}
            </p>
            <button
              type="button"
              onClick={onCreateFolderClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <FolderPlus size={14} />
              <span>+ Create First Folder</span>
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              viewDensity === "comfortable"
                ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
                : "grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
            }`}
          >
            {displayedFolders.map((folder) => {
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

      {/* ── 4. Windows 11 Explorer Bottom Status Bar ────────────────────────── */}
      <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500 font-medium">
        <div>
          <span>{displayedFolders.length} folders</span>
          {totalStickersCount > 0 && (
            <span className="ml-2 pl-2 border-l border-gray-300">
              {totalStickersCount} total stickers inside folders
            </span>
          )}
        </div>
        <div className="text-gray-400">
          Windows 11 Explorer Mode
        </div>
      </div>
    </div>
  );
}
