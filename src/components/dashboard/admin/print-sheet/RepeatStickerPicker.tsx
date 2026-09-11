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
    <div className="bg-[#F8F8F7] p-3.5 rounded-lg border border-[#E5E7EB] space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-[12px] font-bold text-[#18181B] flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#EAB308]" />
          <span>Choose Sticker to Repeat:</span>
        </label>
        <span className="text-[11px] text-[#71717A]">
          {stickers.length} {stickers.length === 1 ? "sticker" : "stickers"} available
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search filter for large fleets */}
        {stickers.length > 5 && (
          <div className="relative sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search tag ID or phone..."
              value={searchQuery}
              onChange={(searchEvent) => setSearchQuery(searchEvent.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-md pl-8 pr-3 py-1.5 text-[12.5px] text-[#18181B] placeholder-[#A1A1AA] outline-none focus:border-[#F5C518]"
            />
          </div>
        )}

        {/* Dropdown Selection */}
        <select
          value={selectedStickerId}
          onChange={(changeEvent) => onSelectSticker(changeEvent.target.value)}
          className="flex-1 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 text-[13px] font-semibold text-[#18181B] outline-none focus:border-[#F5C518] cursor-pointer"
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
        <div className="flex items-center gap-2 text-[11.5px] text-[#A16207] font-medium bg-[#FDF4DB]/60 px-2.5 py-1 rounded">
          <Check size={13} strokeWidth={2.5} />
          <span>Currently selected for 3×3 tiling: <strong className="font-mono font-bold text-[#18181B]">{selectedStickerId}</strong></span>
        </div>
      )}
    </div>
  );
}
