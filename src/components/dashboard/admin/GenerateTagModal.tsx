import type React from "react";
import { useEffect, useState } from "react";
import { X, Check, Copy, Download, Printer, AlertCircle, Loader2 } from "lucide-react";
import { QrRecord } from "./types";
import { uid, generateStickerId, generateClientRecoveryCode, qrFullUrl, generateQrDataUrl } from "./helpers";
import { apiClient } from "../../../lib/apiClient";
import { STICKER_CATEGORIES, getCategoryLabel } from "../../../stickerModules";
import QrCodeImage from "./QrCodeImage";

function normalizePhone(phone: string): string | null {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function formatRecovery(code: string): string {
  const c = String(code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!c) return "";
  return (c.match(/.{1,4}/g) || []).join("-");
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

function buildQrRecord(targetCategory: string, ownerPhone?: string): QrRecord {
  const rec: QrRecord = {
    id: generateStickerId(),
    clientId: uid("CL"),
    qrUrl: "",
    createdAt: new Date().toISOString(),
    scans: 0,
    status: "inactive",
    template: "Standard Tag",
    category: targetCategory,
    fg: "000000",
    bg: "FFFFFF",
    recoveryCode: generateClientRecoveryCode(),
  };
  if (ownerPhone && ownerPhone.trim()) rec.ownerPhone = ownerPhone.trim();
  rec.qrUrl = qrFullUrl(rec.id);
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

    const rec = buildQrRecord(category, phone);
    setQrList((prev) => [rec, ...prev]);
    setStep("creating");

    // The "success" screen — QR code, ID, recovery code — must only ever show
    // for a tag the server actually persisted. This used to fall through to
    // success on ANY save failure that wasn't a 409 (network blip, 500,
    // expired session, ...), handing the admin a fully-formed-looking sticker
    // that had never been written to the database: unrecoverable, never
    // syncing to the client dashboard, because there was nothing there to sync.
    try {
      const res = await apiClient.qr.saveQrCode({
        id: rec.id,
        clientId: rec.clientId,
        status: rec.status,
        templateName: rec.template,
        category: rec.category,
        fgColor: rec.fg,
        bgColor: rec.bg,
        recoveryCode: rec.recoveryCode,
        ownerPhone: phone.trim() || undefined,
      });
      const resolvedCode = res?.data?.recoveryCode || rec.recoveryCode || "";
      rec.recoveryCode = resolvedCode;
      setCreated(rec);
      setRecoveryCode(resolvedCode);
      setStep("success");
    } catch (err: any) {
      setQrList((prev) => prev.filter((x) => x.id !== rec.id));
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
    <div className="rq-modal-backdrop" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }} onClick={onClose}>
      <div className="rq-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rq-modal-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>

        {step !== "success" && (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 2 }}>
              Create QR tag
            </h3>
            <p style={{ fontSize: 13, color: "var(--rq-text-2)", marginBottom: 20 }}>
              Stamp a new tag. Recovery codes appear once after creation.
            </p>

            <div className="rq-field">
              <label className="rq-field-label" htmlFor="gt-category">Sticker category</label>
              <select
                id="gt-category"
                className="rq-select"
                style={{ width: "100%" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {STICKER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="rq-field">
              <label className="rq-field-label" htmlFor="gt-phone">Phone number <span style={{ fontWeight: 400, color: "var(--rq-muted)" }}>(optional)</span></label>
              <input
                id="gt-phone"
                className="rq-input"
                style={{ width: "100%" }}
                placeholder="+91 98765 43210"
                inputMode="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              />
              {phoneError && (
                <div className="rq-error">
                  <AlertCircle size={13} />
                  {phoneError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="rq-btn rq-btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button className="rq-btn rq-btn-primary" style={{ flex: 1 }} onClick={handleGenerate} disabled={step === "creating"}>
                {step === "creating" ? (
                  <>
                    <Loader2 size={15} className="rq-spin" style={{ animation: "rq-spin 0.8s linear infinite" }} />
                    Creating…
                  </>
                ) : (
                  "Generate tag"
                )}
              </button>
            </div>
            <style>{`@keyframes rq-spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {step === "success" && created && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--rq-success-soft)", color: "var(--rq-success)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} />
              </span>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>QR created</h3>
                <p style={{ fontSize: 12.5, color: "var(--rq-text-2)" }}>
                  {getCategoryLabel(created.category || "car")} · tag ready to print
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
              <div style={{ border: "1px solid var(--rq-border)", borderRadius: 10, padding: 10, background: "#FFF" }}>
                <QrCodeImage data={qrFullUrl(created.id)} fg="000000" bg="FFFFFF" size={168} style={{ width: 168, height: 168 }} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--rq-muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Public URL</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--rq-bg)", border: "1px solid var(--rq-border)", borderRadius: 8, padding: "6px 8px" }}>
                <span className="rq-mono" style={{ flex: 1, fontSize: 12, color: "var(--rq-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {qrFullUrl(created.id)}
                </span>
                <button className="rq-icon-btn" title="Copy URL" onClick={copyUrl}>
                  {urlCopied ? <Check size={14} style={{ color: "var(--rq-success)" }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--rq-muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Recovery code</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--rq-bg)", border: "1px solid var(--rq-border)", borderRadius: 8, padding: "6px 8px" }}>
                <span className="rq-mono" style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: "0.08em", color: "var(--rq-text)", userSelect: "all" }}>
                  {formatRecovery(recoveryCode)}
                </span>
                <button className="rq-icon-btn" title="Copy recovery code" onClick={copyCode}>
                  {codeCopied ? <Check size={14} style={{ color: "var(--rq-success)" }} /> : <Copy size={14} />}
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
              <button className="rq-btn rq-btn-secondary" style={{ flex: 1 }} onClick={handleDownloadQr}>
                <Download size={14} /> Download QR
              </button>
              <button className="rq-btn rq-btn-secondary" style={{ flex: 1 }} onClick={() => onPrint?.(created, [created])}>
                <Printer size={14} /> Print tag
              </button>
            </div>
            <button className="rq-btn rq-btn-primary" style={{ width: "100%" }} onClick={onClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}