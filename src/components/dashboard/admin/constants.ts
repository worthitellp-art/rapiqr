import { LayoutGrid, QrCode, PhoneCall, Bell, Users, Palette } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Jakarta Sans", css: "'Plus Jakarta Sans', ui-sans-serif, system-ui" },
  { id: "Inter", label: "Inter", css: "'Inter', ui-sans-serif, system-ui" },
  { id: "JetBrains Mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

export const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "communication", label: "Communication", icon: PhoneCall },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "users", label: "Team", icon: Users },
  { id: "customize", label: "Customization", icon: Palette },
];

export const EDITOR_DISPLAY = { w: 320, h: 200 };
