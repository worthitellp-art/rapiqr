import type React from "react";
import StickerEditor from "./StickerEditor";
import { Template, StickerPos } from "./types";

export default function CustomizePage({
  templates, setTemplates, stickerPos, setStickerPos, setToast,
}: {
  templates: Template[]; setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  stickerPos: StickerPos; setStickerPos: (p: StickerPos) => void;
  setToast: (msg: string | null) => void;
}) {
  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <StickerEditor stickerPos={stickerPos} setStickerPos={setStickerPos} templates={templates} setTemplates={setTemplates} setToast={setToast} />
    </div>
  );
}
