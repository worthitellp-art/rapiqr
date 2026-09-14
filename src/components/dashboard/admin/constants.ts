import { LayoutGrid, Plus, PhoneCall, Bell, Users, Palette, Store, ShoppingBag, MessageCircle, Send, Package } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Pinterest Sans", label: "Pinterest Sans", css: "'Pinterest Sans', 'Pin Sans', ui-sans-serif, system-ui" },
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

// Admin's own nav — deliberately excludes "repichat": the system admin doesn't
// run per-sticker conversations, they just need to see which owners are
// online (see the "Online Now" widget on the Overview page).
//
// `section` groups the flat list in the sidebar (Sidebar.tsx renders a small
// uppercase label above each run of items sharing a section); items with no
// `section` render ungrouped at the top, above every labeled group.
export const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "qr", label: "QR Codes", icon: Plus, section: "Fleet" },
  { id: "orders", label: "Orders", icon: ShoppingBag, section: "Fleet" },
  { id: "distributors", label: "Distributors", icon: Store, section: "Fleet" },
  { id: "communication", label: "Communication", icon: PhoneCall, section: "Engagement" },
  { id: "messages", label: "Message Manager", icon: Send, section: "Engagement" },
  { id: "alerts", label: "Alerts", icon: Bell, section: "Engagement" },
  { id: "users", label: "Users", icon: Users, section: "Manage" },
  { id: "products", label: "Shop Products", icon: Package, section: "Manage" },
  { id: "customize", label: "Customization", icon: Palette, section: "Manage" },
];

// Client (sticker owner) only nav item — their link into the RepiChat inbox.
export const REPICHAT_NAV_ITEM = { id: "repichat", label: "RepiChat", icon: MessageCircle };


export const EDITOR_DISPLAY = { w: 320, h: 200 };
