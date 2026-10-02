import React from "react";
import { FileDown, Sparkles, CheckCircle2 } from "lucide-react";

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
}

export default function PrintProgressModal({ progress }: PrintProgressModalProps) {
  if (!progress.isVisible) return null;

  const isComplete = progress.percent >= 100;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden p-6 relative"
        style={{ animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Top Glowing Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 shadow-sm">
            {isComplete ? (
              <CheckCircle2 size={24} className="text-emerald-600 animate-bounce" />
            ) : (
              <FileDown size={24} className="animate-pulse text-orange-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {isComplete ? "PDF Ready!" : "Generating Print Sheet PDF"}
              </h3>
              <span className="text-sm font-extrabold text-orange-600 font-mono">
                {Math.round(progress.percent)}%
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {progress.stage || "Rendering high-resolution stickers…"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%` }}
            >
              {/* Shimmer animation */}
              <div className="absolute inset-0 bg-white/25 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
            <span className="font-medium">
              {progress.total > 0
                ? `Page ${Math.min(progress.current, progress.total)} of ${progress.total}`
                : "Preparing pages…"}
            </span>

            {progress.stickerId && (
              <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                {progress.stickerId}
              </span>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
          <Sparkles size={13} className="text-amber-500 flex-shrink-0" />
          <span>Rendering true-to-scale 4″×2.5″ stickers centered on standard A4 pages.</span>
        </div>
      </div>
    </div>
  );
}
