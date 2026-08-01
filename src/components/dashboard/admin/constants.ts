import { LayoutGrid, Plus, PhoneCall, Bell, Users, Palette, Store } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "distributors", label: "Distributors", icon: Store },
  { id: "qr", label: "QR Codes", icon: Plus },
  { id: "communication", label: "Communication", icon: PhoneCall },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Users", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
];


export const EDITOR_DISPLAY = { w: 320, h: 200 };
