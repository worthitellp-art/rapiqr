import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Check, Tag, Sparkles } from "lucide-react";
import { StickerLabel } from "../types";
import { LABEL_COLOR_PRESETS } from "./labelConstants";
import LabelBadge from "./LabelBadge";

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: StickerLabel[];
  onSaveLabels: (labels: StickerLabel[]) => void;
  onSelectLabel?: (label: StickerLabel) => void;
  initialSelectedLabelId?: string | null;
}

export default function LabelManagerModal({
  isOpen,
  onClose,
  labels,
  onSaveLabels,
  onSelectLabel,
  initialSelectedLabelId,
}: LabelManagerModalProps) {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [customColor, setCustomColor] = useState("#6366F1");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingLabelId("new");
    setName("");
    setColor(LABEL_COLOR_PRESETS[0].hex);
    setCustomColor(LABEL_COLOR_PRESETS[0].hex);
    setError(null);
  };

  const handleStartEdit = (label: StickerLabel) => {
    setEditingLabelId(label.id);
    setName(label.name);
    setColor(label.color);
    setCustomColor(label.color);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingLabelId(null);
    setName("");
    setError(null);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a label name.");
      return;
    }

    if (editingLabelId === "new") {
      const newLabel: StickerLabel = {
        id: `lbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        color: color || "#6366F1",
        createdAt: new Date().toISOString(),
      };
      const next = [...labels, newLabel];
      onSaveLabels(next);
      if (onSelectLabel) {
        onSelectLabel(newLabel);
      }
    } else if (editingLabelId) {
      const next = labels.map((l) =>
        l.id === editingLabelId ? { ...l, name: trimmed, color: color || "#6366F1" } : l
      );
      onSaveLabels(next);
    }

    setEditingLabelId(null);
    setName("");
    setError(null);
  };

  const handleDelete = (labelId: string) => {
    const next = labels.filter((l) => l.id !== labelId);
    onSaveLabels(next);
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-gray-900 font-body animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Manage Batch Labels</h3>
              <p className="text-xs text-gray-500">Create & color-code labels for bulk printing and organizing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create or Edit Form */}
          {editingLabelId ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {editingLabelId === "new" ? "Create New Label" : "Edit Label"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Preview:</span>
                  <LabelBadge name={name.trim() || "Label Name"} color={color} size="sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Label Name</label>
                <input
                  type="text"
                  placeholder="e.g. March Bulk Batch, VIP Deliveries, Red Fleet..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 shadow-2xs"
                />
                {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
              </div>

              {/* Color Swatch Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Select Color</label>
                <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
                  {LABEL_COLOR_PRESETS.map((preset) => {
                    const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        title={preset.name}
                        className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                          isSelected ? "ring-2 ring-offset-2 ring-gray-900 scale-105" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isSelected && <Check size={14} className="text-white drop-shadow-md stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setColor(e.target.value);
                    }}
                    className="w-7 h-7 rounded border border-gray-300 p-0.5 cursor-pointer bg-white"
                  />
                  <span className="text-xs text-gray-600 font-medium">Custom Color:</span>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366F1"
                    className="w-24 px-2 py-1 text-xs font-mono rounded border border-gray-300 bg-white outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all shadow-xs cursor-pointer"
                >
                  {editingLabelId === "new" ? "Create Label" : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/80 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add New Color Label</span>
            </button>
          )}

          {/* Existing Labels List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
              <span>Available Labels ({labels.length})</span>
            </div>

            {labels.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 border border-gray-100 rounded-lg">
                No labels created yet. Add one above!
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
                {labels.map((lbl) => {
                  const isSelected = initialSelectedLabelId === lbl.id;
                  return (
                    <div
                      key={lbl.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <LabelBadge name={lbl.name} color={lbl.color} size="sm" />
                        <span className="text-[11px] font-mono text-gray-400">{lbl.color}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onSelectLabel && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLabel(lbl);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Select
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(lbl)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit Label"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(lbl.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Label"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
