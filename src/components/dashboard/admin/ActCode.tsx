import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function ActCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:bg-amber-100"
      style={{ background: "rgba(180,83,9,0.1)", color: "#92400e", border: "1px solid rgba(180,83,9,0.2)" }}
    >
      <ShieldCheck size={11} />
      {copied ? "Copied!" : code}
    </button>
  );
}
