import { useState } from "react";
import { Tag } from "lucide-react";

/** Copyable QR ID badge — this used to show a separate admin-generated "activation
 * code", but the system now links stickers to accounts purely by phone number, so
 * the QR's own ID is the only identifier a sticker has. */
export default function IdBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:bg-amber-100"
      style={{ background: "rgba(180,83,9,0.1)", color: "#92400e", border: "1px solid rgba(180,83,9,0.2)" }}
    >
      <Tag size={11} />
      {copied ? "Copied!" : code}
    </button>
  );
}
