import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface PrintCopiesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (copies: number) => void;
  isPrinting: boolean;
}

const MIN_COPIES = 1;
const MAX_COPIES = 20;

export default function PrintCopiesPopup({ isOpen, onClose, onConfirm, isPrinting }: PrintCopiesPopupProps) {
  const [copies, setCopies] = useState(1);

  if (!isOpen) return null;

  const clamp = (value: number) => Math.min(MAX_COPIES, Math.max(MIN_COPIES, value));

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 17, 23, 0.65)" }}
      onClick={(e) => {
        // This popup is nested inside PrintSheetModal's own backdrop (which
        // closes on click) — stop here so dismissing the popup doesn't also
        // close the print sheet behind it.
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900">How many copies?</h3>
        <p className="text-sm text-slate-500 mt-0.5">Each copy prints the same sheet again.</p>

        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            type="button"
            onClick={() => setCopies((c) => clamp(c - 1))}
            disabled={copies <= MIN_COPIES}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Decrease copies"
          >
            <Minus size={16} />
          </button>

          <input
            type="number"
            min={MIN_COPIES}
            max={MAX_COPIES}
            value={copies}
            onChange={(e) => setCopies(clamp(parseInt(e.target.value, 10) || MIN_COPIES))}
            className="w-20 h-10 text-center text-lg font-bold text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-slate-900"
          />

          <button
            type="button"
            onClick={() => setCopies((c) => clamp(c + 1))}
            disabled={copies >= MAX_COPIES}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Increase copies"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(copies)}
            disabled={isPrinting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black active:scale-95 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPrinting ? "Opening…" : copies > 1 ? `Print ${copies} Copies` : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}
