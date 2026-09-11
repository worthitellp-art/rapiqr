import type React from "react";
import StickerEditor from "./StickerEditor";
import { StickerPos } from "./types";

export default function CustomizePage({
  stickerPos = { x: 110, y: 40, w: 100, h: 100 },
  setStickerPos = () => {},
  setToast = () => {},
  openPrintSheet,
}: {
  templates?: any;
  setTemplates?: any;
  stickerPos?: StickerPos;
  setStickerPos?: (p: StickerPos) => void;
  setToast?: (msg: string | null) => void;
  openPrintSheet?: () => void;
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[#18181B] font-body" style={{ background: "#F8F8F7" }}>
      <StickerEditor
        stickerPos={stickerPos}
        setStickerPos={setStickerPos}
        setToast={setToast}
        openPrintSheet={openPrintSheet}
      />
    </div>
  );
}
