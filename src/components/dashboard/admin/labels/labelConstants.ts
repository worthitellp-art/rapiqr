import { StickerLabel } from "../types";

export interface LabelColorPreset {
  id: string;
  name: string;
  hex: string;
}

export const LABEL_COLOR_PRESETS: LabelColorPreset[] = [
  { id: "indigo", name: "Indigo", hex: "#6366F1" },
  { id: "emerald", name: "Emerald", hex: "#10B981" },
  { id: "blue", name: "Blue", hex: "#3B82F6" },
  { id: "violet", name: "Violet", hex: "#8B5CF6" },
  { id: "amber", name: "Amber", hex: "#F59E0B" },
  { id: "rose", name: "Rose", hex: "#F43F5E" },
  { id: "cyan", name: "Cyan", hex: "#06B6D4" },
  { id: "orange", name: "Orange", hex: "#F97316" },
  { id: "pink", name: "Pink", hex: "#EC4899" },
  { id: "teal", name: "Teal", hex: "#14B8A6" },
  { id: "slate", name: "Slate", hex: "#64748B" },
  { id: "red", name: "Red", hex: "#EF4444" },
];

export const DEFAULT_PRESET_LABELS: StickerLabel[] = [
  { id: "lbl_standard", name: "Standard Fleet", color: "#3B82F6", createdAt: new Date().toISOString() },
  { id: "lbl_priority", name: "VIP Priority", color: "#8B5CF6", createdAt: new Date().toISOString() },
  { id: "lbl_express", name: "Express Batch", color: "#F97316", createdAt: new Date().toISOString() },
  { id: "lbl_warehouse", name: "Warehouse Stock", color: "#10B981", createdAt: new Date().toISOString() },
];

/**
 * Returns clean styling tokens for rendering a colored badge/pill
 */
export function getLabelBadgeStyle(colorHex?: string | null) {
  if (!colorHex) {
    return {
      backgroundColor: "rgba(100, 116, 139, 0.08)",
      color: "#475569",
      borderColor: "rgba(100, 116, 139, 0.2)",
    };
  }

  // Ensure leading #
  const hex = colorHex.startsWith("#") ? colorHex : `#${colorHex}`;
  return {
    backgroundColor: `${hex}18`,
    color: hex,
    borderColor: `${hex}40`,
  };
}
