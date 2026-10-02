import React, { useState } from "react";
import { X, Tag, Plus, Check } from "lucide-react";
import { StickerLabel } from "../types";
import LabelBadge from "./LabelBadge";

interface AssignLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  labels: StickerLabel[];
  onAssignLabel: (labelName: string | null, labelColor: string | null) => void;
  onOpenCreateLabel?: () => void;
}

export default function AssignLabelModal({
  isOpen,
  onClose,
  selectedCount,
  labels,
  onAssignLabel,
  onOpenCreateLabel,
}: AssignLabelModalProps) {
  const [selectedLabelId, setSelectedLabelId] = useState<string | "none" | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedLabelId === "none") {
      onAssignLabel(null, null);
    } else if (selectedLabelId) {
      const found = labels.find((l) => l.id === selectedLabelId);
      if (found) {
        onAssignLabel(found.name, found.color);
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col text-gray-900 font-body animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Assign Label</h3>
              <p className="text-xs text-gray-500">Apply a color tag to {selectedCount} sticker{selectedCount > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
          {/* Option: Remove Label */}
          <button
            type="button"
            onClick={() => setSelectedLabelId("none")}
            className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedLabelId === "none"
                ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 font-bold"
                : "border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span className="text-xs">No Label (Remove Label)</span>
            {selectedLabelId === "none" && <Check size={14} className="text-indigo-600" />}
          </button>

          {/* List existing labels */}
          {labels.map((lbl) => {
            const isSelected = selectedLabelId === lbl.id;
            return (
              <button
                key={lbl.id}
                type="button"
                onClick={() => setSelectedLabelId(lbl.id)}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 font-bold"
                    : "border-gray-200 hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <LabelBadge name={lbl.name} color={lbl.color} size="sm" />
                </div>
                {isSelected && <Check size={14} className="text-indigo-600" />}
              </button>
            );
          })}

          {onOpenCreateLabel && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateLabel();
              }}
              className="w-full py-2.5 px-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
            >
              <Plus size={14} />
              <span>Create New Label</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedLabelId === null}
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-md transition-all shadow-xs cursor-pointer"
          >
            Apply Label
          </button>
        </div>
      </div>
    </div>
  );
}
