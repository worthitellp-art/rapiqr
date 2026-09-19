import React, { useState, useMemo } from "react";
import {
  Search,
  CheckSquare,
  Square,
  CheckCheck,
  XSquare,
  AlertCircle,
  Grid3X3,
  Car,
  Bike,
  DoorClosed,
  Dog,
  Luggage,
  Key,
  Tag,
  Layers,
  Sparkles,
  Check,
  Filter,
} from "lucide-react";
import { QrRecord } from "../types";

interface BatchStickerPickerProps {
  availableStickers: QrRecord[];
  selectedStickerIds: Set<string>;
  onToggleSticker: (stickerId: string) => void;
  onSelectAll: () => void;
  onSelectFirstNine: () => void;
  onDeselectAll: () => void;
  onSelectCategory?: (category: string, exclusive?: boolean) => void;
  onDeselectCategory?: (category: string) => void;
  onSelectFirstNineOfCategory?: (category: string) => void;
}

interface CategoryMeta {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  text: string;
  border: string;
  pill: string;
  badge: string;
}

export function getCategoryMeta(categoryName?: string): CategoryMeta {
  const c = (categoryName || "car").trim().toLowerCase();
  switch (c) {
    case "car":
    case "auto":
    case "truck":
      return {
        label: "Car",
        icon: Car,
        bg: "bg-blue-50/70",
        text: "text-blue-700",
        border: "border-blue-200",
        pill: "bg-blue-100 text-blue-800",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "bike":
    case "motorcycle":
    case "scooter":
    case "bicycle":
      return {
        label: "Bike",
        icon: Bike,
        bg: "bg-teal-50/70",
        text: "text-teal-700",
        border: "border-teal-200",
        pill: "bg-teal-100 text-teal-800",
        badge: "border-teal-200 bg-teal-50 text-teal-700",
      };
    case "home":
    case "door":
    case "gate":
    case "apartment":
      return {
        label: "Door / Home",
        icon: DoorClosed,
        bg: "bg-emerald-50/70",
        text: "text-emerald-700",
        border: "border-emerald-200",
        pill: "bg-emerald-100 text-emerald-800",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "pet":
    case "dog":
    case "cat":
      return {
        label: "Pet",
        icon: Dog,
        bg: "bg-amber-50/70",
        text: "text-amber-700",
        border: "border-amber-200",
        pill: "bg-amber-100 text-amber-800",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "bag":
    case "luggage":
    case "travel":
      return {
        label: "Luggage",
        icon: Luggage,
        bg: "bg-purple-50/70",
        text: "text-purple-700",
        border: "border-purple-200",
        pill: "bg-purple-100 text-purple-800",
        badge: "border-purple-200 bg-purple-50 text-purple-700",
      };
    case "key":
    case "keychain":
      return {
        label: "Keychain",
        icon: Key,
        bg: "bg-orange-50/70",
        text: "text-orange-700",
        border: "border-orange-200",
        pill: "bg-orange-100 text-orange-800",
        badge: "border-orange-200 bg-orange-50 text-orange-700",
      };
    default:
      return {
        label: c ? c.charAt(0).toUpperCase() + c.slice(1) : "General",
        icon: Tag,
        bg: "bg-slate-50/70",
        text: "text-slate-700",
        border: "border-slate-200",
        pill: "bg-slate-100 text-slate-800",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

export default function BatchStickerPicker({
  availableStickers,
  selectedStickerIds,
  onToggleSticker,
  onSelectAll,
  onSelectFirstNine,
  onDeselectAll,
  onSelectCategory,
  onDeselectCategory,
  onSelectFirstNineOfCategory,
}: BatchStickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");

  // Calculate category statistics (total and selected count per category)
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; selected: number; label: string }> = {};

    for (const sticker of availableStickers) {
      const rawCat = (sticker.category || "car").trim().toLowerCase();
      const meta = getCategoryMeta(rawCat);
      if (!stats[rawCat]) {
        stats[rawCat] = { total: 0, selected: 0, label: meta.label };
      }
      stats[rawCat].total += 1;
      if (selectedStickerIds.has(sticker.id)) {
        stats[rawCat].selected += 1;
      }
    }

    return stats;
  }, [availableStickers, selectedStickerIds]);

  const categoryKeys = useMemo(() => Object.keys(categoryStats).sort(), [categoryStats]);

  // Filter stickers by active category tab and search query
  const filteredStickers = useMemo(() => {
    let list = availableStickers;

    // 1. Category Tab Filter
    if (activeCategoryTab !== "all") {
      list = list.filter(
        (sticker) => (sticker.category || "car").trim().toLowerCase() === activeCategoryTab
      );
    }

    // 2. Search Query Filter
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return list;

    return list.filter((sticker) => {
      const matchesId = sticker.id.toLowerCase().includes(normalizedQuery);
      const matchesCategory = (sticker.category || "").toLowerCase().includes(normalizedQuery);
      const matchesPhone = (sticker.ownerPhone || "").toLowerCase().includes(normalizedQuery);
      const matchesVehicle = (sticker.vehicleName || "").toLowerCase().includes(normalizedQuery);
      const matchesPlate = (sticker.vehicleNumber || "").toLowerCase().includes(normalizedQuery);
      return matchesId || matchesCategory || matchesPhone || matchesVehicle || matchesPlate;
    });
  }, [availableStickers, activeCategoryTab, searchQuery]);

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* 1. Header with Selection Counters */}
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
            {selectedCount > 0
              ? `Each grid slot prints a unique sticker at 300 DPI with precise cut lines.`
              : "Pick individual stickers or use the category buttons below to batch-print by category."}
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCheck size={13} className="text-slate-600" />
            <span>Select All ({availableStickers.length})</span>
          </button>

          {availableStickers.length >= 9 && (
            <button
              type="button"
              onClick={onSelectFirstNine}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Fill exactly one 3×3 sheet (first 9 stickers)"
            >
              <Grid3X3 size={13} className="text-slate-600" />
              <span>Fill 1 Sheet (9)</span>
            </button>
          )}

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

      {/* 2. CATEGORY TABS (CATEGORY-WISE PRINT ABILITY) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter size={12} /> Category Filter & Quick Actions
          </span>
          {activeCategoryTab !== "all" && (
            <button
              type="button"
              onClick={() => setActiveCategoryTab("all")}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Show all categories
            </button>
          )}
        </div>

        {/* Category Tab Pills */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 scrollbar-none">
          {/* All Tab */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategoryTab === "all"
                ? "bg-[#14120C] text-white shadow-sm ring-2 ring-[#FFD444]/40"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Layers size={13} />
            <span>All Categories</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeCategoryTab === "all" ? "bg-white/20 text-[#FFD444]" : "bg-slate-200 text-slate-600"
              }`}
            >
              {selectedCount}/{availableStickers.length}
            </span>
          </button>

          {/* Individual Category Tabs */}
          {categoryKeys.map((catKey) => {
            const cat = categoryStats[catKey];
            const meta = getCategoryMeta(catKey);
            const IconComponent = meta.icon;
            const isTabActive = activeCategoryTab === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategoryTab(catKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isTabActive
                    ? "bg-[#14120C] text-white shadow-sm ring-2 ring-[#FFD444]/40"
                    : `${meta.bg} ${meta.text} border ${meta.border} hover:brightness-95`
                }`}
              >
                <IconComponent size={13} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isTabActive
                      ? "bg-white/20 text-[#FFD444]"
                      : cat.selected > 0
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-white/70 text-slate-600"
                  }`}
                >
                  {cat.selected}/{cat.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category-Wise Bulk Action Bar */}
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-2.5 flex flex-wrap items-center justify-between gap-2">
          {activeCategoryTab === "all" ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Quick category print:</span>
              {categoryKeys.map((catKey) => {
                const cat = categoryStats[catKey];
                const meta = getCategoryMeta(catKey);
                const IconComponent = meta.icon;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => onSelectCategory?.(catKey, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    title={`Clear others and select all ${cat.total} ${cat.label} stickers for printing`}
                  >
                    <IconComponent size={12} className={meta.text} />
                    <span>Print Only {cat.label} ({cat.total})</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {(() => {
                const cat = categoryStats[activeCategoryTab];
                const meta = getCategoryMeta(activeCategoryTab);
                const IconComponent = meta.icon;
                if (!cat) return null;

                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${meta.bg} ${meta.text}`}>
                        <IconComponent size={13} />
                        {cat.label} ({cat.selected} of {cat.total} selected)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectCategory?.(activeCategoryTab, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#14120C] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                      >
                        <Sparkles size={12} className="text-[#FFD444]" />
                        <span>Print ONLY {cat.label}s ({cat.total})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectCategory?.(activeCategoryTab, false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Add All {cat.label}s</span>
                      </button>

                      {cat.total >= 9 && (
                        <button
                          type="button"
                          onClick={() => onSelectFirstNineOfCategory?.(activeCategoryTab)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Grid3X3 size={12} />
                          <span>Fill 1 Sheet of {cat.label}s (9)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeselectCategory?.(activeCategoryTab)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <XSquare size={12} />
                        <span>Clear {cat.label}s</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* 3. SEARCH BAR */}
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

      {/* 4. VISIBLE STICKERS CARDS GRID */}
      <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {filteredStickers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No stickers found matching "{searchQuery}" in {activeCategoryTab === "all" ? "fleet" : activeCategoryTab}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredStickers.map((sticker) => {
              const isSelected = selectedStickerIds.has(sticker.id);
              const slotNumber = selectedOrderMap.get(sticker.id);
              const sheetNumber = slotNumber ? Math.ceil(slotNumber / 9) : null;
              const slotInSheet = slotNumber ? ((slotNumber - 1) % 9) + 1 : null;
              const meta = getCategoryMeta(sticker.category);
              const IconComponent = meta.icon;

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
                  {/* Top Row: Checkbox, Category Badge, Slot Number */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded bg-[#14120C] text-[#FFD444] flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-slate-400 bg-white" />
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badge}`}
                      >
                        <IconComponent size={10} />
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    {isSelected && slotNumber && (
                      <span className="text-[10px] font-extrabold font-mono bg-[#14120C] text-[#FFD444] px-1.5 py-0.5 rounded flex-shrink-0 shadow-2xs">
                        S{sheetNumber}:#{slotInSheet}
                      </span>
                    )}
                  </div>

                  {/* Middle Row: Formatted Monospace Tag ID */}
                  <div className="py-0.5">
                    <p
                      className="font-mono text-xs font-bold text-slate-900 truncate"
                      title={sticker.id}
                    >
                      {sticker.id}
                    </p>
                  </div>

                  {/* Bottom Row: Vehicle Plate / Owner Details if present */}
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

      {/* 5. Warning if zero selected */}
      {selectedCount === 0 && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>Please select at least 1 sticker above to generate a 3×3 print sheet.</span>
        </div>
      )}
    </div>
  );
}
