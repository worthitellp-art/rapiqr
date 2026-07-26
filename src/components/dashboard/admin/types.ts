export interface QrRecord {
  id: string;
  qrUrl: string;
  clientId: string;
  vehicleName: string;
  vehicleNumber: string;
  createdAt: string;
  scans: number;
  status: string;
  activationCode?: string;
  template: string;
  fg: string;
  bg: string;
}

export interface Template {
  id: number;
  name: string;
  fg: string;
  bg: string;
  logo: null | string;
  stickerPos: StickerPos;
  isPublicDefault: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface StickerPos {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SystemAlertItem {
  id: string;
  category: "emergency" | "activation" | "scan" | "fleet";
  title: string;
  subtitle: string;
  timestamp: string;
  status: "unread" | "resolved" | "active" | "info";
  qrId?: string;
  vehicleName?: string;
  vehicleNumber?: string;
  reporterPhone?: string;
  message?: string;
  location?: string;
  details?: string;
}
