import React from "react";

export interface PrintProgressState {
  isVisible: boolean;
  current: number;
  total: number;
  percent: number;
  stage: string;
  stickerId?: string;
}

interface PrintProgressModalProps {
  progress: PrintProgressState;
  onCancel?: () => void;
}

export default function PrintProgressModal({ progress, onCancel }: PrintProgressModalProps) {
  if (!progress.isVisible) return null;

  const isComplete = progress.percent >= 100;
  const clampedPercent = Math.max(0, Math.min(100, Math.round(progress.percent)));

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[200] w-[380px] max-w-[calc(100vw-2rem)] pointer-events-auto select-none"
      style={{ animation: "fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="bg-white rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-gray-200/90 overflow-hidden">
        {/* Subtle Top Accent */}
        <div
          className={`h-1 w-full transition-colors duration-300 ${
            isComplete ? "bg-emerald-600" : "bg-gray-900"
          }`}
        />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                {isComplete ? "PDF Ready" : "Generating Print Sheet PDF"}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {progress.stage || "Building high-resolution stickers in background…"}
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 tabular-nums">
                {clampedPercent}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60 p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-200 ease-out ${
                  isComplete ? "bg-emerald-600" : "bg-gray-900"
                }`}
                style={{ width: `${Math.max(4, clampedPercent)}%` }}
              />
            </div>

            {/* Sub-label & Current Sticker info */}
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-medium">
                {progress.total > 0
                  ? `Page ${Math.min(progress.current, progress.total)} of ${progress.total}`
                  : "Preparing pages…"}
              </span>

              {progress.stickerId && (
                <span className="font-mono text-[10px] bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200/80">
                  {progress.stickerId}
                </span>
              )}
            </div>
          </div>

          {/* Footer Controls & Non-blocking notice */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-gray-400 truncate">
              {isComplete ? "Download started" : "Running in background • Work freely"}
            </span>

            {onCancel && !isComplete && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
