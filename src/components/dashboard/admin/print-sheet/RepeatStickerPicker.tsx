import React, { useState, useMemo } from "react";
import { Search, Check, Sparkles } from "lucide-react";
import { QrRecord } from "../types";

interface RepeatStickerPickerProps {
  stickers: QrRecord[];
  selectedStickerId: string;
  onSelectSticker: (stickerId: string) => void;
}

export default function RepeatStickerPicker({
  stickers,
  selectedStickerId,
  onSelectSticker,
}: RepeatStickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStickers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return stickers;

    return stickers.filter((sticker) => {
      const matchesId = sticker.id.toLowerCase().includes(normalizedQuery);
      const matchesCategory = (sticker.category || "").toLowerCase().includes(normalizedQuery);
      const matchesPhone = (sticker.ownerPhone || "").toLowerCase().includes(normalizedQuery);
      return matchesId || matchesCategory || matchesPhone;
    });
  }, [stickers, searchQuery]);

  return (
    <div className="bg-[#F7F7F8] p-3.5 rounded-lg border border-[#E5E5E7] space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-[12px] font-bold text-[#17181A] flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#5C78DF]" />
          <span>Choose Sticker to Repeat:</span>
        </label>
        <span className="text-[11px] text-[#777B80]">
          {stickers.length} {stickers.length === 1 ? "sticker" : "stickers"} available
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search filter for large fleets */}
        {stickers.length > 5 && (
          <div className="relative sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777B80]" />
            <input
              type="text"
              placeholder="Search tag ID or phone..."
              value={searchQuery}
              onChange={(searchEvent) => setSearchQuery(searchEvent.target.value)}
              className="w-full bg-white border border-[#E5E5E7] rounded-md pl-8 pr-3 py-1.5 text-[12.5px] text-[#17181A] placeholder-[#9CA0A6] outline-none focus:border-[#5C78DF]"
            />
          </div>
        )}

        {/* Dropdown Selection */}
        <select
          value={selectedStickerId}
          onChange={(changeEvent) => onSelectSticker(changeEvent.target.value)}
          className="flex-1 bg-white border border-[#E5E5E7] rounded-md px-3 py-1.5 text-[13px] font-semibold text-[#17181A] outline-none focus:border-[#5C78DF] cursor-pointer"
        >
          {filteredStickers.length === 0 ? (
            <option value="" disabled>
              No matching stickers found
            </option>
          ) : (
            filteredStickers.map((sticker) => (
              <option key={sticker.id} value={sticker.id}>
                {sticker.id} · {sticker.category || "Car"} ({sticker.ownerPhone || "Unassigned"})
              </option>
            ))
          )}
        </select>
      </div>

      {selectedStickerId && (
        <div className="flex items-center gap-2 text-[11.5px] text-[#5C78DF] font-medium bg-[#E8EDFF]/60 px-2.5 py-1 rounded">
          <Check size={13} strokeWidth={2.5} />
          <span>Currently selected for 3×3 tiling: <strong className="font-mono font-bold text-[#17181A]">{selectedStickerId}</strong></span>
        </div>
      )}
    </div>
  );
}
