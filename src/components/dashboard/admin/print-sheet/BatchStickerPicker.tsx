import React, { useState, useMemo } from "react";
import { Search, Check, Printer, Tag, Filter } from "lucide-react";
import { QrRecord } from "../types";
import LabelBadge from "../labels/LabelBadge";
import { stickerRef, useCodesRevealed } from "../../../../lib/codeVisibility";

interface BatchStickerPickerProps {
  availableStickers: QrRecord[];
  selectedStickerIds: Set<string>;
  onToggleSticker: (stickerId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  maxSelectable: number;
  printedStickerIds: Set<string>;
  onTogglePrinted: (stickerId: string) => void;
}

export default function BatchStickerPicker({
  availableStickers,
  selectedStickerIds,
  onToggleSticker,
  onSelectAll,
  onDeselectAll,
  maxSelectable,
  printedStickerIds,
  onTogglePrinted,
}: BatchStickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [codesRevealed] = useCodesRevealed();
  const [labelFilter, setLabelFilter] = useState("all");
  const [printFilter, setPrintFilter] = useState<"all" | "unprinted" | "printed">("all");

  // Collect unique label names present among available stickers
  const uniqueLabels = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    availableStickers.forEach((s) => {
      if (s.labelName) {
        map.set(s.labelName.toLowerCase(), {
          name: s.labelName,
          color: s.labelColor || "#6366F1",
        });
      }
    });
    return Array.from(map.values());
  }, [availableStickers]);

  const filteredStickers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return availableStickers.filter((sticker) => {
      // Search query filter
      if (normalizedQuery) {
        const matchesCategory = (sticker.category || "").toLowerCase().includes(normalizedQuery);
        const matchesId = (sticker.id || "").toLowerCase().includes(normalizedQuery);
        const matchesVehicle = (sticker.vehicleName || "").toLowerCase().includes(normalizedQuery);
        const matchesPlate = (sticker.vehicleNumber || "").toLowerCase().includes(normalizedQuery);
        const matchesPhone = (sticker.ownerPhone || sticker.phoneNumber || "").toLowerCase().includes(normalizedQuery);
        const matchesLabel = (sticker.labelName || "").toLowerCase().includes(normalizedQuery);
        if (!matchesCategory && !matchesId && !matchesVehicle && !matchesPlate && !matchesPhone && !matchesLabel) {
          return false;
        }
      }

      // Label filter
      if (labelFilter !== "all") {
        if (labelFilter === "unlabeled") {
          if (sticker.labelName) return false;
        } else {
          if ((sticker.labelName || "").toLowerCase() !== labelFilter.toLowerCase()) return false;
        }
      }

      // Print status filter
      if (printFilter === "unprinted") {
        if (printedStickerIds.has(sticker.id) || sticker.isPrinted) return false;
      } else if (printFilter === "printed") {
        if (!printedStickerIds.has(sticker.id) && !sticker.isPrinted) return false;
      }

      return true;
    });
  }, [availableStickers, searchQuery, labelFilter, printFilter, printedStickerIds]);

  const selectedCount = selectedStickerIds.size;
  const atCap = selectedCount >= maxSelectable;

  const handleSelectAllFiltered = () => {
    filteredStickers.forEach((sticker) => {
      if (!selectedStickerIds.has(sticker.id) && selectedStickerIds.size < maxSelectable) {
        onToggleSticker(sticker.id);
      }
    });
  };

  return (
    <div className="space-y-4 font-body">
      {/* Controls & Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            {selectedCount} of {maxSelectable} selected
          </span>
          <span className="text-xs text-slate-400">({filteredStickers.length} available)</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Select All ({availableStickers.length})
          </button>
          {filteredStickers.length > 0 && filteredStickers.length < availableStickers.length && (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Select Filtered ({filteredStickers.length})
            </button>
          )}
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Search & Quick Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sticker ID, label, category, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all shadow-2xs"
          />
        </div>

        {/* Label Filter */}
        {uniqueLabels.length > 0 && (
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
          >
            <option value="all">All Labels ({uniqueLabels.length})</option>
            {uniqueLabels.map((lbl) => (
              <option key={lbl.name} value={lbl.name}>
                🏷️ {lbl.name}
              </option>
            ))}
            <option value="unlabeled">Unlabeled Only</option>
          </select>
        )}

        {/* Print Status Filter */}
        <select
          value={printFilter}
          onChange={(e) => setPrintFilter(e.target.value as any)}
          className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
        >
          <option value="all">All Print Status</option>
          <option value="unprinted">🖨️ Unprinted Only</option>
          <option value="printed">✅ Printed Only</option>
        </select>
      </div>

      {/* Sticker Cards */}
      <div className="max-h-72 overflow-y-auto pr-1">
        {filteredStickers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No stickers found matching current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredStickers.map((sticker) => {
              const isSelected = selectedStickerIds.has(sticker.id);
              const isPrinted = printedStickerIds.has(sticker.id) || sticker.isPrinted;
              const isBlocked = !isSelected && atCap;
              const mainRef = stickerRef(sticker, codesRevealed, (sticker.category || "car").toString());
              const identifier = sticker.vehicleName || "";

              return (
                <div
                  key={sticker.id}
                  onClick={() => {
                    onToggleSticker(sticker.id);
                  }}
                  className={`relative flex flex-col justify-between p-3 rounded-lg border transition-all select-none ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/30 cursor-pointer"
                      : isBlocked
                      ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs cursor-pointer"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {mainRef}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {sticker.category || "car"}
                        </span>
                      </div>

                      {identifier && identifier !== mainRef && (
                        <p className="text-xs text-slate-700 font-medium truncate mt-0.5">{identifier}</p>
                      )}

                      {/* Label Badge */}
                      {sticker.labelName && (
                        <div className="mt-1.5">
                          <LabelBadge name={sticker.labelName} color={sticker.labelColor} size="xs" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Status Bar */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                    {/* Printed Sign */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePrinted(sticker.id);
                      }}
                      title={isPrinted ? "Mark as unprinted" : "Mark as printed"}
                      className={`inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isPrinted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <Printer size={10} />
                      <span>{isPrinted ? "Printed" : "Unprinted"}</span>
                    </button>

                    <span className="text-[10px] text-slate-400">
                      {sticker.scans || 0} scans
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
