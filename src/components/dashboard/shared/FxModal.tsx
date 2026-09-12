import type React from "react";
import { AlertTriangle, X } from "lucide-react";

const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

const ICON_TONE_CLASS: Record<"default" | "danger" | "accent", string> = {
  default: "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]",
  danger: "bg-[var(--fx-red-soft)] text-[var(--fx-red)]",
  accent: "bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)]",
};

/**
 * Canonical modal shell — backdrop, panel, close button, optional icon/title
 * header row, body, optional footer slot. Generalizes the shape that used to
 * be reimplemented independently in ConfirmModal, StickerModals' ModalShell,
 * SupportLegalPanel's LegalModal, and CompleteProfilePopup.
 */
export default function FxModal({
  isOpen,
  onClose,
  title,
  icon,
  iconTone = "default",
  size = "sm",
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  iconTone?: "default" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fx-modal-backdrop" onClick={onClose}>
      <div
        className={`fx-modal relative w-full ${SIZE_CLASS[size]} p-6 font-body animate-modal-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-lg bg-[var(--fx-canvas)] flex items-center justify-center text-[var(--fx-faint)] hover:text-[var(--fx-ink)] hover:bg-[var(--fx-sidebar-hover)] cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        {(icon || title) && (
          <div className="flex items-center gap-3 mb-3 pr-8">
            {icon && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_TONE_CLASS[iconTone]}`}>
                {icon}
              </div>
            )}
            {title && <h3 className="font-display text-[var(--fx-ink)] text-[17px] leading-snug">{title}</h3>}
          </div>
        )}

        <div className="text-[13.5px] text-[var(--fx-ink-2)] leading-relaxed">{children}</div>

        {footer && <div className="flex gap-3 text-[12px] mt-6">{footer}</div>}
      </div>
    </div>
  );
}

/** Convenience wrapper for the common delete/confirm dialog shape. */
export function FxConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <FxModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle size={19} />}
      iconTone="danger"
      footer={
        <>
          <button onClick={onClose} className="fx-btn fx-btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="fx-btn fx-btn-danger flex-1"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {message}
    </FxModal>
  );
}
