import type React from "react";
import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

interface CopyCodeButtonProps {
  textToCopy: string;
  buttonTitle?: string;
}

export function CopyCodeButton({ textToCopy, buttonTitle = "Copy code" }: CopyCodeButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!textToCopy) return;

    navigator.clipboard?.writeText(textToCopy).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded-[6px] text-[var(--fx-faint)] hover:text-[var(--fx-ink)] hover:bg-[#E4E7EC] transition-colors cursor-pointer inline-flex items-center justify-center"
      title={buttonTitle}
      aria-label={buttonTitle}
    >
      {hasCopied ? (
        <Check size={12} className="text-[#16A34A]" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

interface MaskedCodeDisplayProps {
  codeValue: string;
  isRevealed: boolean;
  maskedLength?: number;
  highlightAccent?: boolean;
  fallbackText?: string;
}

export function MaskedCodeDisplay({
  codeValue,
  isRevealed,
  maskedLength = 12,
  highlightAccent = false,
  fallbackText = "—",
}: MaskedCodeDisplayProps) {
  if (!codeValue) {
    return <span className="text-[var(--fx-faint)] font-normal text-xs">{fallbackText}</span>;
  }

  if (!isRevealed) {
    const maskedDots = "•".repeat(maskedLength);
    return (
      <span className="font-mono text-[13px] text-[var(--fx-faint)] tracking-widest select-none">
        {maskedDots}
      </span>
    );
  }

  const textColorClass = highlightAccent
    ? "text-[var(--fx-accent-ink)] font-bold"
    : "text-[var(--fx-ink)] font-semibold";

  return (
    <div className="inline-flex items-center gap-1.5 max-w-full">
      <span
        className={`font-mono text-xs ${textColorClass} tracking-wide select-all break-all`}
      >
        {codeValue}
      </span>
      <CopyCodeButton textToCopy={codeValue} buttonTitle={`Copy ${codeValue}`} />
    </div>
  );
}

interface CodeVisibilityToggleButtonProps {
  isRevealed: boolean;
  onToggleVisibility: () => void;
}

export function CodeVisibilityToggleButton({
  isRevealed,
  onToggleVisibility,
}: CodeVisibilityToggleButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleVisibility();
  };

  if (isRevealed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[var(--fx-accent-ink)]/50 bg-[var(--fx-accent-soft)] hover:bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] font-semibold text-[11.5px] transition-colors cursor-pointer"
        title="Hide unique ID and recovery code"
      >
        <EyeOff size={13} className="text-[var(--fx-accent-ink)]" />
        <span>Hide</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[var(--fx-border)] bg-white hover:bg-[var(--fx-canvas)] text-[var(--fx-ink)] font-semibold text-[11.5px] transition-colors cursor-pointer"
      title="Reveal unique ID and recovery code"
    >
      <Eye size={13} className="text-[var(--fx-accent-ink)]" />
      <span>See</span>
    </button>
  );
}
