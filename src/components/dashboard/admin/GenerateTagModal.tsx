import type React from "react";
import { useEffect, useState } from "react";
import { X, Check, Copy, Download, Printer, AlertCircle, Loader2 } from "lucide-react";
import { QrRecord } from "./types";
import { qrFullUrl, generateQrDataUrl } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryLabel } from "../../../stickerModules";
import QrCodeImage from "./QrCodeImage";

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
  setToast: (msg: string | null) => void;
  onPrint?: (target?: QrRecord, batch?: QrRecord[]) => void;
}

/** Maps the id-scheme v2 server response (QrModel.saveV2) into a QrRecord. */
function recordFromV2Response(data: any, fallbackCategory: string, ownerPhone?: string): QrRecord {
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
  setToast,
  onPrint,
}: GenerateTagModalProps) {
  const [step, setStep] = useState<"form" | "creating" | "success">("form");
  const [category, setCategory] = useState(initialCategory);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
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

    // id-scheme v2: the server generates the recovery code AND derives the
    // sticker id from it (see QrModel.saveV2) — neither is known until the
    // response comes back, so there's nothing to optimistically prepend
    // beforehand. The "success" screen only ever shows a tag the server
    // actually persisted — a prior version of this flow could fall through to
    // success on ANY save failure that wasn't a 409 (network blip, 500,
    // expired session, ...), handing the admin a fully-formed-looking sticker
    // that had never been written to the database: unrecoverable, never
    // syncing to the client dashboard, because there was nothing there to sync.
    try {
      const res = await apiClient.qr.saveQrCodeV2({
        category,
        ownerPhone: phone.trim() || undefined,
      });
      if (!res?.success || !res.data) throw new Error(res?.error || "Failed to create tag");

      const rec = recordFromV2Response(res.data, category, phone);
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
    navigator.clipboard?.writeText(recoveryCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1800);
    });
  };

  return (
    <div className="fx-modal-backdrop" style={{ fontFamily: "'Pinterest Sans', 'Pin Sans', ui-sans-serif, system-ui" }} onClick={onClose}>
      <div className="fx-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <button className="fx-modal-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>

        {step !== "success" && (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 2 }}>
              Create QR tag
            </h3>
            <p style={{ fontSize: 13, color: "var(--fx-ink-2)", marginBottom: 20 }}>
              Stamp a new tag. Recovery codes appear once after creation.
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

            <div className="fx-field">
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

            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
              <div style={{ border: "1px solid var(--fx-border)", borderRadius: 10, padding: 10, background: "#FFF" }}>
                <QrCodeImage data={qrFullUrl(created.id)} fg="000000" bg="FFFFFF" size={168} style={{ width: 168, height: 168 }} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fx-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Public URL</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fx-canvas)", border: "1px solid var(--fx-border)", borderRadius: 8, padding: "6px 8px" }}>
                <span className="fx-mono" style={{ flex: 1, fontSize: 12, color: "var(--fx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {qrFullUrl(created.id)}
                </span>
                <button className="fx-icon-btn" title="Copy URL" onClick={copyUrl}>
                  {urlCopied ? <Check size={14} style={{ color: "var(--fx-green)" }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fx-faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Recovery code</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fx-canvas)", border: "1px solid var(--fx-border)", borderRadius: 8, padding: "6px 8px" }}>
                <span className="fx-mono" style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fx-ink)", userSelect: "all" }}>
                  {recoveryCode}
                </span>
                <button className="fx-icon-btn" title="Copy recovery code" onClick={copyCode}>
                  {codeCopied ? <Check size={14} style={{ color: "var(--fx-green)" }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 10px", marginBottom: 18 }}>
              <AlertCircle size={14} style={{ color: "#B45309", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: "#92400E", lineHeight: 1.4 }}>
                Save this recovery code securely. It is shown only once and restores the sticker if it is ever deleted.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button className="fx-btn fx-btn-secondary" style={{ flex: 1 }} onClick={handleDownloadQr}>
                <Download size={14} /> Download QR
              </button>
              <button className="fx-btn fx-btn-secondary" style={{ flex: 1 }} onClick={() => onPrint?.(created, [created])}>
                <Printer size={14} /> Print tag
              </button>
            </div>
            <button className="fx-btn fx-btn-primary" style={{ width: "100%" }} onClick={onClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}