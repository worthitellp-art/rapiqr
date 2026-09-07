import React, { useState, useMemo } from "react";
import { Search, CheckSquare, Square, CheckCheck, XSquare, AlertCircle, Grid3X3 } from "lucide-react";
import { QrRecord } from "../types";

interface BatchStickerPickerProps {
  availableStickers: QrRecord[];
  selectedStickerIds: Set<string>;
  onToggleSticker: (stickerId: string) => void;
  onSelectAll: () => void;
  onSelectFirstNine: () => void;
  onDeselectAll: () => void;
}

export default function BatchStickerPicker({
  availableStickers,
  selectedStickerIds,
  onToggleSticker,
  onSelectAll,
  onSelectFirstNine,
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
      return matchesId || matchesCategory || matchesPhone;
    });
  }, [availableStickers, searchQuery]);

  // Map each selected sticker ID to its 1-based order on the print sheet
  const selectedOrderMap = useMemo(() => {
    const orderMap = new Map<string, number>();
    let currentIndex = 1;
    for (const sticker of availableStickers) {
      if (selectedStickerIds.has(sticker.id)) {
        orderMap.set(sticker.id, currentIndex);
        currentIndex += 1;
      }
    }
    return orderMap;
  }, [availableStickers, selectedStickerIds]);

  const selectedCount = selectedStickerIds.size;
  const sheetCount = Math.ceil(selectedCount / 9);

  return (
    <div className="bg-[#F7F7F8] p-3.5 rounded-lg border border-[#E5E5E7] space-y-3">
      {/* Header with Title and Quick Select Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#17181A]">Select Unique Stickers for 3×3 Sheets:</span>
            <span className="text-[11px] font-bold bg-[#E8EDFF] text-[#3E52B8] px-2.5 py-0.5 rounded-full">
              {selectedCount} of {availableStickers.length} Selected
            </span>
          </div>
          <p className="text-[11.5px] text-[#777B80] mt-0.5">
            {selectedCount > 0
              ? `Each sticker slot is unique. Will generate ${sheetCount} sheet${sheetCount > 1 ? "s" : ""} (9 unique tags per 18×12″ page)`
              : "Select stickers below. Each slot in the 3×3 grid receives a different sticker."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#3E52B8] bg-white border border-[#5C78DF]/30 rounded hover:bg-[#E8EDFF] transition-colors cursor-pointer"
          >
            <CheckCheck size={12} />
            <span>Select All ({availableStickers.length})</span>
          </button>

          {availableStickers.length >= 9 && (
            <button
              type="button"
              onClick={onSelectFirstNine}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#17181A] bg-white border border-[#E5E5E7] rounded hover:bg-[#F3F3F4] transition-colors cursor-pointer"
              title="Select first 9 stickers to fill exactly one 18×12″ sheet"
            >
              <Grid3X3 size={12} />
              <span>Fill 1 Sheet (9)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDeselectAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#777B80] bg-white border border-[#E5E5E7] rounded hover:bg-[#F3F3F4] transition-colors cursor-pointer"
          >
            <XSquare size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777B80]" />
        <input
          type="text"
          placeholder="Filter stickers by tag ID, category, or phone..."
          value={searchQuery}
          onChange={(searchEvent) => setSearchQuery(searchEvent.target.value)}
          className="w-full bg-white border border-[#E5E5E7] rounded-md pl-8 pr-3 py-1.5 text-[12px] text-[#17181A] placeholder-[#9CA0A6] outline-none focus:border-[#5C78DF]"
        />
      </div>

      {/* Stickers Checkbox Grid */}
      <div className="max-h-44 overflow-y-auto bg-white border border-[#E5E5E7] rounded-md p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
        {filteredStickers.length === 0 ? (
          <div className="col-span-full py-4 text-center text-[12px] text-[#777B80]">
            No stickers match "{searchQuery}"
          </div>
        ) : (
          filteredStickers.map((sticker) => {
            const isSelected = selectedStickerIds.has(sticker.id);
            const slotNumber = selectedOrderMap.get(sticker.id);
            const sheetNumber = slotNumber ? Math.ceil(slotNumber / 9) : null;
            const slotInSheet = slotNumber ? ((slotNumber - 1) % 9) + 1 : null;

            return (
              <div
                key={sticker.id}
                onClick={() => onToggleSticker(sticker.id)}
                className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer text-[12px] ${
                  isSelected
                    ? "border-[#5C78DF] bg-[#F4F7FF] text-[#17181A] font-medium"
                    : "border-[#E5E5E7] hover:bg-[#FAFAFB] text-[#777B80]"
                }`}
              >
                {isSelected ? (
                  <CheckSquare size={15} className="text-[#5C78DF] flex-shrink-0" />
                ) : (
                  <Square size={15} className="text-[#9CA0A6] flex-shrink-0" />
                )}

                <div className="truncate flex-1">
                  <span className="font-mono font-bold text-[#17181A]">{sticker.id}</span>
                  <span className="text-[10px] text-[#777B80] ml-1.5 uppercase">
                    {sticker.category || "Car"}
                  </span>
                </div>

                {isSelected && slotNumber && (
                  <span className="text-[10px] font-bold font-mono bg-[#E8EDFF] text-[#3E52B8] px-1.5 py-0.5 rounded flex-shrink-0">
                    S{sheetNumber}:#{slotInSheet}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedCount === 0 && (
        <div className="flex items-center gap-2 text-[12px] text-[#DC2626] bg-[#FDF2F2] border border-[#FCA5A5] p-2 rounded">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Please select at least 1 sticker above. Each slot on the sheet will print a unique sticker.</span>
        </div>
      )}
    </div>
  );
}
