import type React from "react";
import StickerEditor from "./StickerEditor";
import { StickerPos } from "./types";

export default function CustomizePage({
  stickerPos = { x: 110, y: 40, w: 100, h: 100 },
  setStickerPos = () => {},
  setToast = () => {},
}: {
  templates?: any;
  setTemplates?: any;
  stickerPos?: StickerPos;
  setStickerPos?: (p: StickerPos) => void;
  setToast?: (msg: string | null) => void;
}) {
  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      <StickerEditor
        stickerPos={stickerPos}
        setStickerPos={setStickerPos}
        setToast={setToast}
      />
    </div>
  );
}
