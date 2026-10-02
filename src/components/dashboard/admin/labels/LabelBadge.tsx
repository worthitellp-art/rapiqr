import React from "react";
import { Tag } from "lucide-react";
import { getLabelBadgeStyle } from "./labelConstants";

interface LabelBadgeProps {
  name: string;
  color?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
}

export default function LabelBadge({
  name,
  color,
  size = "xs",
  className = "",
  onClick,
  showIcon = false,
}: LabelBadgeProps) {
  const styles = getLabelBadgeStyle(color);
  const hex = color ? (color.startsWith("#") ? color : `#${color}`) : "#64748B";

  const sizeClasses = {
    xs: "text-[11px] px-2 py-0.5 gap-1.5 font-bold",
    sm: "text-xs px-2.5 py-1 gap-1.5 font-bold",
    md: "text-sm px-3 py-1.5 gap-2 font-bold",
  }[size];

  return (
    <span
      style={styles}
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all select-none ${sizeClasses} ${
        onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : ""
      } ${className}`}
    >
      {showIcon ? (
        <Tag size={size === "xs" ? 10 : 12} style={{ color: hex }} />
      ) : (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: hex }}
        />
      )}
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}
