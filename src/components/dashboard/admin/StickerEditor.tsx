import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Grid3X3, Lock, Unlock, Magnet, Check, ShieldCheck } from "lucide-react";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import { qrImageUrl } from "./helpers";
import { StickerPos } from "./types";
import { saveTemplateToDb } from "../../../lib/supabaseService";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };
const MIN_SIZE = 20;
const MAX_SIZE = 280;
const SNAP = 4;

export default function StickerEditor({
  stickerPos,
  setStickerPos,
  setToast,
}: {
  stickerPos: StickerPos;
  setStickerPos: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<"se" | "sw" | "ne" | "nw" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }
  function snap(val: number) {
    return snapEnabled ? Math.round(val / SNAP) * SNAP : Math.round(val);
  }

  const handleDragDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragOffset.current = { x: e.clientX, y: e.clientY };
      startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
    },
    [stickerPos]
  );

  const handleResizeDown = useCallback(
    (dir: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(dir);
      dragOffset.current = { x: e.clientX, y: e.clientY };
      startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
    },
    [stickerPos]
  );

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - dragOffset.current.x;
      const dy = e.clientY - dragOffset.current.y;

      if (dragging) {
        setStickerPos({
          ...stickerPos,
          x: snap(clamp(startPos.current.x + dx, 0, rect.width - stickerPos.w)),
          y: snap(clamp(startPos.current.y + dy, 0, rect.height - stickerPos.h)),
        });
      }
      if (resizing) {
        const s = startPos.current;
        let nw = s.w,
          nh = s.h,
          nx = s.x,
          ny = s.y;
        if (resizing === "se") {
          nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE);
        } else if (resizing === "sw") {
          nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE);
          nx = s.x + s.w - nw;
        } else if (resizing === "ne") {
          nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE);
          ny = s.y + s.h - nh;
        } else if (resizing === "nw") {
          nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE);
          nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE);
          nx = s.x + s.w - nw;
          ny = s.y + s.h - nh;
        }
        nx = snap(clamp(nx, 0, rect.width - nw));
        ny = snap(clamp(ny, 0, rect.height - nh));
        nw = snap(clamp(nw, MIN_SIZE, rect.width - nx));
        nh = snap(clamp(nh, MIN_SIZE, rect.height - ny));
        setStickerPos({ x: nx, y: ny, w: nw, h: nh });
      }
    };
    const handleUp = () => {
      setDragging(false);
      setResizing(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, resizing, stickerPos, setStickerPos, lockAspect, snapEnabled]);

  async function handleSaveDefaultPosition() {
    if (saveState !== "idle") return;
    setSaveState("saving");
    try {
      const currentPos = { ...stickerPos };
      try {
        localStorage.setItem("repiqr-sticker-pos", JSON.stringify(currentPos));
      } catch {
        /* ignore */
      }

      await saveTemplateToDb({
        name: "Default Sticker Layout",
        fgColor: "000000",
        bgColor: "FFFFFF",
        stickerPos: currentPos,
        isDefault: true,
      });

      setSaveState("saved");
      setToast("Default sticker position saved!");
    } catch (error) {
      console.error("Failed to save position:", error);
      setToast("Position updated locally");
    } finally {
      setTimeout(() => {
        setSaveState("idle");
        setToast(null);
      }, 2200);
    }
  }

  const previewSize = 360;

  return (
    <div className="space-y-6 text-[#17181A] font-body">
      {/* Top Header */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[#17181A]">
            Sticker QR Placement
          </h1>
          <p className="text-[13.5px] text-[#777B80] mt-1">
            Adjust and save the default QR code position for all generated stickers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas Box */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E7] p-5.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[13px] font-semibold text-[#17181A]">
              Sticker Canvas & Placement
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-[4px] border transition-all cursor-pointer ${
                  showGrid ? "bg-[#5C78DF] text-white border-[#5C78DF]" : "bg-[#F3F3F4] border-[#E5E5E7] text-[#9CA0A6] hover:text-[#17181A]"
                }`}
                title="Toggle grid overlay"
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`p-2 rounded-[4px] border transition-all cursor-pointer ${
                  snapEnabled ? "bg-[#5C78DF] text-white border-[#5C78DF]" : "bg-[#F3F3F4] border-[#E5E5E7] text-[#9CA0A6] hover:text-[#17181A]"
                }`}
                title={`Snap to ${SNAP}px grid`}
              >
                <Magnet size={14} />
              </button>
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className={`p-2 rounded-[4px] border transition-all cursor-pointer ${
                  lockAspect ? "bg-[#5C78DF] text-white border-[#5C78DF]" : "bg-[#F3F3F4] border-[#E5E5E7] text-[#9CA0A6] hover:text-[#17181A]"
                }`}
                title="Lock aspect ratio"
              >
                {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <span className="font-mono text-[11px] font-bold text-[#5271D5] bg-[#E8EDFF] px-2.5 py-1 rounded-[4px]">
                {stickerPos.w}×{stickerPos.h} @ {stickerPos.x},{stickerPos.y}
              </span>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden select-none border-2 border-[#17181A] rounded-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.05)] bg-[#F3F3F4]"
            style={{
              width: previewSize,
              height: Math.round(previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w)),
              backgroundImage: showGrid
                ? "linear-gradient(rgba(92,120,223,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(92,120,223,0.2) 1px, transparent 1px)"
                : undefined,
              backgroundSize: showGrid ? "20px 20px" : undefined,
            }}
          >
            {/* Sticker Graphic */}
            <img
              src={STICKER_SRC}
              draggable={false}
              className="w-full h-full object-fill pointer-events-none"
              alt="Sticker Layout"
            />

            {/* Draggable & Resizable QR Placement Overlay */}
            <div
              onMouseDown={handleDragDown}
              className="absolute cursor-move border-2 border-[#17181A] rounded-[4px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center bg-white p-1"
              style={{
                left: Math.round(stickerPos.x * (previewSize / EDITOR_DISPLAY.w)),
                top: Math.round(stickerPos.y * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
                width: Math.round(stickerPos.w * (previewSize / EDITOR_DISPLAY.w)),
                height: Math.round(stickerPos.h * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
              }}
            >
              <img
                src={qrImageUrl("https://repiqr.com/demo", "000000", "FFFFFF", 128)}
                className="w-full h-full object-contain pointer-events-none"
                alt="Black QR Code"
              />

              {/* Corner Resize Handles */}
              {(["nw", "ne", "sw", "se"] as const).map((dir) => (
                <div
                  key={dir}
                  onMouseDown={handleResizeDown(dir)}
                  className={`absolute w-3.5 h-3.5 bg-[#5C78DF] border-2 border-[#17181A] rounded-full transition-transform hover:scale-125 cursor-${dir}-resize ${
                    dir === "nw" ? "-top-2 -left-2" : dir === "ne" ? "-top-2 -right-2" : dir === "sw" ? "-bottom-2 -left-2" : "-bottom-2 -right-2"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5E7] text-[11.5px] text-[#9CA0A6] flex items-center justify-between">
            <span>Click & drag box to move placement</span>
            <span>Drag corner dots to scale box</span>
          </div>
        </div>

        {/* Right: Controls & Single Save Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E7] p-5.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-display text-[13px] font-semibold text-[#17181A]">
                Placement Controls
              </h3>
            </div>

            <p className="text-[13.5px] text-[#777B80] leading-relaxed mb-4">
              Position the QR code overlay box on your sticker template. When saved, this single position applies as the default for all sticker views and batch prints.
            </p>

            {/* Position Readout */}
            <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] p-3.5 space-y-2 mb-4">
              <p className="text-[11px] font-body font-semibold text-[#777B80] uppercase tracking-wider">
                Live Coordinates & Dimensions
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[13px] font-bold text-[#17181A]">
                <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-[#E5E5E7]">
                  <span className="text-[#777B80]">X:</span>
                  <span className="text-[#17181A]">{stickerPos.x}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-[#E5E5E7]">
                  <span className="text-[#777B80]">Y:</span>
                  <span className="text-[#17181A]">{stickerPos.y}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-[#E5E5E7]">
                  <span className="text-[#777B80]">Width:</span>
                  <span className="text-[#17181A]">{stickerPos.w}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-[#E5E5E7]">
                  <span className="text-[#777B80]">Height:</span>
                  <span className="text-[#17181A]">{stickerPos.h}px</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-[4px] bg-[#F3F3F4] border border-[#E5E5E7] font-mono text-[12px] text-[#17181A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#777B80]">QR Color:</span>
                <span className="font-bold">#000000 (Pure Black)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777B80]">Mode:</span>
                <span className="font-bold text-[#2E9E5B]">Single Default Layout</span>
              </div>
            </div>
          </div>

          {/* Single Save Action Button */}
          <button
            onClick={handleSaveDefaultPosition}
            disabled={saveState !== "idle"}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[4px] bg-[#17181A] text-white font-semibold text-[14.5px] hover:bg-[#2A2B2E] active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
          >
            {saveState === "saving" ? (
              "Saving Position..."
            ) : saveState === "saved" ? (
              <>
                <Check size={16} strokeWidth={2.5} /> Position Saved!
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={2.4} /> Save Default Position
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
