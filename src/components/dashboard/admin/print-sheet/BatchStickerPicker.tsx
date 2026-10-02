import React, { useState, useMemo } from "react";
import { Search, Check, Printer } from "lucide-react";
import { QrRecord } from "../types";

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

  const filteredStickers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return availableStickers;

    return availableStickers.filter((sticker) => {
      const matchesCategory = (sticker.category || "").toLowerCase().includes(normalizedQuery);
      const matchesVehicle = (sticker.vehicleName || "").toLowerCase().includes(normalizedQuery);
      const matchesPlate = (sticker.vehicleNumber || "").toLowerCase().includes(normalizedQuery);
      return matchesCategory || matchesVehicle || matchesPlate;
    });
  }, [availableStickers, searchQuery]);

  const selectedCount = selectedStickerIds.size;
  const atCap = selectedCount >= maxSelectable;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          {selectedCount} of {maxSelectable} selected
        </span>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search stickers…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 transition-colors"
        />
      </div>

      {/* Sticker Cards */}
      <div className="max-h-72 overflow-y-auto pr-1">
        {filteredStickers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No stickers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredStickers.map((sticker) => {
              const isSelected = selectedStickerIds.has(sticker.id);
              const isPrinted = printedStickerIds.has(sticker.id);
              const isBlocked = !isSelected && atCap;
              const identifier = sticker.vehicleNumber || sticker.vehicleName || "";

              return (
                <div
                  key={sticker.id}
                  onClick={() => {
                    // Always reach the real toggle handler, even when blocked —
                    // it already no-ops and shows a toast at the cap, so this
                    // is the single source of truth for whether a click adds a
                    // sticker instead of silently doing nothing here.
                    onToggleSticker(sticker.id);
                  }}
                  className={`relative flex items-start gap-3 p-4 rounded-md border transition-all select-none ${
                    isSelected
                      ? "border-slate-900 bg-[#FFFDF2] ring-2 ring-[#FFD444] cursor-pointer"
                      : isBlocked
                      ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                      : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? "bg-slate-900" : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} className="text-[#FFD444]" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {(sticker.category || "car").trim()}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{identifier}</p>
                  </div>

                  {/* Printed tick — independent of selection; click to mark/unmark
                      this sticker as already sent to print. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePrinted(sticker.id);
                    }}
                    title={isPrinted ? "Printed — click to unmark" : "Mark as printed"}
                    className={`flex-shrink-0 cursor-pointer ${isPrinted ? "text-emerald-600" : "text-slate-300 hover:text-slate-400"}`}
                  >
                    <Printer size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
