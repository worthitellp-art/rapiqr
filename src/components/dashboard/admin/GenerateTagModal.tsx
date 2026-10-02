import type React from "react";
import { useEffect, useState } from "react";
import { X, Check, Copy, Download, Printer, AlertCircle, Loader2, Tag } from "lucide-react";
import { QrRecord, StickerLabel } from "./types";
import { qrFullUrl, generateQrDataUrl } from "./helpers";
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
function recordFromV2Response(data: any, fallbackCategory: string, ownerPhone?: string, labelName?: string, labelColor?: string): QrRecord {
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
  const [step, setStep] = useState<"form" | "creating" | "success">("form");
  const [category, setCategory] = useState(initialCategory);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("none");
  const [created, setCreated] = useState<QrRecord | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setCategory(initialCategory);
      setPhone("");
      setPhoneError(null);
      setSelectedLabelId("none");
      setCreated(null);
      setRecoveryCode("");
      setUrlCopied(false);
      setCodeCopied(false);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  function hasDuplicate(cat: string, raw: string): boolean {
    const norm = normalizePhone(raw);
    if (!norm) return false;
    return qrList.some(
      (q) => (q.category || "car") === cat && normalizePhone(q.ownerPhone || q.phoneNumber || (q as any).phone || (q as any).owner_phone || "") === norm
    );
  }

  const chosenLabel = labels.find((l) => l.id === selectedLabelId);

  async function handleGenerate() {
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
      setStep("success");
    } catch (err: any) {
      setStep("form");
      if (err?.status === 409) {
        setPhoneError("Phone number already exists in this category.");
        setToast?.("That phone number is already in use in this category.");
      } else {
        setToast?.(err?.message ? `Failed to create tag: ${err.message}` : "Failed to create tag — please check your connection and try again.");
      }
      setTimeout(() => setToast?.(null), 4000);
    }
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
      className="fx-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16, 24, 40, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div className="fx-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <button className="fx-modal-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>

        {step !== "success" && (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 2 }}>
              Create QR tag
            </h3>
            <p style={{ fontSize: 13, color: "var(--fx-ink-2)", marginBottom: 20 }}>
              Stamp a new tag with custom category and batch label.
            </p>

            <div className="fx-field">
              <label className="fx-field-label" htmlFor="gt-category">Sticker category</label>
              <select
                id="gt-category"
                className="fx-select"
                style={{ width: "100%" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Label Picker */}
            {labels.length > 0 && (
              <div className="fx-field" style={{ marginTop: 12 }}>
                <label className="fx-field-label" htmlFor="gt-label">
                  Batch Label <span style={{ fontWeight: 400, color: "var(--fx-faint)" }}>(optional)</span>
                </label>
                <select
                  id="gt-label"
                  className="fx-select"
                  style={{ width: "100%" }}
                  value={selectedLabelId}
                  onChange={(e) => setSelectedLabelId(e.target.value)}
                >
                  <option value="none">No Label</option>
                  {labels.map((lbl) => (
                    <option key={lbl.id} value={lbl.id}>
                      {lbl.name}
                    </option>
                  ))}
                </select>
                {chosenLabel && (
                  <div style={{ marginTop: 6 }}>
                    <LabelBadge name={chosenLabel.name} color={chosenLabel.color} size="xs" />
                  </div>
                )}
              </div>
            )}

            <div className="fx-field" style={{ marginTop: 12 }}>
              <label className="fx-field-label" htmlFor="gt-phone">Phone number <span style={{ fontWeight: 400, color: "var(--fx-faint)" }}>(optional)</span></label>
              <input
                id="gt-phone"
                className="fx-input"
                style={{ width: "100%" }}
                placeholder="+91 98765 43210"
                inputMode="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              />
              {phoneError && (
                <div className="fx-error">
                  <AlertCircle size={13} />
                  {phoneError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="fx-btn fx-btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button className="fx-btn fx-btn-primary" style={{ flex: 1 }} onClick={handleGenerate} disabled={step === "creating"}>
                {step === "creating" ? (
                  <>
                    <Loader2 size={15} className="fx-spin" style={{ animation: "fx-spin 0.8s linear infinite" }} />
                    Creating…
                  </>
                ) : (
                  "Generate tag"
                )}
              </button>
            </div>
            <style>{`@keyframes fx-spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {step === "success" && created && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--fx-green-soft)", color: "var(--fx-green)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} />
              </span>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>QR created</h3>
                <p style={{ fontSize: 12.5, color: "var(--fx-ink-2)" }}>
                  {getCategoryLabel(created.category || "car")} · tag ready to print
                </p>
              </div>
            </div>

            {created.labelName && (
              <div style={{ marginBottom: 12 }}>
                <LabelBadge name={created.labelName} color={created.labelColor} size="sm" />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
              <div style={{ border: "1px solid var(--fx-border)", borderRadius: 10, padding: 10, background: "#FFF" }}>
                <QrCodeImage data={qrFullUrl(created.id)} fg="000000" bg="FFFFFF" size={168} style={{ width: 168, height: 168 }} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fx-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Public URL</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fx-canvas)", border: "1px solid var(--fx-border)", borderRadius: 8, padding: "6px 8px" }}>
                <input readOnly value={qrFullUrl(created.id)} style={{ flex: 1, background: "transparent", border: "none", fontSize: 12, outline: "none", color: "var(--fx-ink)", fontFamily: "monospace" }} />
                <button type="button" onClick={copyUrl} className="fx-btn fx-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>
                  {urlCopied ? <Check size={12} style={{ color: "var(--fx-green)" }} /> : <Copy size={12} />}
                  <span>{urlCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {recoveryCode && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fx-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Recovery code</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fx-canvas)", border: "1px solid var(--fx-border)", borderRadius: 8, padding: "6px 8px" }}>
                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", color: "var(--fx-ink)" }}>
                    {recoveryCode}
                  </span>
                  <button type="button" onClick={copyCode} className="fx-btn fx-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>
                    {codeCopied ? <Check size={12} style={{ color: "var(--fx-green)" }} /> : <Copy size={12} />}
                    <span>{codeCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="fx-btn fx-btn-secondary"
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12 }}
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
                  className="fx-btn fx-btn-primary"
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12 }}
                >
                  <Printer size={13} />
                  <span>Print tag</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}