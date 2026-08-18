import { LayoutGrid, Plus, PhoneCall, Bell, Users, Palette, Store, ShoppingBag, MessageCircle, CloudUpload, Send } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

// Admin's own nav — deliberately excludes "repichat": the system admin doesn't
// run per-sticker conversations, they just need to see which owners are
// online (see the "Online Now" widget on the Overview page).
export const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "distributors", label: "Distributors", icon: Store },
  { id: "qr", label: "QR Codes", icon: Plus },
  { id: "communication", label: "Communication", icon: PhoneCall },
  { id: "messages", label: "Message Manager", icon: Send },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Users", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
  { id: "backup", label: "Backup & Restore", icon: CloudUpload },
];

// Client (sticker owner) only nav item — their link into the RepiChat inbox.
export const REPICHAT_NAV_ITEM = { id: "repichat", label: "RepiChat", icon: MessageCircle };


export const EDITOR_DISPLAY = { w: 320, h: 200 };
