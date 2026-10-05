import { useState } from "react";
import { 
  MessageSquare, 
  PhoneCall, 
  Copy, 
  Check, 
  ChevronDown, 
  X,
  Server,
  CloudLightning,
  Clock,
  ShieldCheck,
  Info,
  CheckCircle2,
  Code
} from "lucide-react";

export interface WhatsAppErrorDetails {
  code?: string;
  source?: "app" | "msg91" | "meta" | "client" | "network";
  sourceLabel?: string;
  whatFailed?: string;
  whyFailed?: string;
  safeNextAction?: string;
  retryAfterSec?: number | null;
  technicalDetails?: {
    statusCode?: number | null;
    originalError?: any;
    originalCode?: string | number | null;
    requestId?: string | null;
    endpoint?: string | null;
    rawResponse?: any;
    timestamp?: string;
  };
}

interface WhatsAppErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: WhatsAppErrorDetails | null;
  onOpenChat?: () => void;
  onCallMasked?: () => void;
  ownerPhoneAvailable?: boolean;
}

export default function WhatsAppErrorModal({
  isOpen,
  onClose,
  error,
  onOpenChat,
  onCallMasked,
  ownerPhoneAvailable = false,
}: WhatsAppErrorModalProps) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !error) return null;

  const code = error.code || "";
  const isCooldown = 
    code === "RATE_LIMIT_THREAD_COOLDOWN" || 
    code === "RATE_LIMIT_DEBOUNCE" || 
    code === "RATE_LIMIT_DUPLICATE" ||
    Boolean(error.retryAfterSec);

  const source = error.source || "app";
  const sourceLabel = error.sourceLabel || (source === "msg91" ? "MSG91 Gateway" : "RepiQR Application");
  
  // Human-friendly title and subtitle
  const title = isCooldown 
    ? "Owner Already Alerted" 
    : (error.whatFailed || "WhatsApp Delivery Notice");

  const friendlyMessage = isCooldown
    ? (error.whyFailed || "The owner was already sent a WhatsApp notification moments ago. Your message is safely recorded in their chat thread.")
    : (error.whyFailed || "WhatsApp delivery is temporarily unavailable, but your alert is safely recorded in the app.");

  const nextAction = error.safeNextAction || "You can continue communicating with the owner directly using secure in-app chat.";

  const handleCopyDebug = () => {
    const debugText = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        error,
      },
      null,
      2
    );
    navigator.clipboard.writeText(debugText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-modal-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
              isCooldown 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {isCooldown ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <Info className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                  isCooldown 
                    ? "bg-blue-100/70 text-blue-700" 
                    : "bg-amber-100/70 text-amber-800"
                }`}>
                  {isCooldown ? "Notification Active" : "Notice"}
                </span>
                {error.retryAfterSec && error.retryAfterSec > 0 && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {error.retryAfterSec}s cooldown
                  </span>
                )}
              </div>
              <h2 id="wa-modal-title" className="text-base font-bold text-slate-900 mt-1 leading-snug">
                {title}
              </h2>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Main message card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2.5">
            <p className="text-slate-800 text-[13px] leading-relaxed">
              {friendlyMessage}
            </p>
            <p className="text-slate-500 text-[12px] leading-relaxed">
              {nextAction}
            </p>
          </div>

          {/* Status checklist */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Alert recorded in vehicle history</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>In-app chat thread is open and ready</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Open In-App Chat
              </button>
            )}

            {ownerPhoneAvailable && onCallMasked && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCallMasked();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                Call Owner via Masked Call
              </button>
            )}
          </div>

          {/* Collapsible Technical Details (For Developers & Tracing) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Code className="w-3.5 h-3.5 text-slate-400" />
                {showTechDetails ? "Hide technical diagnostic details" : "Show technical details for support"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTechDetails ? "rotate-180" : ""}`} />
            </button>

            {showTechDetails && (
              <div className="mt-2.5 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-mono text-slate-600 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-sans">
                  <span className="text-slate-500 text-[11px] font-medium">{sourceLabel}</span>
                  <button
                    type="button"
                    onClick={handleCopyDebug}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    {copied ? "Copied" : "Copy Trace"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans">Error Code:</span>
                    <span className="font-semibold text-slate-800 break-all">{error.code || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">HTTP Status:</span>
                    <span className="font-semibold text-slate-800">{error.technicalDetails?.statusCode || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">MSG91 Request ID:</span>
                    <span className="text-slate-800 break-all">{error.technicalDetails?.requestId || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Original Code:</span>
                    <span className="text-slate-800">{String(error.technicalDetails?.originalCode || "None")}</span>
                  </div>
                </div>

                {error.technicalDetails?.rawResponse && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block font-sans mb-1 text-[11px]">Raw Response / Payload:</span>
                    <pre className="p-2 rounded-xl bg-slate-900 text-emerald-400 text-[10px] overflow-x-auto max-h-32">
                      {typeof error.technicalDetails.rawResponse === "object"
                        ? JSON.stringify(error.technicalDetails.rawResponse, null, 2)
                        : String(error.technicalDetails.rawResponse)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Saved to RepiQR database
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
