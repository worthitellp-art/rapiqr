import React, { useState, useMemo } from "react";
import { Search, CheckCheck, XSquare, AlertCircle, Check } from "lucide-react";
import { QrRecord } from "../types";

interface BatchStickerPickerProps {
  availableStickers: QrRecord[];
  selectedStickerIds: Set<string>;
  onToggleSticker: (stickerId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function BatchStickerPicker({
  availableStickers,
  selectedStickerIds,
  onToggleSticker,
  onSelectAll,
  onDeselectAll,
}: BatchStickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStickers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return availableStickers;

    return availableStickers.filter((sticker) => {
      const matchesId = sticker.id.toLowerCase().includes(normalizedQuery);
      const matchesCategory = (sticker.category || "").toLowerCase().includes(normalizedQuery);
      const matchesPhone = (sticker.ownerPhone || "").toLowerCase().includes(normalizedQuery);
      const matchesVehicle = (sticker.vehicleName || "").toLowerCase().includes(normalizedQuery);
      const matchesPlate = (sticker.vehicleNumber || "").toLowerCase().includes(normalizedQuery);
      return matchesId || matchesCategory || matchesPhone || matchesVehicle || matchesPlate;
    });
  }, [availableStickers, searchQuery]);

  const selectedCount = selectedStickerIds.size;
  const sheetCount = Math.ceil(selectedCount / 9);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header with Selection Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">Select Stickers to Print</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#14120C] text-white px-2.5 py-0.5 rounded-full shadow-xs">
              <span className="text-[#FFD444] font-mono">{selectedCount}</span> of {availableStickers.length} Selected
            </span>
            {selectedCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {sheetCount} Sheet{sheetCount > 1 ? "s" : ""} (9 / sheet)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Each grid slot prints a unique sticker at 300 DPI with precise cut lines.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCheck size={13} className="text-slate-600" />
            <span>Select All ({availableStickers.length})</span>
          </button>

          <button
            type="button"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XSquare size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter stickers by tag ID, category, plate, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#14120C] focus:bg-white focus:ring-2 focus:ring-[#FFD444]/30 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sticker Cards Grid */}
      <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {filteredStickers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No stickers found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredStickers.map((sticker) => {
              const isSelected = selectedStickerIds.has(sticker.id);

              return (
                <div
                  key={sticker.id}
                  onClick={() => onToggleSticker(sticker.id)}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-[#14120C] bg-[#FFFDF7] ring-1.5 ring-[#FFD444] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 mb-1.5">
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-[#14120C] text-[#FFD444] flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-slate-400 bg-white" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                      {(sticker.category || "car").trim()}
                    </span>
                  </div>

                  <div className="py-0.5">
                    <p className="font-mono text-xs font-bold text-slate-900 truncate" title={sticker.id}>
                      {sticker.id}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-100/70 mt-1">
                    <span className="truncate font-medium">
                      {sticker.vehicleNumber || sticker.vehicleName || sticker.ownerPhone || "Ready for Assignment"}
                    </span>
                    <span className="text-[9.5px] font-semibold text-slate-400 uppercase">
                      {sticker.status || "Active"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCount === 0 && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>Please select at least 1 sticker above to generate a 3×3 print sheet.</span>
        </div>
      )}
    </div>
  );
}
