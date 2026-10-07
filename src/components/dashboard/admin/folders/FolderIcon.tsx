import React from "react";

interface FolderIconProps {
  className?: string;
  size?: number;
  /** Optional preview content inside folder: 'sheet' | 'empty' | 'media' */
  variant?: "sheet" | "empty" | "media";
  /** Optional badge or sticker count */
  badgeCount?: number;
}

/**
 * Windows 11 Fluent Style Folder Icon
 * Recreates the exact authentic yellow-amber Windows 11 File Explorer folder
 * with back flap, white document paper peek, front pocket, and subtle drop shadow.
 */
export default function FolderIcon({
  className = "",
  size = 72,
  variant = "sheet",
  badgeCount,
}: FolderIconProps) {
  const width = size;
  const height = Math.round(size * 0.82);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 96 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          {/* Back flap gradient (darker warm amber) */}
          <linearGradient id="win11_back_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E99912" />
            <stop offset="100%" stopColor="#D48208" />
          </linearGradient>

          {/* Front flap gradient (bright Windows 11 yellow) */}
          <linearGradient id="win11_front_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFDE6A" />
            <stop offset="25%" stopColor="#FFCE34" />
            <stop offset="100%" stopColor="#F5AA14" />
          </linearGradient>

          {/* Front top lip highlight */}
          <linearGradient id="win11_lip_highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFECA8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFD34D" stopOpacity="0.3" />
          </linearGradient>

          {/* Document sheet gradient */}
          <linearGradient id="win11_sheet_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEF2F6" />
          </linearGradient>

          {/* Inner shadow for folder opening */}
          <linearGradient id="win11_pocket_shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8C4E03" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8C4E03" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. Back Folder Body with Tab ──────────────────────────────────── */}
        <path
          d="M 6 12 C 6 8.5 8.5 6 12 6 L 36 6 C 39.5 6 42 8 44.5 11 L 49.5 17 C 51 18.8 53.5 20 56 20 L 84 20 C 87.5 20 90 22.5 90 26 L 90 68 C 90 71.5 87.5 74 84 74 L 12 74 C 8.5 74 6 71.5 6 68 Z"
          fill="url(#win11_back_grad)"
        />

        {/* ── 2. Inside Paper Peek (Windows 11 sheet preview) ──────────────── */}
        {variant === "sheet" && (
          <g className="transition-transform duration-200 group-hover:-translate-y-1">
            {/* White Document Paper sticking out */}
            <rect
              x="26"
              y="15"
              width="44"
              height="38"
              rx="3"
              fill="url(#win11_sheet_grad)"
              stroke="#D1D5DB"
              strokeWidth="0.8"
            />
            {/* Document preview lines / icon hint */}
            <rect x="32" y="22" width="22" height="2.5" rx="1.25" fill="#94A3B8" />
            <rect x="32" y="28" width="32" height="2" rx="1" fill="#CBD5E1" />
            <rect x="32" y="33" width="26" height="2" rx="1" fill="#CBD5E1" />
            {/* Mini QR hint in document corner */}
            <rect x="56" y="20" width="8" height="8" rx="1.5" fill="#3B82F6" fillOpacity="0.85" />
          </g>
        )}

        {/* ── 3. Pocket Dark Crease / Interior Shadow ──────────────────────── */}
        <rect x="8" y="28" width="80" height="12" fill="url(#win11_pocket_shadow)" />

        {/* ── 4. Front Folder Flap (Smooth curved front pocket) ─────────────── */}
        <path
          d="M 6 29 C 6 26.5 8 24.5 10.5 24.5 L 85.5 24.5 C 88 24.5 90 26.5 90 29 L 90 67 C 90 71 87 74 83 74 L 13 74 C 9 74 6 71 6 67 Z"
          fill="url(#win11_front_grad)"
        />

        {/* Front Flap Top Rim Highlight */}
        <path
          d="M 8 25.5 L 88 25.5"
          stroke="url(#win11_lip_highlight)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Optional Badge Count Pill */}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-center text-[10px] font-black rounded-full bg-gray-900 text-white shadow-xs border border-white">
          {badgeCount}
        </span>
      )}
    </div>
  );
}
