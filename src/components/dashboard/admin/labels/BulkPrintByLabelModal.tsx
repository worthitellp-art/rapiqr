import React from "react";
import { X, Printer, Tag, Layers, CheckCircle2 } from "lucide-react";
import { QrRecord, StickerLabel } from "../types";
import LabelBadge from "./LabelBadge";

interface BulkPrintByLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: StickerLabel[];
  qrList: QrRecord[];
  printedStickerIds: Set<string>;
  onSelectLabelForPrint: (label: StickerLabel, onlyUnprinted?: boolean) => void;
}

export default function BulkPrintByLabelModal({
  isOpen,
  onClose,
  labels,
  qrList,
  printedStickerIds,
  onSelectLabelForPrint,
}: BulkPrintByLabelModalProps) {
  if (!isOpen) return null;

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
              <Printer size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Bulk Print by Label</h3>
              <p className="text-xs text-gray-500">Select a color-coded label batch to export or print</p>
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-gray-600">
            Choose a batch label to instantly select and export print-ready PDF sheets for all stickers tagged with that label.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {labels.map((lbl) => {
              const matchingStickers = qrList.filter(
                (q) => (q.labelName || "").toLowerCase() === lbl.name.toLowerCase()
              );
              const unprintedCount = matchingStickers.filter(
                (q) => !printedStickerIds.has(q.id) && !q.isPrinted
              ).length;
              const printedCount = matchingStickers.length - unprintedCount;
              const totalCount = matchingStickers.length;

              return (
                <div
                  key={lbl.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <LabelBadge name={lbl.name} color={lbl.color} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span>{totalCount} total stickers</span>
                      <span>•</span>
                      <span className="text-amber-600 font-semibold">{unprintedCount} unprinted</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{printedCount} printed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {unprintedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLabelForPrint(lbl, true);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Print only unprinted stickers from this label"
                      >
                        <Printer size={13} />
                        <span>Print Unprinted ({unprintedCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={totalCount === 0}
                      onClick={() => {
                        onSelectLabelForPrint(lbl, false);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      title="Print all stickers in this label"
                    >
                      <Printer size={13} />
                      <span>Print All ({totalCount})</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Unlabeled stickers bucket */}
            {(() => {
              const unlabeled = qrList.filter((q) => !q.labelName);
              const unprintedCount = unlabeled.filter(
                (q) => !printedStickerIds.has(q.id) && !q.isPrinted
              ).length;

              if (unlabeled.length === 0) return null;

              return (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-gray-700">Unlabeled Stickers</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {unlabeled.length} stickers ({unprintedCount} unprinted)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLabelForPrint({ id: "unlabeled", name: "Unlabeled", color: "#64748B" }, false);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Print Unlabeled</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
