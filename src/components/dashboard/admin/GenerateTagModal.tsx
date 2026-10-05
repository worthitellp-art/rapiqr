import type React from "react";
import { useEffect, useState } from "react";
import {
  X,
  Check,
  Copy,
  Download,
  Printer,
  AlertCircle,
  Loader2,
  Sparkles,
  QrCode,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { QrRecord, StickerLabel } from "./types";
import { qrFullUrl, generateQrDataUrl, dispatchActivationToUserDashboard } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryLabel } from "../../../stickerModules";
import QrCodeImage from "./QrCodeImage";
import LabelBadge from "./labels/LabelBadge";

function normalizePhone(phone: string): string | null {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

interface GenerateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  initialCategory: string;
  labels?: StickerLabel[];
  setToast: (msg: string | null) => void;
  onPrint?: (target?: QrRecord, batch?: QrRecord[]) => void;
}

/** Maps the id-scheme v2 server response (QrModel.saveV2) into a QrRecord. */
function recordFromV2Response(
  data: any,
  fallbackCategory: string,
  ownerPhone?: string,
  labelName?: string,
  labelColor?: string
): QrRecord {
  const rec: QrRecord = {
    id: data.id,
    clientId: data.client_id,
    qrUrl: qrFullUrl(data.id),
    createdAt: data.created_at || new Date().toISOString(),
    scans: 0,
    status: data.status || "inactive",
    template: data.template_name || "Standard Tag",
    category: data.category || fallbackCategory,
    fg: data.fg_color || "000000",
    bg: data.bg_color || "FFFFFF",
    recoveryCode: data.recoveryCode,
    labelName: data.label_name || labelName || undefined,
    labelColor: data.label_color || labelColor || undefined,
    isPrinted: false,
  };
  if (ownerPhone && ownerPhone.trim()) rec.ownerPhone = ownerPhone.trim();
  return rec;
}

