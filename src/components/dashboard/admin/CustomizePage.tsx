import type React from "react";
import StickerEditor from "./StickerEditor";
import { StickerPos } from "./types";
import { DEFAULT_STICKER_POS } from "./helpers";

export default function CustomizePage({
  stickerPos = DEFAULT_STICKER_POS,
  setToast = () => {},
  openPrintSheet,
}: {
  templates?: any;
  setTemplates?: any;
  stickerPos?: StickerPos;
  setToast?: (msg: string | null) => void;
  openPrintSheet?: () => void;
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body" style={{ background: "var(--fx-canvas)" }}>
      <StickerEditor
        stickerPos={stickerPos}
        setToast={setToast}
        openPrintSheet={openPrintSheet}
      />
    </div>
  );
}
