import { qrImageUrl, qrFullUrl } from "./helpers";
import { QrRecord, Template, StickerPos } from "./types";
import stickerTemplateImg from "../../../assets/template-sticker.jpeg";

const STICKER_SRC = stickerTemplateImg;
const EDITOR_DISPLAY = { w: 320, h: 200 };

export default function StickerThumb({ qr, templates, size = 96 }: { qr: QrRecord; templates: Template[]; size?: number }) {
  const tpl = templates.find((t) => t.name === qr.template) || templates[0];
  const sp: StickerPos = tpl?.stickerPos || { x: 110, y: 40, w: 100, h: 100 };
  const thumbH = Math.round(size * (EDITOR_DISPLAY.h / EDITOR_DISPLAY.w));
  const qrX = (sp.x / EDITOR_DISPLAY.w) * size;
  const qrY = (sp.y / EDITOR_DISPLAY.h) * thumbH;
  const qrW = (sp.w / EDITOR_DISPLAY.w) * size;
  const qrH = (sp.h / EDITOR_DISPLAY.h) * thumbH;
  const qrFg = (qr?.fg || tpl?.fg || "EAB308").replace(/#/g, "");
  const qrBg = (qr?.bg || tpl?.bg || "FFFFFF").replace(/#/g, "");

  return (
    <div
      style={{
        width: size, height: thumbH, position: "relative", overflow: "hidden",
        borderRadius: 8, flexShrink: 0,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <img src={STICKER_SRC} style={{ width: "100%", height: "100%", objectFit: "fill" }} draggable={false} alt="" />
      <img
        src={qrImageUrl(qrFullUrl(qr.id), qrFg, qrBg, 128)}
        style={{ position: "absolute", left: qrX, top: qrY, width: qrW, height: qrH, objectFit: "contain" }}
        draggable={false}
        alt="qr"
      />
    </div>
  );
}
