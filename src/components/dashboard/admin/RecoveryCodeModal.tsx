import { useState } from "react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { FxModal } from "../shared";

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

  const handleCopy = () => {
    navigator.clipboard?.writeText(recoveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <FxModal
      isOpen={isOpen}
      onClose={onClose}
      title="Save this recovery code"
      icon={<ShieldCheck size={19} />}
      iconTone="accent"
      footer={
        <button onClick={onClose} className="fx-btn fx-btn-primary w-full">
          I've saved this code
        </button>
      }
    >
      <div className="mb-4">
        This code is shown <strong>only once</strong> and is not stored anywhere in plaintext. Keep it with the
        physical sticker <span className="font-mono font-semibold text-[var(--fx-ink)]">{stickerId}</span> — it's the
        only way to restore this sticker's record if it's ever deleted.
      </div>

      <div className="flex items-center gap-2 bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-lg p-3">
        <span className="flex-1 font-mono font-bold text-[15px] tracking-wider text-[var(--fx-ink)] text-center">
          {recoveryCode}
        </span>
        <button
          onClick={handleCopy}
          className="w-8 h-8 rounded-lg bg-[var(--fx-surface)] border border-[var(--fx-border)] flex items-center justify-center text-[var(--fx-faint)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] cursor-pointer transition-colors flex-shrink-0"
          title="Copy recovery code"
        >
          {copied ? <Check size={14} className="text-[var(--fx-green)]" /> : <Copy size={14} />}
        </button>
      </div>
    </FxModal>
  );
}
