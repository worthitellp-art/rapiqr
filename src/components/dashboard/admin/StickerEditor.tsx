import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Grid3X3, Lock, Unlock, Magnet, Copy, Trash2, Pencil, Play, Star, X } from "lucide-react";
import { Template, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";
import { saveTemplateToDb, deleteTemplateFromDb, saveStickerPosToDb } from "../../../lib/supabaseService";
import { qrImageUrl } from "./helpers";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };
const MIN_SIZE = 16;
const MAX_SIZE = 300;
const SNAP = 4;

const PRESETS: { name: string; fg: string; bg: string }[] = [
  { name: "Midnight", fg: "111111", bg: "FFFFFF" },
  { name: "Amber", fg: "EAB308", bg: "FFFFFF" },
  { name: "Indigo", fg: "6366F1", bg: "FFFFFF" },
  { name: "Violet", fg: "8B5CF6", bg: "FFFFFF" },
  { name: "Sky", fg: "0EA5E9", bg: "FFFFFF" },
  { name: "Emerald", fg: "10B981", bg: "FFFFFF" },
  { name: "Rose", fg: "F43F5E", bg: "FFFFFF" },
  { name: "Ink", fg: "0F172A", bg: "FFFFFF" },
];

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
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tplName, setTplName] = useState("");
  const [tplFg, setTplFg] = useState("EAB308");
  const [tplBg, setTplBg] = useState("FFFFFF");
  const [editingId, setEditingId] = useState<string | number | null>(null);

  function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }
  function snap(val: number) { return snapEnabled ? Math.round(val / SNAP) * SNAP : Math.round(val); }

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
        setStickerPos({ ...stickerPos, x: snap(clamp(startPos.current.x + dx, 0, rect.width - stickerPos.w)), y: snap(clamp(startPos.current.y + dy, 0, rect.height - stickerPos.h)) });
      }
      if (resizing) {
        const s = startPos.current;
        let nw = s.w, nh = s.h, nx = s.x, ny = s.y;
        if (resizing === "se") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); }
        else if (resizing === "sw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h + dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; }
        else if (resizing === "ne") { nw = clamp(s.w + dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); ny = s.y + s.h - nh; }
        else if (resizing === "nw") { nw = clamp(s.w - dx, MIN_SIZE, MAX_SIZE); nh = lockAspect ? nw : clamp(s.h - dy, MIN_SIZE, MAX_SIZE); nx = s.x + s.w - nw; ny = s.y + s.h - nh; }
        nx = snap(clamp(nx, 0, rect.width - nw)); ny = snap(clamp(ny, 0, rect.height - nh));
        nw = snap(clamp(nw, MIN_SIZE, rect.width - nx)); nh = snap(clamp(nh, MIN_SIZE, rect.height - ny));
        setStickerPos({ x: nx, y: ny, w: nw, h: nh });
      }
    };
    const handleUp = () => { setDragging(false); setResizing(null); };
    window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, resizing, stickerPos, setStickerPos, lockAspect, snapEnabled]);

  async function handleSave() {
    if (saveState !== "idle") return;
    if (!tplName.trim()) { setToast("Enter a template name first"); setTimeout(() => setToast(null), 2000); return; }
    setSaveState("saving");
    try {
      const cleanName = tplName.trim();
      const currentPos = { ...stickerPos };
      const cleanFg = (tplFg || "EAB308").replace(/#/g, "").toUpperCase();
      const cleanBg = (tplBg || "FFFFFF").replace(/#/g, "").toUpperCase();

      if (editingId !== null) {
        const existingTpl = templates.find((x) => String(x.id) === String(editingId));
        const isDefault = existingTpl?.isPublicDefault || false;

        const updatedTpl: Template = {
          id: editingId,
          name: cleanName,
          fg: cleanFg,
          bg: cleanBg,
          logo: null,
          stickerPos: currentPos,
          isPublicDefault: isDefault,
        };

        setTemplates((prev) =>
          prev.map((t) => (String(t.id) === String(editingId) ? updatedTpl : t))
        );

        const savedRecord = await saveTemplateToDb({
          id: editingId,
          name: cleanName,
          fgColor: cleanFg,
          bgColor: cleanBg,
          stickerPos: currentPos,
          isDefault,
        });

        saveStickerPosToDb(currentPos, cleanFg, cleanBg);

        if (!savedRecord) {
          setTemplates((prev) =>
            prev.map((t) => (String(t.id) === String(editingId) ? (existingTpl as Template) : t))
          );
          throw new Error("Server rejected the template update");
        }

        if (savedRecord.id) {
          setTemplates((prev) =>
            prev.map((t) => (String(t.id) === String(editingId) ? { ...t, id: savedRecord.id } : t))
          );
        }

        setEditingId(null);
        setTplName("");
        setSaveState("saved");
        setToast("Template updated!");
      } else {
        const isFirst = templates.length === 0;
        const tempId = Date.now();
        const newTpl: Template = {
          id: tempId,
          name: cleanName,
          fg: cleanFg,
          bg: cleanBg,
          logo: null,
          stickerPos: currentPos,
          isPublicDefault: isFirst,
        };

        setTemplates((prev) => [...prev, newTpl]);

        const savedRecord = await saveTemplateToDb({
          name: cleanName,
          fgColor: cleanFg,
          bgColor: cleanBg,
          stickerPos: currentPos,
          isDefault: isFirst,
        });

        saveStickerPosToDb(currentPos, cleanFg, cleanBg);

        if (!savedRecord) {
          setTemplates((prev) => prev.filter((t) => t.id !== tempId));
          throw new Error("Server rejected the new template");
        }

        if (savedRecord.id) {
          setTemplates((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: savedRecord.id } : t))
          );
        }

        setTplName("");
        setSaveState("saved");
        setToast(`Template "${cleanName}" saved!`);
      }
    } catch (err) {
      console.error("Failed to save template:", err);
      setToast("Failed to save template");
    } finally {
      setTimeout(() => { setSaveState("idle"); setToast(null); }, 2000);
    }
  }

  function handleLoad(t: Template) {
    const cleanFg = (t.fg || "EAB308").replace(/#/g, "").toUpperCase();
    const cleanBg = (t.bg || "FFFFFF").replace(/#/g, "").toUpperCase();
    setTplName(t.name);
    setTplFg(cleanFg);
    setTplBg(cleanBg);
    setStickerPos(t.stickerPos);
    setToast(`Loaded "${t.name}"`);
    setTimeout(() => setToast(null), 2000);
  }

  function handleEdit(t: Template) {
    const cleanFg = (t.fg || "EAB308").replace(/#/g, "").toUpperCase();
    const cleanBg = (t.bg || "FFFFFF").replace(/#/g, "").toUpperCase();
    setEditingId(t.id);
    setTplName(t.name);
    setTplFg(cleanFg);
    setTplBg(cleanBg);
    setStickerPos(t.stickerPos);
    setToast(`Editing "${t.name}" — press Update Template to save`);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleDuplicate(t: Template) {
    const cleanFg = (t.fg || "EAB308").replace(/#/g, "").toUpperCase();
    const cleanBg = (t.bg || "FFFFFF").replace(/#/g, "").toUpperCase();
    const copyName = `${t.name} (copy)`;
    const tempId = Date.now();
    const copy: Template = { ...t, id: tempId, name: copyName, fg: cleanFg, bg: cleanBg, isPublicDefault: false };

    setTemplates((prev) => [...prev, copy]);
    const savedRecord = await saveTemplateToDb({
      name: copyName,
      fgColor: cleanFg,
      bgColor: cleanBg,
      stickerPos: copy.stickerPos,
      isDefault: false,
    });

    if (!savedRecord) {
      setTemplates((prev) => prev.filter((item) => item.id !== tempId));
      setToast("Failed to duplicate template");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    setTemplates((prev) => prev.map((item) => (item.id === tempId ? { ...item, id: savedRecord.id } : item)));
    setToast(`Duplicated "${t.name}"`);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleDelete(t: Template) {
    if (t.isPublicDefault) { setToast("Set another template as default first"); setTimeout(() => setToast(null), 2000); return; }
    if (String(editingId) === String(t.id)) setEditingId(null);
    const previous = templates;
    setTemplates((prev) => prev.filter((x) => String(x.id) !== String(t.id)));
    const ok = await deleteTemplateFromDb(t.id);
    if (!ok) {
      setTemplates(previous);
      setToast("Failed to delete template");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setToast(`Deleted "${t.name}"`);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleSetDefault(t: Template) {
    const cleanFg = (t.fg || "EAB308").replace(/#/g, "").toUpperCase();
    const cleanBg = (t.bg || "FFFFFF").replace(/#/g, "").toUpperCase();
    const previous = templates;
    setTemplates((prev) => prev.map((x) => ({ ...x, fg: (x.fg || "EAB308").replace(/#/g, "").toUpperCase(), bg: (x.bg || "FFFFFF").replace(/#/g, "").toUpperCase(), isPublicDefault: String(x.id) === String(t.id) })));
    setStickerPos(t.stickerPos);
    setTplFg(cleanFg);
    setTplBg(cleanBg);
    saveStickerPosToDb(t.stickerPos, cleanFg, cleanBg);

    const updatedTemplates = previous.map((x) => ({ ...x, fg: (x.fg || "EAB308").replace(/#/g, "").toUpperCase(), bg: (x.bg || "FFFFFF").replace(/#/g, "").toUpperCase(), isPublicDefault: String(x.id) === String(t.id) }));
    let allSaved = true;
    for (const x of updatedTemplates) {
      const saved = await saveTemplateToDb({
        id: x.id,
        name: x.name,
        fgColor: x.fg,
        bgColor: x.bg,
        stickerPos: x.stickerPos,
        isDefault: x.isPublicDefault,
      });
      if (!saved) allSaved = false;
    }

    if (!allSaved) {
      setTemplates(previous);
      setToast("Failed to set default template");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    setToast(`"${t.name}" set as default`);
    setTimeout(() => setToast(null), 2000);
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
              <button onClick={() => setSnapEnabled(!snapEnabled)} className={`p-1.5 rounded-lg border transition-all cursor-pointer ${snapEnabled ? "bg-gray-100 border-gray-300" : "border-gray-200"}`} title={`Snap to ${SNAP}px grid`}>
                <Magnet size={14} className={snapEnabled ? "text-gray-900" : "text-gray-400"} />
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
              className="absolute cursor-move border-2 border-amber-500 rounded-lg shadow-lg flex items-center justify-center bg-white/40 backdrop-blur-[1px] group"
              style={{
                left: Math.round(stickerPos.x * (previewSize / EDITOR_DISPLAY.w)),
                top: Math.round(stickerPos.y * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
                width: Math.round(stickerPos.w * (previewSize / EDITOR_DISPLAY.w)),
                height: Math.round(stickerPos.h * (previewSize * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w) / EDITOR_DISPLAY.h)),
              }}
            >
              <img
                src={qrImageUrl("https://repiqr.com/demo", (tplFg || "EAB308").replace(/#/g, ""), (tplBg || "FFFFFF").replace(/#/g, ""), 128)}
                className="w-full h-full object-contain pointer-events-none"
                alt="QR"
              />

              {/* Resize handles */}
              {(["nw", "ne", "sw", "se"] as const).map((dir) => (
                <div
                  key={dir}
                  onMouseDown={handleResizeDown(dir)}
                  className={`absolute w-3 h-3 bg-amber-500 border border-white rounded-full transition-transform hover:scale-125 cursor-${dir}-resize ${
                    dir === "nw" ? "-top-1.5 -left-1.5" : dir === "ne" ? "-top-1.5 -right-1.5" : dir === "sw" ? "-bottom-1.5 -left-1.5" : "-bottom-1.5 -right-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Template Controls */}
        <div className="w-full lg:w-72 bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">{editingId !== null ? "Edit Template" : "Save as Template"}</h3>
            {editingId !== null && (
              <button
                onClick={() => { setEditingId(null); setTplName(""); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Template Name</label>
            <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Midnight Classic" className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900" style={{ borderColor: "#e2e8f0" }} />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Theme Presets</label>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESETS.map((p) => {
                const pFg = p.fg.replace(/#/g, "").toUpperCase();
                const pBg = p.bg.replace(/#/g, "").toUpperCase();
                const curFg = (tplFg || "EAB308").replace(/#/g, "").toUpperCase();
                const curBg = (tplBg || "FFFFFF").replace(/#/g, "").toUpperCase();
                const isSelected = curFg === pFg && curBg === pBg;

                return (
                  <button
                    key={p.name}
                    title={p.name}
                    onClick={() => {
                      setTplFg(pFg);
                      setTplBg(pBg);
                      if (!tplName.trim()) setTplName(p.name);
                    }}
                    className="w-6 h-6 rounded-lg border transition-transform hover:scale-110 cursor-pointer"
                    style={{
                      background: `#${pFg}`,
                      borderColor: pFg === "FFFFFF" ? "#e2e8f0" : "#e2e8f0",
                      boxShadow: isSelected ? "0 0 0 2px #111111" : "none"
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">QR Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={`#${(tplFg || "EAB308").replace(/#/g, "")}`}
                  onChange={(e) => setTplFg(e.target.value.replace(/#/g, "").toUpperCase())}
                  className="w-8 h-8 rounded-lg border cursor-pointer"
                  style={{ borderColor: "#e2e8f0" }}
                />
                <span className="text-[11px] font-mono font-bold text-gray-700">#{(tplFg || "EAB308").replace(/#/g, "").toUpperCase()}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">BG Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={`#${(tplBg || "FFFFFF").replace(/#/g, "")}`}
                  onChange={(e) => setTplBg(e.target.value.replace(/#/g, "").toUpperCase())}
                  className="w-8 h-8 rounded-lg border cursor-pointer"
                  style={{ borderColor: "#e2e8f0" }}
                />
                <span className="text-[11px] font-mono font-bold text-gray-700">#{(tplBg || "FFFFFF").replace(/#/g, "").toUpperCase()}</span>
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
            style={{ background: "#111111" }}
          >
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved!" : <><Save size={14} /> {editingId !== null ? "Update Template" : "Save Template"}</>}
          </button>
        </div>
      </div>

      {/* Existing Templates */}
      {templates.length > 0 && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#f0f0f0" }}>
          <h3 className="font-bold text-gray-900 text-sm mb-4">Saved Templates ({templates.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl border flex flex-col gap-3" style={{ borderColor: "#e2e8f0", background: t.isPublicDefault ? "#F8FAFC" : "#fff" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `#${t.fg}` }}>
                    <div className="w-3.5 h-3.5 rounded-sm" style={{ background: `#${t.bg}` }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{t.name}</p>
                    <p className="text-[10px] font-mono text-gray-500">#{t.fg} / #{t.bg}</p>
                  </div>
                  {t.isPublicDefault && <span className="ml-auto text-[9px] font-bold text-gray-800 bg-gray-200 px-1.5 py-0.5 rounded-md">Default</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleEdit(t)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer" title="Edit"><Pencil size={11} /> Edit</button>
                  <button onClick={() => handleLoad(t)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer" title="Load colors & position"><Play size={11} /> Load</button>
                  <button onClick={() => handleDuplicate(t)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer" title="Duplicate"><Copy size={11} /> Copy</button>
                  <button onClick={() => handleSetDefault(t)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${t.isPublicDefault ? "text-black bg-gray-200" : "text-gray-700 hover:bg-gray-100"}`} title="Set as default"><Star size={11} /> Default</button>
                  <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
