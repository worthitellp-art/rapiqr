import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Grid3X3, Lock, Unlock, Magnet, Check, ShieldCheck, Printer, SaveAll } from "lucide-react";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import QrCodeImage from "./QrCodeImage";
import { StickerPos } from "./types";
import PrintSheetModal from "./PrintSheetModal";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };
const MIN_SIZE = 20;
const MAX_SIZE = 280;
const SNAP = 4;

export default function StickerEditor({
  stickerPos,
  setStickerPos,
  setToast,
  openPrintSheet,
}: {
  stickerPos: StickerPos;
  setStickerPos: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
  openPrintSheet?: () => void;
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
  const [isLocalPrintOpen, setIsLocalPrintOpen] = useState(false);

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

      // NOTE: there is no /api/templates backend endpoint yet — sticker layout
      // templates are local-only for now (localStorage above is the persistence).

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
    <div className="space-y-6 text-[#18181B] font-body">
      {/* Top Header */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[#18181B]">
            Sticker QR Placement
          </h1>
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas Box */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] p-5.5 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[13px] font-semibold text-[#18181B]">
              Sticker Canvas & Placement
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  showGrid ? "bg-[#F5C518] text-[#18181B] border-[#F5C518]" : "bg-[#F4F4F5] border-[#E5E7EB] text-[#A1A1AA] hover:text-[#18181B]"
                }`}
                title="Toggle grid overlay"
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  snapEnabled ? "bg-[#F5C518] text-[#18181B] border-[#F5C518]" : "bg-[#F4F4F5] border-[#E5E7EB] text-[#A1A1AA] hover:text-[#18181B]"
                }`}
                title={`Snap to ${SNAP}px grid`}
              >
                <Magnet size={14} />
              </button>
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  lockAspect ? "bg-[#F5C518] text-[#18181B] border-[#F5C518]" : "bg-[#F4F4F5] border-[#E5E7EB] text-[#A1A1AA] hover:text-[#18181B]"
                }`}
                title="Lock aspect ratio"
              >
                {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <span className="font-mono text-[11px] font-bold text-[#A16207] bg-[#FDF4DB] px-2.5 py-1 rounded-lg">
                {stickerPos.w}×{stickerPos.h} @ {stickerPos.x},{stickerPos.y}
              </span>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden select-none border-2 border-[#18181B] rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.06)] bg-[#F4F4F5]"
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
              className="absolute cursor-move border-2 border-[#18181B] rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center bg-white p-1"
              style={{
                left: Math.round(stickerPos.x * (previewSize / EDITOR_DISPLAY.w)),
                top: Math.round(stickerPos.y * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
                width: Math.round(stickerPos.w * (previewSize / EDITOR_DISPLAY.w)),
                height: Math.round(stickerPos.h * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
              }}
            >
              <QrCodeImage
                data="https://repiqr.com/demo"
                fg="000000"
                bg="FFFFFF"
                size={128}
                className="w-full h-full object-contain pointer-events-none"
                alt="Black QR Code"
              />

              {/* Corner Resize Handles */}
              {(["nw", "ne", "sw", "se"] as const).map((dir) => (
                <div
                  key={dir}
                  onMouseDown={handleResizeDown(dir)}
                  className={`absolute w-3.5 h-3.5 bg-[#F5C518] border-2 border-[#18181B] rounded-full transition-transform hover:scale-125 cursor-${dir}-resize ${
                    dir === "nw" ? "-top-2 -left-2" : dir === "ne" ? "-top-2 -right-2" : dir === "sw" ? "-bottom-2 -left-2" : "-bottom-2 -right-2"
                  }`}
                />
              ))}
            </div>
          </div>

          
        </div>

        {/* Right: Controls & Single Save Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] p-5.5 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF4DB] text-[#A16207] flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-display text-[13px] font-semibold text-[#18181B]">
                Placement Controls
              </h3>
            </div>

           
            {/* Position Readout */}
            <div className="bg-[#F8F8F7] border border-[#E5E7EB] rounded-lg p-3.5 space-y-2 mb-4">
              <p className="text-[11px] font-body font-semibold text-[#71717A] uppercase tracking-wider">
               Dimensions
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[13px] font-bold text-[#18181B]">
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[#71717A]">X:</span>
                  <span className="text-[#18181B]">{stickerPos.x}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[#71717A]">Y:</span>
                  <span className="text-[#18181B]">{stickerPos.y}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[#71717A]">Width:</span>
                  <span className="text-[#18181B]">{stickerPos.w}px</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[#71717A]">Height:</span>
                  <span className="text-[#18181B]">{stickerPos.h}px</span>
                </div>
              </div>
            </div>

            
          </div>

          <div className="space-y-2.5">
            {/* Single Save Action Button */}
            <button
              onClick={handleSaveDefaultPosition}
              disabled={saveState !== "idle"}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#F5C518] text-[#18181B] font-bold text-[14.5px] hover:bg-[#EAB308] active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saveState === "saving" ? (
                "Saving Position..."
              ) : saveState === "saved" ? (
                <>
                  <Check size={16} strokeWidth={2.5} /> Position Saved!
                </>
              ) : (
                <>
                   Save Default Position
                </>
              )}
            </button>

            {/* Print 18x12 Sheet Button */}
            <button
              type="button"
              onClick={() => {
                if (openPrintSheet) {
                  openPrintSheet();
                } else {
                  setIsLocalPrintOpen(true);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#FDF4DB] hover:bg-[#F8E9B0] text-[#A16207] border border-[#EAB308]/50 font-semibold text-[13.5px] active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Printer size={16} strokeWidth={2.2} /> Print
            </button>
          </div>
        </div>
      </div>

      <PrintSheetModal
        isOpen={isLocalPrintOpen}
        onClose={() => setIsLocalPrintOpen(false)}
        availableStickers={[]}
        stickerPos={stickerPos}
        onShowToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 3500);
        }}
      />
    </div>
  );
}
