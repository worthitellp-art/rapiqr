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
      className="p-1 rounded-[6px] text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#E4E7EC] transition-colors cursor-pointer inline-flex items-center justify-center"
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
    return <span className="text-[#A1A1AA] font-normal text-xs">{fallbackText}</span>;
  }

  if (!isRevealed) {
    const maskedDots = "•".repeat(maskedLength);
    return (
      <span className="font-mono text-[13px] text-[#A1A1AA] tracking-widest select-none">
        {maskedDots}
      </span>
    );
  }

  const textColorClass = highlightAccent
    ? "text-[#EAB308] font-bold"
    : "text-[#18181B] font-semibold";

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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[#EAB308]/50 bg-[#FDF4DB] hover:bg-[#F8E9B0] text-[#A16207] font-semibold text-[11.5px] transition-colors cursor-pointer"
        title="Hide unique ID and recovery code"
      >
        <EyeOff size={13} className="text-[#A16207]" />
        <span>Hide</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F8F8F7] text-[#18181B] font-semibold text-[11.5px] transition-colors cursor-pointer"
      title="Reveal unique ID and recovery code"
    >
      <Eye size={13} className="text-[#EAB308]" />
      <span>See</span>
    </button>
  );
}
