import { Gauge, ScanLine, Receipt, Handshake, Quote, Headset, Mailbox, Siren, Fingerprint, Gem, Palette, MessagesSquare } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Pinterest Sans", label: "Pinterest Sans", css: "'Pinterest Sans', 'Pin Sans', ui-sans-serif, system-ui" },
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

// Deliberately not the obvious/default icon for each of these (grid for
// overview, bell for alerts, star for reviews, etc.) — picked for a less
// "every dashboard template" feel while staying legible at a glance.
export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "qr", label: "QR Stickers", icon: ScanLine, section: "Fleet & Operations" },
  { id: "orders", label: "Orders", icon: Receipt, section: "Fleet & Operations" },
  { id: "distributors", label: "Distributors", icon: Handshake, section: "Fleet & Operations" },
  { id: "reviews", label: "Reviews", icon: Quote, section: "Fleet & Operations" },
  { id: "communication", label: "Communication", icon: Headset, section: "Engagement" },
  { id: "messages", label: "Message Manager", icon: Mailbox, section: "Engagement" },
  { id: "alerts", label: "Alerts", icon: Siren, section: "Engagement" },
  { id: "users", label: "Users", icon: Fingerprint, section: "Management" },
  { id: "products", label: "Shop Products", icon: Gem, section: "Management" },
  { id: "customize", label: "Sticker & Print", icon: Palette, section: "Management" },
];

// Client (sticker owner) only nav item — their link into the RepiChat inbox.
export const REPICHAT_NAV_ITEM = { id: "repichat", label: "RepiChat", icon: MessagesSquare };


export const EDITOR_DISPLAY = { w: 320, h: 200 };
