import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Grid3X3, Lock, Unlock } from "lucide-react";
import { Template, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import { saveTemplateToDb } from "../../../lib/supabaseService";
import { qrImageUrl } from "./helpers";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };
const MIN_SIZE = 16;
const MAX_SIZE = 300;

export default function StickerEditor({
  stickerPos, setStickerPos, templates, setTemplates, setToast,
}: {
  stickerPos: StickerPos; setStickerPos: (p: StickerPos) => void;
  templates: Template[]; setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  setToast: (msg: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<"se" | "sw" | "ne" | "nw" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tplName, setTplName] = useState("");
  const [tplFg, setTplFg] = useState("EAB308");
  const [tplBg, setTplBg] = useState("FFFFFF");

  function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }

  const handleDragDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    dragOffset.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
  }, [stickerPos]);

  const handleResizeDown = useCallback((dir: "se" | "sw" | "ne" | "nw") => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setResizing(dir);
    dragOffset.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: stickerPos.x, y: stickerPos.y, w: stickerPos.w, h: stickerPos.h };
  }, [stickerPos]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - dragOffset.current.x;
      const dy = e.clientY - dragOffset.current.y;
      if (dragging) {
        setStickerPos({ ...stickerPos, x: Math.round(clamp(startPos.current.x + dx, 0, rect.width - stickerPos.w)), y: Math.round(clamp(startPos.current.y + dy, 0, rect.height - stickerPos.h)) });
      }
      if (resizing) {
        const s = startPos.current;
        let nw = s.w, nh = s.h, nx = s.x, ny = s.y;
        if (resizing === "se") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); }
        else if (resizing === "sw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; }
        else if (resizing === "ne") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); ny = s.y + s.h - nh; }
        else if (resizing === "nw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; ny = s.y + s.h - nh; }
        nx = clamp(nx, 0, rect.width - nw); ny = clamp(ny, 0, rect.height - nh);
        setStickerPos({ x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };
    const handleUp = () => { setDragging(false); setResizing(null); };
    window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, resizing, stickerPos, setStickerPos, lockAspect]);

  function handleSave() {
    if (saveState !== "idle") return;
    if (!tplName.trim()) { setToast("Enter a template name first"); setTimeout(() => setToast(null), 2000); return; }
    setSaveState("saving");
    setTimeout(() => {
      const newTpl: Template = {
        id: Date.now(),
        name: tplName.trim(),
        fg: tplFg,
        bg: tplBg,
        logo: null,
        stickerPos: { ...stickerPos },
        isPublicDefault: templates.length === 0,
      };
      setTemplates((prev) => [...prev, newTpl]);
      saveTemplateToDb({ name: newTpl.name, fgColor: newTpl.fg, bgColor: newTpl.bg, stickerPos, isDefault: newTpl.isPublicDefault });
      setTplName("");
      setSaveState("saved");
      setToast(`Template "${newTpl.name}" saved!`);
      setTimeout(() => { setSaveState("idle"); setToast(null); }, 2000);
    }, 400);
  }

  const previewSize = 320;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Editor Canvas */}
        <div className="flex-1 bg-white rounded-2xl border p-5" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Sticker QR Position</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showGrid ? "bg-gray-100 border-gray-300" : "border-gray-200"}`} title="Toggle grid">
                <Grid3X3 size={14} className={showGrid ? "text-gray-900" : "text-gray-400"} />
              </button>
              <button onClick={() => setLockAspect(!lockAspect)} className={`p-1.5 rounded-lg border transition-all cursor-pointer ${lockAspect ? "bg-gray-100 border-gray-300" : "border-gray-200"}`} title="Lock aspect ratio">
                {lockAspect ? <Lock size={14} className="text-gray-900" /> : <Unlock size={14} className="text-gray-400" />}
              </button>
              <span className="text-[10px] text-gray-500 font-semibold">{stickerPos.w}×{stickerPos.h} @ {stickerPos.x},{stickerPos.y}</span>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden select-none"
            style={{
              width: previewSize, height: Math.round(previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w)),
              borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              backgroundImage: showGrid ? "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)" : undefined,
              backgroundSize: showGrid ? "20px 20px" : undefined,
            }}
          >
            <img src={STICKER_SRC} draggable={false} style={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }} alt="Sticker" />

            {/* QR overlay */}
            <div
              onMouseDown={handleDragDown}
              style={{
                position: "absolute", left: stickerPos.x, top: stickerPos.y,
                width: stickerPos.w, height: stickerPos.h,
                cursor: "move", border: "2px solid rgba(234,179,8,0.8)",
                borderRadius: 4, boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <img
                src={qrImageUrl("PREVIEW", tplFg, tplBg, 128)}
                style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
                alt="QR Preview"
              />

              {/* Resize handles */}
              {["se", "sw", "ne", "nw"].map((dir) => (
                <div
                  key={dir}
                  onMouseDown={handleResizeDown(dir as "se" | "sw" | "ne" | "nw")}
                  style={{
                    position: "absolute",
                    width: 10, height: 10, background: "white", border: "2px solid var(--accent)", borderRadius: 2,
                    ...(dir.includes("s") ? { bottom: -5 } : { top: -5 }),
                    ...(dir.includes("e") ? { right: -5 } : { left: -5 }),
                    cursor: `${dir}-resize`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Template Controls */}
        <div className="w-full lg:w-72 bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#f0f0f0" }}>
          <h3 className="font-bold text-gray-900 text-sm">Save as Template</h3>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Template Name</label>
            <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Midnight Classic" className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900" style={{ borderColor: "#e2e8f0" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">QR Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={`#${tplFg}`} onChange={(e) => setTplFg(e.target.value.replace("#", ""))} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ borderColor: "#e2e8f0" }} />
                <span className="text-[11px] font-mono font-bold text-gray-700">#{tplFg}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">BG Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={`#${tplBg}`} onChange={(e) => setTplBg(e.target.value.replace("#", ""))} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ borderColor: "#e2e8f0" }} />
                <span className="text-[11px] font-mono font-bold text-gray-700">#{tplBg}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Position</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-semibold text-gray-800">
              <span>X: {stickerPos.x}px</span>
              <span>Y: {stickerPos.y}px</span>
              <span>W: {stickerPos.w}px</span>
              <span>H: {stickerPos.h}px</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveState !== "idle"}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : <><Save size={14} /> Save Template</>}
          </button>
        </div>
      </div>

      {/* Existing Templates */}
      {templates.length > 0 && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#f0f0f0" }}>
          <h3 className="font-bold text-gray-900 text-sm mb-4">Saved Templates ({templates.length})</h3>
          <div className="flex flex-wrap gap-3">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
                <div className="w-6 h-6 rounded" style={{ background: `#${t.fg}` }} />
                <span className="text-xs font-bold text-gray-800">{t.name}</span>
                {t.isPublicDefault && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">Default</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
