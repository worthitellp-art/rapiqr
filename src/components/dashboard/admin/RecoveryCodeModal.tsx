import { useState } from "react";
import { ShieldCheck, X, Copy, Check } from "lucide-react";

export default function RecoveryCodeModal({
  isOpen,
  stickerId,
  recoveryCode,
  onClose,
}: {
  isOpen: boolean;
  stickerId: string;
  recoveryCode: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(recoveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-white border border-[#E5E7EB] w-full max-w-sm p-6 text-[#18181B] relative font-body rounded-2xl shadow-[0_16px_48px_rgba(16,24,40,0.16),0_2px_8px_rgba(16,24,40,0.08)]"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-[8px] bg-[#F4F4F5] flex items-center justify-center text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#E4E7EC] cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#FDF4DB] text-[#A16207] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={19} />
          </div>
          <h3 className="font-display font-semibold text-[#18181B] text-[17px] leading-snug">Save this recovery code</h3>
        </div>

        <div className="text-[13.5px] text-[#71717A] leading-relaxed mb-4">
          This code is shown <strong>only once</strong> and is not stored anywhere in plaintext. Keep it with the
          physical sticker <span className="font-mono font-semibold text-[#18181B]">{stickerId}</span> — it's the
          only way to restore this sticker's record if it's ever deleted.
        </div>

        <div className="flex items-center gap-2 bg-[#F8F8F7] border border-[#E5E7EB] rounded-[10px] p-3 mb-5">
          <span className="flex-1 font-mono font-bold text-[15px] tracking-wider text-[#18181B] text-center">
            {recoveryCode}
          </span>
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] flex items-center justify-center text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F8F8F7] cursor-pointer transition-colors flex-shrink-0"
            title="Copy recovery code"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </button>
        </div>

        <button
          onClick={onClose}
          className="ac-btn ac-btn-accent w-full"
        >
          I've saved this code
        </button>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
