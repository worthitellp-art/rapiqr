import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function Toast({ msg }: { msg: string | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (msg) { setVisible(true); } else { setVisible(false); }
  }, [msg]);

  if (!msg) return null;
  return (
    <div
      className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-6 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-sm font-semibold text-white"
      style={{
        background: "#18181B",
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.96)",
        opacity: visible ? 1 : 0,
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 8px 24px rgba(16,24,40,0.22), 0 2px 8px rgba(16,24,40,0.12)",
      }}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
        <Check size={11} />
      </div>
      {msg}
    </div>
  );
}