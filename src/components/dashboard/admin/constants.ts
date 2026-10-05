import { LayoutGrid, QrCode, PhoneCall, Bell, Users, Printer, Store, ShoppingBag, MessageCircle, Send, Package, Star } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Pinterest Sans", label: "Pinterest Sans", css: "'Pinterest Sans', 'Pin Sans', ui-sans-serif, system-ui" },
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "qr", label: "QR Stickers", icon: QrCode, section: "Fleet & Operations" },
  { id: "orders", label: "Orders", icon: ShoppingBag, section: "Fleet & Operations" },
  { id: "distributors", label: "Distributors", icon: Store, section: "Fleet & Operations" },
  { id: "reviews", label: "Reviews", icon: Star, section: "Fleet & Operations" },
  { id: "communication", label: "Communication", icon: PhoneCall, section: "Engagement" },
  { id: "messages", label: "Message Manager", icon: Send, section: "Engagement" },
  { id: "alerts", label: "Alerts", icon: Bell, section: "Engagement" },
  { id: "users", label: "Users", icon: Users, section: "Management" },
  { id: "products", label: "Shop Products", icon: Package, section: "Management" },
  { id: "customize", label: "Sticker & Print", icon: Printer, section: "Management" },
];

// Client (sticker owner) only nav item — their link into the RepiChat inbox.
export const REPICHAT_NAV_ITEM = { id: "repichat", label: "RepiChat", icon: MessageCircle };


export const EDITOR_DISPLAY = { w: 320, h: 200 };
