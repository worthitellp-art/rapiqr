import { useEffect, useState } from "react";
import type React from "react";
import { generateQrDataUrl } from "./helpers";

interface QrCodeImageProps {
  data: string;
  fg: string;
  bg: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  draggable?: boolean;
}

/**
 * Renders a QR code generated locally (no third-party service, no network
 * call) via helpers.generateQrDataUrl. Deterministic and cached, so re-mounts
 * with the same props resolve instantly from memory.
 */
export default function QrCodeImage({ data, fg, bg, size, className, style, alt = "QR code", draggable }: QrCodeImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateQrDataUrl(data, fg, bg, size).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [data, fg, bg, size]);

  if (!src) {
    return <div className={className} style={{ ...style, background: `#${bg}` }} />;
  }
  return <img src={src} className={className} style={style} alt={alt} draggable={draggable} />;
}