export default function GenerateTagModal({
  isOpen,
  onClose,
  qrList,
  setQrList,
  initialCategory,
  labels = [],
  setToast,
  onPrint,
}: GenerateTagModalProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [step, setStep] = useState<"form" | "creating" | "success">("form");
  const [category, setCategory] = useState(initialCategory || "car");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("none");
  const [created, setCreated] = useState<QrRecord | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Bulk mode states
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [bulkSummary, setBulkSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode("single");
      setStep("form");
      setCategory(initialCategory || "car");
      setPhone("");
      setPhoneError(null);
      setSelectedLabelId("none");
      setCreated(null);
      setRecoveryCode("");
      setUrlCopied(false);
      setCodeCopied(false);
      setBulkProgress(null);
      setBulkSummary(null);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  function hasDuplicate(cat: string, raw: string): boolean {
    const norm = normalizePhone(raw);
    if (!norm) return false;
    return qrList.some(
      (q) =>
        (q.category || "car") === cat &&
        normalizePhone(q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "") === norm
    );
  }

  const chosenLabel = labels.find((l) => l.id === selectedLabelId);

  async function handleGenerateSingle() {
    setPhoneError(null);

    if (phone.trim() && !normalizePhone(phone)) {
      setPhoneError("Enter a valid 10-digit phone number.");
      return;
    }

    if (hasDuplicate(category, phone)) {
      setPhoneError("Phone number already exists in this category.");
      return;
    }

    setStep("creating");

    try {
      const res = await apiClient.qr.saveQrCodeV2({
        category,
        ownerPhone: phone.trim() || undefined,
        labelName: chosenLabel?.name || undefined,
        labelColor: chosenLabel?.color || undefined,
      });
      if (!res?.success || !res.data) throw new Error(res?.error || "Failed to create tag");

      const rec = recordFromV2Response(res.data, category, phone, chosenLabel?.name, chosenLabel?.color);
      setQrList((prev) => [rec, ...prev]);
      setCreated(rec);
      setRecoveryCode(rec.recoveryCode || "");
      dispatchActivationToUserDashboard(rec);
      setStep("success");
      setToast("New QR sticker generated and saved.");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setStep("form");
      if (err?.status === 409) {
        setPhoneError("Phone number already exists in this category.");
        setToast("That phone number is already in use in this category.");
      } else {
        setToast(err?.message ? `Failed to create tag: ${err.message}` : "Failed to create tag — check connection.");
      }
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function handleGenerateBulk() {
    const count = Math.min(Math.max(1, bulkCount), 200);
    setStep("creating");
    setBulkProgress(0);

    const recoveryRows: [string, string][] = [];
    const newRecords: QrRecord[] = [];
    let failedCount = 0;
    const CHUNK = 10;

    for (let i = 0; i < count; i++) {
      try {
        const res = await apiClient.qr.saveQrCodeV2({
          category,
          labelName: chosenLabel?.name || undefined,
          labelColor: chosenLabel?.color || undefined,
        });
        if (!res?.success || !res.data) throw new Error(res?.error || "save failed");
        const rec = recordFromV2Response(res.data, category, undefined, chosenLabel?.name, chosenLabel?.color);
        newRecords.push(rec);
        if (rec.recoveryCode) recoveryRows.push([rec.id, rec.recoveryCode]);
      } catch (err) {
        console.warn(`Bulk generate ${i + 1}/${count} failed:`, err);
        failedCount += 1;
      }
      if ((i + 1) % CHUNK === 0 || i === count - 1) {
        setBulkProgress(Math.min(100, Math.round(((i + 1) / count) * 100)));
      }
    }

    if (newRecords.length > 0) {
      setQrList((prev) => [...newRecords, ...prev]);
      newRecords.forEach((r) => dispatchActivationToUserDashboard(r));
    }

    if (recoveryRows.length > 0) {
      downloadRecoveryCodesCsv(recoveryRows);
    }

    setBulkProgress(null);
    setBulkSummary({ total: count, success: count - failedCount, failed: failedCount });
    setStep("success");

    const labelInfo = chosenLabel ? ` with label "${chosenLabel.name}"` : "";
    setToast(`${count - failedCount} QR stickers generated & synced${labelInfo}`);
    setTimeout(() => setToast(null), 4000);
  }

  function downloadRecoveryCodesCsv(rows: [string, string][]) {
    const csvRows = [["Sticker ID", "Recovery Code"], ...rows];
    const csv = csvRows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapiqr-bulk-${category}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function handleDownloadQr() {
    if (!created) return;
    const url = await generateQrDataUrl(qrFullUrl(created.id), "000000", "FFFFFF", 512);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapiqr-${created.id.slice(0, 8)}.png`;
    a.click();
  }

  const copyUrl = () => {
    if (!created) return;
    navigator.clipboard?.writeText(qrFullUrl(created.id)).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 1800);
    });
  };

  const copyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard?.writeText(recoveryCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1800);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 border border-gray-200/80">
              <QrCode size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-950">
                {step === "success" ? "Generation Complete" : "Create QR Sticker"}
              </h3>
              <p className="text-xs text-gray-500 font-normal">
                {step === "success"
                  ? "Sticker is active and stored in the database"
                  : "Generate and register a new vehicle or asset QR tag"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {step !== "success" ? (
            <>
              {/* Generation Mode Capsule Tabs */}
              <div className="flex p-1 rounded-xl bg-gray-100/90 border border-gray-200/60">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "single"
                      ? "bg-white text-gray-950 shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <QrCode size={13} />
                  <span>Single Tag</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("bulk")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "bulk"
                      ? "bg-white text-gray-950 shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Layers size={13} />
                  <span>Bulk Sheet Batch</span>
                </button>
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer"
                >
                  {STICKER_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Label Selector */}
              {labels.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Batch Label (Optional)</label>
                  </div>
                  <select
                    value={selectedLabelId}
                    onChange={(e) => setSelectedLabelId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer"
                  >
                    <option value="none">No Label</option>
                    {labels.map((lbl) => (
                      <option key={lbl.id} value={lbl.id}>
                        🏷️ {lbl.name}
                      </option>
                    ))}
                  </select>
                  {chosenLabel && (
                    <div className="pt-0.5">
                      <LabelBadge name={chosenLabel.name} color={chosenLabel.color} size="xs" />
                    </div>
                  )}
                </div>
              )}

              {/* Mode-Specific Fields */}
              {mode === "single" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Owner Phone <span className="text-gray-400 font-normal">(Optional for blank stock)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGenerateSingle();
                    }}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                  {phoneError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-0.5">
                      <AlertCircle size={13} />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Quantity (1 to 200 stickers)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200/90 bg-white text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                  <p className="text-[11px] text-gray-500">
                    Generates unassigned stock with cryptographic recovery codes downloaded as CSV.
                  </p>
                </div>
              )}

              {/* Progress for bulk */}
              {bulkProgress !== null && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gray-900 transition-all duration-150"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                    <span>Generating stickers and storing in database...</span>
                    <span>{bulkProgress}%</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={mode === "single" ? handleGenerateSingle : handleGenerateBulk}
                  disabled={step === "creating"}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  {step === "creating" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : mode === "single" ? (
                    <>
                      <Sparkles size={13} />
                      <span>Generate Tag</span>
                    </>
                  ) : (
                    <>
                      <Layers size={13} />
                      <span>Generate {bulkCount} Tags</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="space-y-4">
              {created ? (
                <>
                  <div className="flex items-center justify-center py-2">
                    <div className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-2xs">
                      <QrCodeImage
                        data={qrFullUrl(created.id)}
                        fg="000000"
                        bg="FFFFFF"
                        size={150}
                        style={{ width: 150, height: 150 }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Sticker ID:</span>
                      <span className="font-mono font-bold text-gray-900">{created.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Category:</span>
                      <span className="font-bold text-gray-900">{getCategoryLabel(created.category || "car")}</span>
                    </div>
                    {recoveryCode && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500 font-medium">Recovery Code:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900">{recoveryCode}</span>
                          <button
                            type="button"
                            onClick={copyCode}
                            className="p-1 text-gray-500 hover:text-gray-900 rounded cursor-pointer"
                            title="Copy code"
                          >
                            {codeCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download PNG</span>
                    </button>
                    {onPrint && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onPrint(created, [created]);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer size={13} />
                        <span>Print Sheet</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : bulkSummary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-center space-y-1">
                    <p className="text-sm font-bold text-emerald-900">
                      Successfully generated {bulkSummary.success} stickers!
                    </p>
                    <p className="text-xs text-emerald-700">
                      Recovery codes CSV has been automatically saved to your downloads.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}