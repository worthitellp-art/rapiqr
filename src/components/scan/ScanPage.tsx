import React, { useState, useEffect, useCallback, useRef } from "react";
import { getQrCodeByIdFromDb, activateQrInDb, sendActivationNotifications } from "../../lib/supabaseService";
import { useAuth } from "../../context/AuthContext";
import { getStickerCategoryLabel, getCategoryIcon, getCategoryLabel } from "../../stickerModules";
import PhoneInputWithCountry from "../common/PhoneInputWithCountry";
import { apiClient } from "../../lib/apiClient";
import AppLogo from "../common/AppLogo";
import groupLogo from "../../../assets/Group 1000005716.png";
import groupLogo1 from "../../../assets/Group 1000005716-1.png";
import groupLogo2 from "../../../assets/Group 1000005716-2.png";
import logoForWhBg from "../../../assets/logo for wh bg.png";
import theftIcon from "../../../assets/therft.png";
import towIcon from "../../../assets/tow.png";
import mechanicIcon from "../../../assets/mechanic.png";
import flatTireIcon from "../../../assets/flat-tire.png";
import {
  PhoneCall,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  Sparkles,
  Share2,
  Lock,
  ExternalLink,
  Navigation,
  Stethoscope,
  Wrench,
  Truck,
  Car,
  Heart,
  Ban,
  ChevronRight,
  ShieldCheck,
  MoveRight,
  ArrowLeft,
  ArrowRight,

  Activity,
  Camera,
  Upload,
  Check,
  Send,
  Mail,
  Clock,
  RefreshCw,
  Smartphone,
  Bot,
  Disc,
  Siren,
  Lightbulb,
  Battery,
  Settings,
  Trash2,
  Cpu,
  Loader2,
  BellRing
} from "lucide-react";

const WhatsAppIcon = ({ className = "w-5 h-5 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ---------------------------------------------------------------------- */
/*  Types                                                                   */
/* ---------------------------------------------------------------------- */

type Phase =
  | "validating"
  | "activation"
  | "register"
  | "location-request"
  | "location-denied"
  | "gps-off"
  | "emergency"
  | "success"
  | "error"
  | "already-activated";

interface QrData {
  id: string;
  qrUrl: string;
  vehicleName: string;
  vehicleNumber: string;
  clientId: string;
  status: string;
  template: string;
  category?: string;
}

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

/* ---------------------------------------------------------------------- */
/*  Constants & Helpers                                                     */
/* ---------------------------------------------------------------------- */

const RELATIONSHIP_PRESETS = ["Mother", "Father", "Spouse/Partner", "Sibling", "Doctor", "Friend"];

function makeContactId() {
  return `ec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidContactPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 7;
}

function getQrBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://repiqr.linkspace-service.workers.dev";
}

function getQrIdFromUrl(): string | null {
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  const urlParams = new URLSearchParams(search);
  const paramId = urlParams.get('sticker') || urlParams.get('code') || urlParams.get('qr');
  if (paramId) return decodeURIComponent(paramId);

  const directMatch = path.match(/^\/([^/]+)/);
  const hashMatch = hash.match(/#\/(qr|activate|verify)\/([^/]+)/);
  const legacyMatch = path.match(/\/(qr|activate|verify)\/([^/]+)/);

  if (directMatch && directMatch[1] !== "" && directMatch[1] !== "activate" && directMatch[1] !== "verify") {
    const id = directMatch[1];
    if (id.toUpperCase().startsWith("QR") || id.toUpperCase().startsWith("CL") || id.toUpperCase().startsWith("NQ")) {
      return decodeURIComponent(id);
    }
  }
  if (hashMatch) return decodeURIComponent(hashMatch[2]);
  if (legacyMatch) return decodeURIComponent(legacyMatch[2]);
  return null;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatCoord(n: number) {
  return n.toFixed(4);
}

const ACTIVATION_COUNTRIES: { name: string; code: string }[] = [
  { name: "India", code: "+91" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Singapore", code: "+65" },
  { name: "Australia", code: "+61" },
  { name: "Canada", code: "+1" },
  { name: "Germany", code: "+49" },
  { name: "Pakistan", code: "+92" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Nepal", code: "+977" },
];

function Security3DGraphic() {
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
      {/* Background concentric glowing rings */}
      <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md animate-pulse" />
      <div className="absolute inset-0 rounded-full border border-white/20 scale-100" />
      <div className="absolute -inset-1 rounded-full border border-white/15 scale-90" />
      <div className="absolute -inset-2.5 rounded-full border border-white/10 scale-75" />

      {/* 3D Glass Security Shield Graphic */}
      <div className="relative z-10 w-14 h-15 sm:w-16 sm:h-18 flex items-center justify-center filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="shieldGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF3B0" />
              <stop offset="35%" stopColor="#FF9900" />
              <stop offset="85%" stopColor="#D93800" />
              <stop offset="100%" stopColor="#991B00" />
            </linearGradient>
            <linearGradient id="shieldGlassShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.25)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
            </linearGradient>
            <filter id="lockGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Shield Shell */}
          <path
            d="M50 4 L88 21 C88 64 65 94 50 104 C35 94 12 64 12 21 Z"
            fill="url(#shieldGradMain)"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Glass Facet */}
          <path
            d="M50 11 L81 25 C81 59 61 85 50 93 C39 85 19 59 19 25 Z"
            fill="url(#shieldGlassShine)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
          />

          {/* 3D Glowing Lock */}
          {/* Shackle */}
          <path
            d="M40 46 V38 C40 32.48 44.48 28 50 28 C55.52 28 60 32.48 60 38 V46"
            stroke="#FFFFFF"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#lockGlow)"
          />
          {/* Body */}
          <rect x="34" y="45" width="32" height="26" rx="6" fill="#FFFFFF" filter="url(#lockGlow)" />
          {/* Keyhole Accent */}
          <circle cx="50" cy="56" r="3.5" fill="#D93800" />
          <path d="M50 58 V64" stroke="#D93800" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function EmergencySirenGraphic() {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center mx-auto mb-1">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {/* Rays */}
        <line x1="50" y1="12" x2="50" y2="4" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <line x1="26" y1="22" x2="18" y2="14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <line x1="74" y1="22" x2="82" y2="14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <line x1="14" y1="42" x2="4" y2="42" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <line x1="86" y1="42" x2="96" y2="42" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

        {/* Siren Base */}
        <rect x="22" y="68" width="56" height="12" rx="4" fill="#FFFFFF" />
        <rect x="26" y="64" width="48" height="6" fill="#E2E8F0" />

        {/* Siren Dome */}
        <path d="M 30 64 A 20 24 0 0 1 70 64 Z" fill="#EF4444" stroke="#FFFFFF" strokeWidth="3.5" />

        {/* Medical Cross */}
        <path d="M 50 45 V 59 M 43 52 H 57" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function IconTowTruck() {
  return (
    <div className="w-11 h-9 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 52 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Flatbed Tow Truck - proper realistic icon */}
        {/* Cab body */}
        <path d="M 4 18 L 7 10 C 7.5 8.5 9 8 10.5 8 H 18 V 18 H 4 Z" fill="white" />
        {/* Windshield */}
        <path d="M 7 10 L 9.5 8.5 L 10.5 8" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
        {/* Flatbed / Tray */}
        <rect x="16" y="10" width="22" height="8" rx="1" fill="white" />
        {/* Tow Boom Arm */}
        <path d="M 28 10 L 38 4 L 40 5.5 L 32 12" fill="white" />
        {/* Tow Hook */}
        <path d="M 38 4 C 40 2 42 3 41 5 L 40 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Light bar on cab */}
        <rect x="6" y="7" width="8" height="2" rx="1" fill="#FFD700" opacity="0.9" />
        {/* Wheels */}
        <circle cx="12" cy="28" r="5" fill="white" />
        <circle cx="12" cy="28" r="2.5" fill="rgba(255,255,255,0.3)" />
        <circle cx="34" cy="28" r="5" fill="white" />
        <circle cx="34" cy="28" r="2.5" fill="rgba(255,255,255,0.3)" />
        {/* Ground line */}
        <line x1="2" y1="34" x2="46" y2="34" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function IconMechanicHand() {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Crossed Wrench & Screwdriver — proper mechanic icon */}
        {/* Wrench (diagonal) */}
        <path d="M 8 32 L 24 16 L 26 18 L 10 34 Z" fill="white" />
        <path d="M 24 16 C 25 15 27 15 28 16 L 30 18 C 31 19 31 21 30 22 L 26 18" fill="white" />
        <circle cx="28" cy="18" r="2" fill="rgba(255,255,255,0.3)" />
        {/* Screwdriver (cross diagonal) */}
        <rect x="13" y="9" width="2.5" height="24" rx="1" fill="white" transform="rotate(-40, 14, 21)" />
        {/* Handle grip lines */}
        <line x1="9" y1="27" x2="11" y2="29" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-40, 10, 28)" />
        <line x1="10" y1="28" x2="12" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-40, 11, 29)" />
      </svg>
    </div>
  );
}

function IconAIFirstAid() {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Robot Head */}
        <line x1="22" y1="3" x2="22" y2="7" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="3" r="2" fill="#1A1A1A" />
        <rect x="11" y="7" width="22" height="15" rx="5" fill="#1A1A1A" />
        <circle cx="17" cy="13" r="2" fill="white" />
        <circle cx="27" cy="13" r="2" fill="white" />
        <path d="M 18 17 C 19.5 19 22.5 19 24 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <rect x="8" y="11" width="3" height="7" rx="1.5" fill="#1A1A1A" />
        <rect x="33" y="11" width="3" height="7" rx="1.5" fill="#1A1A1A" />
        {/* Medical Case */}
        <rect x="13" y="24" width="18" height="13" rx="3" fill="#1A1A1A" />
        <path d="M 18 24 V 22 C 18 21 19 20 20 20 H 24 C 25 20 26 21 26 22 V 24" stroke="#1A1A1A" strokeWidth="2" fill="none" />
        <path d="M 22 27 V 33 M 19 30 H 25" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="33" cy="27" r="4.5" fill="#1A1A1A" />
        <path d="M 33 25 V 29 M 31 27 H 35" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function IconNoParking() {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="20" cy="20" r="17" fill="white" />
        <circle cx="20" cy="20" r="15" stroke="#D92D20" strokeWidth="4.5" fill="none" />
        <line x1="9" y1="9" x2="31" y2="31" stroke="#D92D20" strokeWidth="4.5" strokeLinecap="square" />
        <text x="19.5" y="26.5" textAnchor="middle" fill="black" fontSize="19" fontWeight="900" fontFamily="Arial, sans-serif">P</text>
      </svg>
    </div>
  );
}

function IconFlatTire() {
  return (
    <div className="w-10 h-10 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Flat tire — squished/deflated at the bottom */}
        {/* Outer tire (deflated shape — oval but flat on bottom) */}
        <path d="M 22 6 C 31 6 38 12 38 20 C 38 27 34 31 28 33 C 26 34 24 34.5 22 34.5 C 20 34.5 18 34 16 33 C 10 31 6 27 6 20 C 6 12 13 6 22 6 Z" fill="white" />
        {/* Flat/deflated bottom edge — the key visual */}
        <path d="M 14 32 C 14 32 18 35 22 35 C 26 35 30 32 30 32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Inner rim */}
        <circle cx="22" cy="21" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        {/* Hub cap */}
        <circle cx="22" cy="21" r="4" fill="rgba(255,255,255,0.6)" />
        <circle cx="22" cy="21" r="1.5" fill="white" />
        {/* Tread marks */}
        <line x1="13" y1="14" x2="15" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="14" x2="31" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="20" x2="13" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="31" y1="20" x2="33" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Warning crack line */}
        <path d="M 22 14 L 22 25" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

function IconTheftDetected() {
  return (
    <div className="w-11 h-9 relative flex items-center justify-center mb-1">
      <svg viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Shield with broken lock — proper theft alert icon */}
        {/* Shield body */}
        <path d="M 24 4 L 42 11 C 42 24 34 34 24 38 C 14 34 6 24 6 11 Z" fill="white" />
        {/* Shield inner border */}
        <path d="M 24 8 L 38 14 C 38 24 31 31 24 34 C 17 31 10 24 10 14 Z" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        {/* Broken padlock — lower half (body) */}
        <rect x="16" y="20" width="16" height="12" rx="2" fill="rgba(0,0,0,0.9)" />
        {/* Keyhole */}
        <circle cx="24" cy="26" r="2.5" fill="white" />
        <path d="M 24 26.5 L 24 30" stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* Broken shackle — split in two pieces */}
        <path d="M 18 20 V 16 C 18 12.5 20.5 10 24 10 C 27.5 10 30 12.5 30 16 V 20" fill="none" stroke="rgba(0,0,0,0.9)" strokeWidth="3" strokeLinecap="round" />
        {/* Break / crack in shackle */}
        <path d="M 22 14 L 20 16 M 26 14 L 28 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Alert crack lines on the right side of shield */}
        <line x1="34" y1="16" x2="37" y2="14" stroke="rgba(232,59,46,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="20" x2="38" y2="18" stroke="rgba(232,59,46,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="34" y1="24" x2="36" y2="22" stroke="rgba(232,59,46,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Main Light Theme Component                                             */
/* ---------------------------------------------------------------------- */

export default function ScanPage({ onBack, onGoToDashboard }: { onBack: () => void; onGoToDashboard?: () => void }) {
  const { profile, updatePhoneNumber } = useAuth();
  const [phase, setPhase] = useState<Phase>("validating");
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [alertSent, setAlertSent] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [activatingQr, setActivatingQr] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<"none" | "emergency-main" | "mechanical" | "medical" | "towing" | "family" | "parking" | "headlights" | "theft" | "flat-tire">("none");
  const [towingImage, setTowingImage] = useState<string | null>(null);
  const [flatTireImage, setFlatTireImage] = useState<string | null>(null);

  // Quick-issue WhatsApp/SMS dispatch (Parking / Headlights / Theft) — fired automatically
  // the moment the visitor taps the quick-action tile, using the real backend alert route
  // (same one the "Message Vehicle Owner" box uses) so the owner is actually notified,
  // instead of the old fake localStorage + alert() popup.
  const [quickAlertStatus, setQuickAlertStatus] = useState<Record<string, { sending: boolean; sent: boolean; simulated: boolean }>>({});

  // Masked calling — replaces every direct `tel:` link to the owner (or one of
  // their emergency contacts) with a server-brokered Twilio bridge call. The
  // real number is resolved server-side from qrId and never sent to, or shown
  // in, the browser; Twilio rings the visitor first, then bridges to the real
  // number with the shared helpline number as caller ID on both legs.
  const [maskedCallTarget, setMaskedCallTarget] = useState<{ label: string; contactName?: string } | null>(null);
  const [maskedCallPhone, setMaskedCallPhone] = useState("");
  const [maskedCallBusy, setMaskedCallBusy] = useState(false);
  const [maskedCallResult, setMaskedCallResult] = useState<{ success: boolean; message: string } | null>(null);

  const openMaskedCall = (label: string, contactName?: string) => {
    setMaskedCallTarget({ label, contactName });
    setMaskedCallPhone("");
    setMaskedCallResult(null);
  };

  const submitMaskedCall = async () => {
    if (!qrData || !maskedCallTarget) return;
    const digits = maskedCallPhone.replace(/\D/g, "");
    if (digits.length < 7) {
      setMaskedCallResult({ success: false, message: "Enter a valid phone number to receive the call on." });
      return;
    }
    setMaskedCallBusy(true);
    setMaskedCallResult(null);
    try {
      const res = await apiClient.twilio.callBridge({
        qrId: qrData.id,
        visitorPhone: maskedCallPhone,
        contactName: maskedCallTarget.contactName,
      });
      setMaskedCallResult({
        success: Boolean(res.success),
        message: res.success ? (res.message || "Your phone will ring shortly.") : (res.error || "Couldn't start the call — try again."),
      });
    } catch (err: any) {
      setMaskedCallResult({ success: false, message: err.message || "Couldn't reach the server — try again." });
    } finally {
      setMaskedCallBusy(false);
    }
  };

  // Manual full-colored WhatsApp alert dispatch for all features
  const sendWhatsAppAlertManually = async (alertType: string, defaultMessage: string, targetPhone?: string) => {
    if (!qrData) return;
    const phoneToUse = targetPhone || (qrData as any).ownerPhone || (qrData as any).phone || (getTowingContacts().find((c) => c.primary)?.phone) || (getTowingContacts()[0]?.phone) || "";
    const locationText = location ? `\n📍 Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : "";
    const fullMessage = `*RapiQR Alert: ${alertType}*\n🚗 Vehicle: ${qrData.vehicleName} (${qrData.vehicleNumber})\n\n💬 Message: ${defaultMessage}${locationText}`;

    // Send backend log
    try {
      await apiClient.alerts.createAlert({
        qrId: qrData.id,
        qrUrl: qrData.qrUrl,
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        accuracy: location?.accuracy || 0,
        deviceId: navigator.userAgent.slice(0, 40),
        timestamp: new Date().toISOString(),
        message: fullMessage,
        vehicleName: qrData.vehicleName,
        vehicleNumber: qrData.vehicleNumber,
      });
    } catch {
      /* ignore non-critical backend logger failure */
    }

    // Launch WhatsApp
    const cleanPhone = phoneToUse.replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
  };

  // Registration form fields (after activation code is validated)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBloodGroup, setRegBloodGroup] = useState("O+");
  const [regAllergies, setRegAllergies] = useState("");
  const [regAddress, setRegAddress] = useState("");

  // Emergency contacts — collected on the "register" step after identity verification,
  // before the sticker is finalized as active. At least one is required to continue,
  // but the whole step can be skipped (optional but strongly encouraged).
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: makeContactId(), name: "", relationship: "", phone: "" },
  ]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  // Whether identity was OTP-verified vs. a limited/email-pending path — carried from the
  // activation step into the register step, then used by the final activation submit.
  const [pendingVerified, setPendingVerified] = useState(true);

  // Activation country (limited list with dial codes)
  const [regCountry, setRegCountry] = useState("+91");

  // OpenRouter AI Chat Assistant state
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '🤖 Hello! I am your RapiQR Emergency AI Assistant powered by OpenRouter. Ask me anything about wrong parking, roadside help, or reaching the vehicle owner.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll AI chat to bottom when new messages arrive
  useEffect(() => {
    if (aiChatOpen) {
      aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, aiLoading, aiChatOpen]);

  // ── Authentication choice (multi-method: Google / Phone+OTP / Email) ──
  const [authChoice, setAuthChoice] = useState<"google" | "phone" | "email">("phone");
  const [regEmail, setRegEmail] = useState("");
  const [googleAuthed, setGoogleAuthed] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [phoneMatchesBuyer, setPhoneMatchesBuyer] = useState(false);

  // OTP verification step state (two-step activation flow)
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  // Testing purposes: OTP is fixed to "0000" until real SMS delivery is wired up.
  const [generatedOtp, setGeneratedOtp] = useState("0000");

  // OTP security: 5-min validity, 5 attempts, resend cooldown
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(300);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);
  const [otpResendIn, setOtpResendIn] = useState(0);

  const maskPhone = (full: string) => {
    const d = full.replace(/\D/g, "");
    if (d.length < 7) return full;
    return `${full.slice(0, 3)}-XXXXX-${d.slice(-4)}`;
  };

  // Prefill owner phone/name/email from the most recent purchase order (decision branch)
  useEffect(() => {
    try {
      const orders = JSON.parse(localStorage.getItem("repiqr-orders") || localStorage.getItem("namoqr-orders") || "[]");
      if (orders.length > 0) {
        // Orders are persisted with unshift → index 0 is the newest purchase
        const last = orders[0];
        if (last?.phone) {
          const digits = String(last.phone).replace(/\D/g, "");
          setBuyerPhone(digits);
          if (digits.length >= 10) {
            const local = digits.slice(-10);
            setRegPhone((prev) => prev || local);
          }
        }
        if (last?.name) setRegName((prev) => prev || String(last.name));
        if (last?.email) setRegEmail((prev) => prev || String(last.email));
      }
    } catch { /* ignore */ }
  }, []);

  // Keep the buyer-match flag in sync with the entered phone
  useEffect(() => {
    const entered = regPhone.replace(/\D/g, "").replace(/^0+/, "");
    setPhoneMatchesBuyer(
      !!buyerPhone && entered.length >= 10 && buyerPhone.slice(-10) === entered.slice(-10)
    );
  }, [regPhone, buyerPhone]);

  // OTP 5-minute validity countdown
  useEffect(() => {
    if (!otpStep) return;
    const t = setInterval(() => setOtpTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpStep]);

  // Resend cooldown countdown
  useEffect(() => {
    if (otpResendIn <= 0) return;
    const t = setInterval(() => setOtpResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpResendIn]);

  const handleSendOtp = () => {
    if (!qrData) return;
    setActivationError(null);

    if (!regName.trim()) {
      setActivationError("Please enter your full name.");
      return;
    }
    if (!regPhone.trim() || regPhone.trim().replace(/\D/g, "").length < 7) {
      setActivationError("Please enter a valid phone number.");
      return;
    }

    // Decision branch: phone matches the purchase phone → skip OTP entirely
    if (phoneMatchesBuyer) {
      proceedToEmergencyContacts(true);
      return;
    }

    // Demo OTP — a real integration would send this via SMS.
    setGeneratedOtp("0000");
    setOtpInput("");
    setEmailSent(false); // fresh phone flow — never inherit the email variant
    setOtpSentTo(maskPhone(`${regCountry} ${regPhone}`));
    setOtpTimeLeft(300);
    setOtpAttemptsLeft(5);
    setOtpResendIn(30);
    setActivationError(null);
    setOtpStep(true);
  };

  const handleResendOtp = () => {
    if (otpResendIn > 0) return;
    setGeneratedOtp("0000");
    setOtpInput("");
    setActivationError(null);
    setOtpTimeLeft(300);
    setOtpAttemptsLeft(5);
    setOtpResendIn(30);
  };

  const handleSendEmailCode = () => {
    if (!qrData) return;
    setActivationError(null);

    if (!regName.trim()) {
      setActivationError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setActivationError("Please enter a valid email address.");
      return;
    }

    // Simulated email — a real integration would send a magic link / code.
    setGeneratedOtp("0000");
    setOtpInput("");
    setOtpTimeLeft(300);
    setOtpAttemptsLeft(5);
    setOtpResendIn(30);
    setEmailSent(true);
    setActivationError(null);
    setOtpStep(true);
  };

  const handleContinueWithGoogle = () => {
    if (!qrData) return;
    setGoogleLoading(true);
    setActivationError(null);
    setTimeout(() => {
      setGoogleLoading(false);
      setGoogleAuthed(true);
      if (!regName.trim()) setRegName("Karan Sharma"); // demo Google profile
    }, 1200);
  };

  const handleVerifyOtpAndActivate = () => {
    if (!qrData) return;
    setActivationError(null);

    if (otpTimeLeft <= 0) {
      setActivationError("This code has expired. Please resend a new code.");
      return;
    }
    if (otpAttemptsLeft <= 0) {
      setActivationError("Too many failed attempts. Please resend a new code.");
      return;
    }
    if (otpInput.trim() !== generatedOtp) {
      const left = otpAttemptsLeft - 1;
      setOtpAttemptsLeft(left);
      setActivationError(left > 0 ? `Invalid code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many failed attempts. Please resend a new code.");
      return;
    }

    proceedToEmergencyContacts(true);
  };

  const handleContinueLimited = () => {
    proceedToEmergencyContacts(false);
  };

  // Identity step is done (however it was verified) — move to the Emergency Contacts
  // step before finalizing activation.
  const proceedToEmergencyContacts = (verified: boolean) => {
    setPendingVerified(verified);
    setContactsError(null);
    setPhase("register");
  };

  const handleSendAiMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInput;
    if (!promptToSend.trim() || aiLoading) return;

    const userMsg = { role: 'user' as const, content: promptToSend };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated);
    if (!customPrompt) setAiInput('');
    setAiLoading(true);

    // Routed through the backend so the OpenRouter API key never ships to the browser
    let reply = "";
    try {
      const res = await apiClient.ai.chat(updated, qrData?.vehicleNumber);
      if (res?.reply) reply = res.reply;
    } catch {
      // fall through to default reply below
    }

    if (!reply) {
      reply = "I am RapiQR Safety AI Assistant. How can I help you contact the vehicle owner or arrange emergency help?";
    }

    setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setAiLoading(false);
  };

  const [customMsgSending, setCustomMsgSending] = useState(false);
  const [customMsgSentBanner, setCustomMsgSentBanner] = useState<string | null>(null);

  const handleSendCustomMessage = async (presetText?: string) => {
    const textToSend = presetText || visitorMessage;
    if (!textToSend.trim() || customMsgSending) return;

    setCustomMsgSending(true);
    setCustomMsgSentBanner(null);

    try {
      if (qrData) {
        const payload = {
          qrId: qrData.id,
          qrUrl: qrData.qrUrl,
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          accuracy: location?.accuracy || 0,
          deviceId: navigator.userAgent.slice(0, 40),
          timestamp: new Date().toISOString(),
          message: textToSend,
          vehicleName: qrData.vehicleName,
          vehicleNumber: qrData.vehicleNumber,
        };

        // 1. Save alert locally
        const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
        alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
        localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));

        // 2. Post alert to backend API server (triggers server logs & real Twilio SMS to the owner, if configured)
        let smsSent = false;
        try {
          const res = await apiClient.alerts.createAlert(payload);
          smsSent = Boolean(res.smsResult?.sent);
        } catch { /* alert still saved to localStorage above; server may be unreachable */ }

        const preview = `"${textToSend.slice(0, 35)}${textToSend.length > 35 ? '...' : ''}"`;
        setCustomMsgSentBanner(smsSent ? `SMS & Alert dispatched to owner: ${preview}` : `Alert logged for owner: ${preview}`);
        setVisitorMessage("");

        setTimeout(() => {
          setCustomMsgSentBanner(null);
        }, 6000);
      }
    } finally {
      setCustomMsgSending(false);
    }
  };

  // Share Location — dispatches a real backend alert (so it lands in the owner's
  // Client Dashboard Alert History, not just a localStorage stub + blocking alert()
  // popup) and notifies the owner AND their registered emergency/family contacts.
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationShareBanner, setLocationShareBanner] = useState<string | null>(null);

  const handleShareLocation = async () => {
    if (!location) {
      requestLocation();
      return;
    }
    if (!qrData || locationSharing) return;

    const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    window.open(mapsUrl);

    setLocationSharing(true);
    setLocationShareBanner(null);
    try {
      const res = await apiClient.alerts.createAlert({
        qrId: qrData.id,
        qrUrl: qrData.qrUrl,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        deviceId: navigator.userAgent.slice(0, 40),
        timestamp: new Date().toISOString(),
        message: `EMERGENCY GPS LOCATION: ${mapsUrl}`,
        vehicleName: qrData.vehicleName,
        vehicleNumber: qrData.vehicleNumber,
      });
      const notifiedOwner = Boolean(res.smsResult?.sent || res.whatsappResult?.sent);
      const contactsNotified = res.contactsNotified || 0;
      if (notifiedOwner || contactsNotified > 0) {
        setLocationShareBanner(`Location sent — owner${contactsNotified > 0 ? ` & ${contactsNotified} emergency contact${contactsNotified === 1 ? "" : "s"}` : ""} notified.`);
      } else {
        setLocationShareBanner("Location saved to the owner's alert history.");
      }
    } catch {
      setLocationShareBanner("Couldn't reach the server — location opened in Maps only.");
    } finally {
      setLocationSharing(false);
      setTimeout(() => setLocationShareBanner(null), 6000);
    }
  };

  /* ---- Get Admin Provided Contact Numbers ---- */
  const getTowingContacts = (filterCategory?: string) => {
    if (!qrData) return [];
    const storedQrList = JSON.parse(localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist") || "[]");
    const storedClientStickers = JSON.parse(localStorage.getItem("repiqr-client-stickers") || localStorage.getItem("namoqr-client-stickers") || "[]");
    const adminHelplines = JSON.parse(localStorage.getItem("repiqr-helplines") || localStorage.getItem("namoqr-helplines") || "[]");

    const allRecords = [...storedQrList, ...storedClientStickers];
    const fullRecord = allRecords.find((q: any) => q.id === qrData.id || q.clientId === qrData.clientId || q.qrCodeId === qrData.id || q.code === qrData.id) || {};
    const contacts: { label: string; phone: string; role: string; primary?: boolean; category?: string; name?: string }[] = [];

    // 1. Registered Vehicle Owner Contact from Admin/DB
    const primaryPhone = fullRecord.phone || fullRecord.ownerPhone || (qrData.vehicleNumber && !qrData.vehicleNumber.startsWith("REG-") ? qrData.vehicleNumber : "");
    if (primaryPhone && primaryPhone.trim() && !primaryPhone.startsWith("REG-")) {
      contacts.push({
        label: "Registered Owner Contact",
        phone: primaryPhone,
        role: "Vehicle Owner / Primary",
        primary: true,
      });
    }

    // 2. Owner-provided Emergency Contacts (collected during sticker activation or client dashboard)
    const ownerContacts: any[] =
      fullRecord.contacts ||
      fullRecord.emergencyContacts ||
      fullRecord.details?.emergencyContacts ||
      (qrData as any).contacts ||
      (qrData as any).emergencyContacts ||
      (qrData as any).details?.emergencyContacts ||
      [];

    if (ownerContacts.length > 0) {
      ownerContacts.forEach((c: any) => {
        if (!c.phone) return;
        contacts.push({
          label: c.relationship ? `${c.name} (${c.relationship})` : c.name || "Emergency Contact",
          phone: c.phone,
          role: "Family / Emergency Contact",
          name: c.name,
        });
      });
    } else if (fullRecord.secondaryPhone || fullRecord.altPhone) {
      // Legacy records activated before multi-contact support.
      contacts.push({
        label: fullRecord.secondaryName ? `${fullRecord.secondaryName} (Emergency)` : "Secondary Emergency Contact",
        phone: fullRecord.secondaryPhone || fullRecord.altPhone,
        role: "Family / Emergency Contact",
      });
    }

    // 3. Roadside Assistance Phone from Vehicle DB
    if (fullRecord.roadsidePhone) {
      contacts.push({
        label: "Roadside Helpline (Vehicle)",
        phone: fullRecord.roadsidePhone,
        role: "Support & Towing Helpline",
      });
    }

    // 4. Admin-configured Provider Helplines (from Admin Dashboard Sidebar Menu)
    const activeAdminProviders = adminHelplines.filter((p: any) => p.active !== false);
    activeAdminProviders.forEach((p: any) => {
      if (!filterCategory || p.category === filterCategory || p.category === "General" || filterCategory === "Towing") {
        contacts.push({
          label: `${p.label}`,
          phone: p.phone,
          role: `Admin Provider (${p.category})`,
          category: p.category,
        });
      }
    });

    if (contacts.length === 0 && qrData.vehicleNumber) {
      contacts.push({
        label: "Registered Owner Contact",
        phone: qrData.vehicleNumber,
        role: "Vehicle Owner / Primary",
        primary: true,
      });

    }

    return contacts;
  };

  /* ---- Get ONLY Admin Communication Page Contacts ---- */
  const getAdminContacts = (filterCategory?: string) => {
    const adminHelplines = JSON.parse(localStorage.getItem("namoqr-helplines") || "[]");
    const active = adminHelplines.filter((p: any) => p.active !== false);
    if (!filterCategory) return active.map((p: any) => ({ label: p.label, phone: p.phone, role: p.category, category: p.category }));
    return active
      .filter((p: any) => p.category === filterCategory)
      .map((p: any) => ({ label: p.label, phone: p.phone, role: p.category, category: p.category }));
  };
  const [pingsSent, setPingsSent] = useState(0);
  const maxPings = 7;
  const pingsSentRef = useRef(0);
  const gpsWatchRef = useRef<number | null>(null);

  /* ---- Cleanup GPS watcher on unmount ---- */
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, []);

  /* ---- Geolocation Request & Auto-Fetch ---- */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPhase("gps-off");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo: GeoLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        };
        setLocation(geo);
        setPhase("emergency");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPhase("location-denied");
        } else {
          setPhase("gps-off");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  /* ---- QR Direct Lookup (no loading screen) ---- */
  useEffect(() => {
    const qrId = getQrIdFromUrl();
    if (!qrId) {
      setErrorMsg("No QR code ID found in URL.");
      setPhase("error");
      return;
    }

    const cleanQrId = qrId.trim().toUpperCase();
    const stored = localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist");
    const list: any[] = stored ? JSON.parse(stored) : [];

    let found = list.find(
      (q: any) =>
        q.id?.toUpperCase() === cleanQrId ||
        (q.clientId && q.clientId.toUpperCase() === cleanQrId) ||
        q.qrUrl?.toUpperCase().includes(cleanQrId)
    );

    if (!found) {
      // Try DB lookup (async, but we'll run it and handle result)
      getQrCodeByIdFromDb(cleanQrId).then((dbRecord) => {
        if (dbRecord) {
          const dbFound = {
            id: dbRecord.id,
            clientId: dbRecord.client_id,
            status: dbRecord.status,
            vehicleName: `Vehicle (${dbRecord.id})`,
            vehicleNumber: `REG-${dbRecord.id.slice(-4)}`,
            template: dbRecord.template_name || "Default",
            category: dbRecord.category,
          };
          resolveQr(dbFound);
        } else {
          // Universal fallback
          tryFallback(cleanQrId);
        }
      }).catch(() => {
        tryFallback(cleanQrId);
      });
    } else {
      resolveQr(found);
    }

    function resolveQr(record: any) {
      const data = {
        id: record.id,
        qrUrl: `${getQrBaseUrl()}/${record.id}`,
        vehicleName: record.vehicleName || `Vehicle (${record.id})`,
        vehicleNumber: record.vehicleNumber || `REG-${record.id.slice(-4)}`,
        clientId: record.clientId || record.id,
        status: record.status || "inactive",
        template: record.template || "Default",
        category: record.category,
      };
      setQrData(data);

      // First-time scan → show the registration/activation form; already active → emergency page
      if (record.status === "inactive") {
        setPhase("activation");
      } else {
        setPhase("emergency");
      }
    }

    function tryFallback(cleanId: string) {
      if (cleanId.startsWith("QR") || cleanId.startsWith("CL")) {
        const fallback = {
          id: cleanId,
          clientId: cleanId.startsWith("CL") ? cleanId : `CL${cleanId.replace(/^QR/, "")}`,
          vehicleName: `RapiQR Safety Tag (${cleanId})`,
          vehicleNumber: `REG-${cleanId.slice(-4)}`,
          status: "inactive",
          template: "Default",
        };
        const updatedList = [fallback, ...list];
        localStorage.setItem("repiqr-qrlist", JSON.stringify(updatedList));
        localStorage.setItem("namoqr-qrlist", JSON.stringify(updatedList));
        resolveQr(fallback);
      } else {
        setErrorMsg(`QR "${qrId}" not found or invalid.`);
        setPhase("error");
      }
    }
  }, [requestLocation]);

  /* ---- Registration Form Submit (after activation code validated) ---- */
  const handleRegisterSubmit = async (verified = true) => {
    if (!qrData) return;
    if (!regName.trim() || (!regPhone.trim() && !regEmail.trim())) {
      setActivationError("Please enter your name and phone number.");
      return;
    }

    setActivatingQr(true);

    const fullPhone = regPhone.trim().startsWith("+")
      ? regPhone.trim()
      : regPhone.trim()
        ? `${regCountry}${regPhone.trim().replace(/\s+/g, "")}`
        : regEmail.trim();

    const validContacts = emergencyContacts
      .filter((c) => c.name.trim() && isValidContactPhone(c.phone))
      .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim() || "Contact", phone: c.phone.trim() }));

    // Save to Supabase — must actually succeed before the UI is allowed to claim success
    // (a prior version fired this without awaiting it, so a failed write still showed "Activated").
    const activationResult = await activateQrInDb({
      qrId: qrData.id,
      category: qrData.category || "car",
      ownerName: regName.trim(),
      ownerPhone: fullPhone,
      ownerEmail: regEmail.trim(),
      emergencyContacts: validContacts,
      bloodGroup: regBloodGroup,
      allergies: regAllergies.trim(),
      address: regAddress.trim(),
      userId: profile?.id,
    });

    if (!activationResult) {
      setActivatingQr(false);
      setActivationError("We couldn't save your activation to the server. Please check your connection and try again.");
      return;
    }

    // Auto-link this phone number to the logged-in account (if any) so the sticker
    // shows up on their Client Dashboard the next time they sign in.
    if (profile && regPhone.trim() && profile.phoneNumber !== fullPhone) {
      updatePhoneNumber(fullPhone).catch(() => { /* non-blocking */ });
    }

    setTimeout(() => {
      // Also save to localStorage as fallback
      const stored = localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);

      const registrationData = {
        ownerName: regName.trim(),
        ownerPhone: fullPhone,
        email: regEmail.trim(),
        verification: verified ? "verified" : "pending",
        emergencyContacts: validContacts,
        bloodGroup: regBloodGroup,
        allergies: regAllergies.trim(),
        address: regAddress.trim(),
        activatedAt: new Date().toISOString(),
      };

      if (idx >= 0) {
        list[idx].status = "active";
        list[idx].activatedAt = registrationData.activatedAt;
        list[idx].ownerName = registrationData.ownerName;
        list[idx].ownerPhone = registrationData.ownerPhone;
        list[idx].email = registrationData.email;
        list[idx].verification = registrationData.verification;
        list[idx].emergencyContacts = registrationData.emergencyContacts;
        list[idx].bloodGroup = registrationData.bloodGroup;
        list[idx].allergies = registrationData.allergies;
        list[idx].address = registrationData.address;
        list[idx].visitorMessage = "Self-activated via code";
        localStorage.setItem("repiqr-qrlist", JSON.stringify(list));
        localStorage.setItem("namoqr-qrlist", JSON.stringify(list));
      } else {
        const newRecord = {
          id: qrData.id,
          qrUrl: qrData.qrUrl,
          clientId: qrData.clientId,
          vehicleName: qrData.vehicleName,
          vehicleNumber: qrData.vehicleNumber,
          status: "active",
          template: qrData.template,
          category: qrData.category,
          ...registrationData,
        };
        localStorage.setItem("repiqr-qrlist", JSON.stringify([newRecord, ...list]));
        localStorage.setItem("namoqr-qrlist", JSON.stringify([newRecord, ...list]));
      }

      setQrData((prev) => (prev ? { ...prev, status: "active" } : null));
      setActivatingQr(false);

      // Fire-and-forget: confirmation + sample "what responders see" test-scan email.
      sendActivationNotifications({
        qrId: qrData.id,
        ownerName: regName.trim(),
        ownerEmail: regEmail.trim() || undefined,
        category: qrData.category,
      }).catch(() => { /* non-blocking */ });

      setPhase("success");
    }, 800);
  };

  /* ---- Emergency Contacts step: add / edit / remove rows ---- */
  const addEmergencyContactRow = () => {
    setEmergencyContacts((prev) => [...prev, { id: makeContactId(), name: "", relationship: "", phone: "" }]);
  };

  const updateEmergencyContact = (id: string, field: "name" | "relationship" | "phone", value: string) => {
    setContactsError(null);
    setEmergencyContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  // Browser Contact Picker API (Android Chrome only) — progressive enhancement, no-op
  // (button hidden) on unsupported browsers/desktop.
  const isContactPickerSupported =
    typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;

  const handleImportContact = async () => {
    try {
      const nav = navigator as any;
      const picked = await nav.contacts.select(["name", "tel"], { multiple: true });
      if (!picked?.length) return;
      const imported: EmergencyContact[] = picked
        .filter((p: any) => p.tel?.[0])
        .map((p: any) => ({
          id: makeContactId(),
          name: (p.name?.[0] || "").trim(),
          relationship: "",
          phone: (p.tel?.[0] || "").trim(),
        }));
      if (!imported.length) return;
      setEmergencyContacts((prev) => {
        const blankOnly = prev.length === 1 && !prev[0].name.trim() && !prev[0].phone.trim();
        return blankOnly ? imported : [...prev, ...imported];
      });
      setContactsError(null);
    } catch {
      // User cancelled the picker or it's unavailable — nothing to do.
    }
  };

  // Require at least one valid contact to continue; "Skip for now" bypasses this.
  const handleFinishEmergencyContacts = () => {
    const validContacts = emergencyContacts.filter((c) => c.name.trim() && isValidContactPhone(c.phone));
    if (validContacts.length === 0) {
      setContactsError("Add at least one contact (name + valid phone), or click Skip for now.");
      return;
    }
    handleRegisterSubmit(pendingVerified);
  };

  // Skips the step entirely — handleRegisterSubmit already drops any incomplete rows,
  // so this simply proceeds without requiring a valid contact first.
  const handleSkipEmergencyContacts = () => {
    setContactsError(null);
    handleRegisterSubmit(pendingVerified);
  };

  /* ---- Automatic Location Ping Dispatch (Every 5s, 7 times) ---- */
  useEffect(() => {
    if (phase !== "emergency" || !qrData || !location) return;

    const dispatchPing = (index: number, currentLoc: GeoLocation) => {
      const payload = {
        qrId: qrData.id,
        qrUrl: qrData.qrUrl,
        latitude: currentLoc.lat,
        longitude: currentLoc.lng,
        accuracy: currentLoc.accuracy,
        deviceId: navigator.userAgent.slice(0, 40),
        timestamp: new Date().toISOString(),
        message: `Auto Emergency Ping #${index}`,
        vehicleName: qrData.vehicleName,
        vehicleNumber: qrData.vehicleNumber,
        pingIndex: index,
        totalPings: maxPings,
      };

      const alerts = JSON.parse(localStorage.getItem("repiqr-alerts") || localStorage.getItem("namoqr-alerts") || "[]");
      alerts.unshift({ ...payload, id: Date.now() + index, status: "sent" });
      localStorage.setItem("repiqr-alerts", JSON.stringify(alerts));
      localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));

      const stored = localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);
      if (idx >= 0) {
        list[idx].scans = (list[idx].scans || 0) + 1;
        list[idx].lastScannedAt = new Date().toISOString();
        list[idx].lastLocation = { lat: currentLoc.lat, lng: currentLoc.lng };
        localStorage.setItem("repiqr-qrlist", JSON.stringify(list));
        localStorage.setItem("namoqr-qrlist", JSON.stringify(list));
      }
    };

    // 1st Ping sent immediately on entering emergency phase
    if (pingsSentRef.current === 0) {
      pingsSentRef.current = 1;
      setPingsSent(1);
      dispatchPing(1, location);
    }

    // Auto-ping every 5 seconds until maxPings (7) reached
    const timer = setInterval(() => {
      if (pingsSentRef.current < maxPings) {
        pingsSentRef.current += 1;
        const count = pingsSentRef.current;
        setPingsSent(count);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const freshGeo: GeoLocation = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy),
                timestamp: new Date().toISOString(),
              };
              setLocation(freshGeo);
              dispatchPing(count, freshGeo);
            },
            () => {
              dispatchPing(count, location);
            },
            { enableHighAccuracy: true, timeout: 4000 }
          );
        } else {
          dispatchPing(count, location);
        }
      } else {
        clearInterval(timer);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [phase, qrData, location]);

  return (
    <div className="min-h-screen bg-[#F8F9FE] text-gray-900 flex flex-col items-center justify-start font-sans relative selection:bg-yellow-500 selection:text-white overflow-x-hidden">
      {/* Light Theme Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 pointer-events-none opacity-30 z-0"
        style={{ background: 'radial-gradient(ellipse at top, rgba(234,179,8,0.15), transparent 70%)' }}
      />



      {/* Main Light Visitor Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-2 pb-5 z-10 flex flex-col justify-center items-center">
        {/* ============ ACTIVATION — Enter Activation Code ============ */}
        {phase === "activation" && qrData && (
          <div className="w-full max-w-sm sm:max-w-md mx-auto animate-fade-in">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-100">

              {/* ——— Compact Header ——— */}
              <div className="relative bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 px-5 py-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/40 text-base">
                    {getCategoryIcon((qrData.category || "car") as any)}
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Activate {getStickerCategoryLabel(qrData.category) || getCategoryLabel((qrData.category || "car") as any) || "Sticker"}
                  </h1>
                </div>
                <p className="mt-0.5 text-center text-[11px] sm:text-xs text-slate-800 font-medium">
                  Enter your details to activate this QR tag
                </p>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 pointer-events-none" />
              </div>

              {/* ——— Body Content ——— */}
              <div className="px-4 sm:px-5 pb-4 pt-3.5 space-y-3">
                {!otpStep ? (
                  <>
                    {/* ── AUTH METHOD CHOICE ── */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Verify with
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setAuthChoice("google"); setEmailSent(false); setActivationError(null); }}
                          className={`flex h-9 items-center justify-center gap-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${authChoice === "google" ? "border-amber-400 bg-amber-50 text-slate-900 ring-2 ring-amber-200" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
                            <path fill="#FBBC05" d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.32 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                          </svg>
                          Google
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthChoice("phone"); setEmailSent(false); setActivationError(null); }}
                          className={`flex h-9 items-center justify-center gap-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${authChoice === "phone" ? "border-amber-400 bg-amber-50 text-slate-900 ring-2 ring-amber-200" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          <Smartphone size={13} />
                          Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthChoice("email"); setEmailSent(false); setActivationError(null); }}
                          className={`flex h-9 items-center justify-center gap-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${authChoice === "email" ? "border-amber-400 bg-amber-50 text-slate-900 ring-2 ring-amber-200" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          <Mail size={13} />
                          Email
                        </button>
                      </div>
                    </div>

                    {/* ── DETAILS ── */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); setActivationError(null); }}
                        placeholder="Enter your full name"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-amber-400 font-medium"
                      />
                    </div>

                    {authChoice !== "email" ? (
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {authChoice === "google" ? "Owner Phone Number *" : "Phone Number *"}
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            value={regCountry}
                            onChange={(e) => { setRegCountry(e.target.value); setActivationError(null); }}
                            title="Country dial code"
                            className="h-10 w-20 flex-shrink-0 rounded-xl border border-slate-200 px-1 text-xs outline-none focus:border-amber-400 font-bold bg-white"
                          >
                            {ACTIVATION_COUNTRIES.map((c) => (
                              <option key={`${c.code}-${c.name}`} value={c.code}>{c.code}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => { setRegPhone(e.target.value); setActivationError(null); }}
                            placeholder="98765 43210"
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-amber-400 font-mono font-medium"
                          />
                        </div>
                        {phoneMatchesBuyer && authChoice === "phone" && (
                          <p className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            Matches purchase phone — instant activation available.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => { setRegEmail(e.target.value); setActivationError(null); }}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-amber-400 font-medium"
                        />
                      </div>
                    )}

                    {activationError && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                        <AlertTriangle size={12} />
                        {activationError}
                      </p>
                    )}

                    {/* ── PRIMARY ACTION ── */}
                    {authChoice === "google" ? (
                      <button
                        onClick={googleAuthed ? () => proceedToEmergencyContacts(true) : handleContinueWithGoogle}
                        disabled={googleLoading}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] cursor-pointer text-xs disabled:opacity-60"
                      >
                        {googleLoading ? (
                          <span>Connecting to Google…</span>
                        ) : googleAuthed ? (
                          <><ShieldCheck size={14} /> Activate Sticker (Google Verified)</>
                        ) : (
                          <>Continue with Google</>
                        )}
                      </button>
                    ) : phoneMatchesBuyer && authChoice === "phone" ? (
                      <button
                        onClick={() => proceedToEmergencyContacts(true)}
                        disabled={activatingQr}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer text-xs disabled:opacity-60"
                      >
                        {activatingQr ? (
                          <span>Activating…</span>
                        ) : (
                          <><ShieldCheck size={14} /> Activate Instantly</>
                        )}
                      </button>
                    ) : authChoice === "email" ? (
                      <button
                        onClick={handleSendEmailCode}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] cursor-pointer text-xs"
                      >
                        <Send size={14} /> Send Verification Email
                      </button>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] cursor-pointer text-xs"
                      >
                        <Send size={14} /> Send OTP &amp; Verify
                      </button>
                    )}
                  </>
                ) : (
                  /* OTP / EMAIL VERIFICATION STEP */
                  <div className="space-y-2.5 bg-slate-50/90 border border-slate-200 rounded-xl p-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 size={15} />
                        <span>{emailSent ? "Email Verification" : "OTP Verification"}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{otpAttemptsLeft} attempts left</span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Code sent to <strong className="font-mono text-slate-900">{emailSent ? regEmail : (otpSentTo || `${regCountry} ${regPhone}`)}</strong> to activate{" "}
                      <strong className="font-mono text-amber-600">{qrData.id}</strong>.
                    </p>

                    {/* Expiry & Test Code Compact Bar */}
                    <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-amber-700" />
                        <span className="text-[10px] font-bold">
                          {otpTimeLeft > 0 ? `Code expires in ${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, "0")}` : "Code expired"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Test Code:</span>
                        <span className="font-mono font-extrabold text-[11px] bg-amber-200/90 px-1.5 py-0.5 rounded text-amber-950">0000</span>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setActivationError(null); }}
                        placeholder="0000"
                        className="h-10 w-full rounded-xl border border-slate-300 px-3 text-center font-mono text-base font-bold tracking-widest outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>

                    {/* Resend + switch method */}
                    <div className="flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpResendIn > 0}
                        className="flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw size={11} />
                        {otpResendIn > 0 ? `Resend code in ${otpResendIn}s` : "Resend code"}
                      </button>
                      {!emailSent && (
                        <button
                          type="button"
                          onClick={() => { setOtpStep(false); setAuthChoice("email"); setActivationError(null); }}
                          className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Forgot phone? Use email instead
                        </button>
                      )}
                    </div>

                    {activationError && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                        <AlertTriangle size={12} />
                        {activationError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setOtpStep(false)}
                        className="px-3.5 h-9 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyOtpAndActivate}
                        disabled={activatingQr}
                        className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {activatingQr ? (
                          <span>Activating…</span>
                        ) : (
                          <><ShieldCheck size={14} /> Verify &amp; Activate Sticker</>
                        )}
                      </button>
                    </div>

                    {emailSent && (
                      <button
                        type="button"
                        onClick={handleContinueLimited}
                        className="w-full h-9 rounded-lg border border-dashed border-slate-300 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-slate-700 cursor-pointer"
                      >
                        <Lock size={11} className="mr-1 inline" /> Check email link — continue in limited mode
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ EMERGENCY CONTACTS (after identity verified, before final activation) ============ */}
        {phase === "register" && qrData && (
          <div className="w-full max-w-sm sm:max-w-md mx-auto animate-fade-in">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-100">
              {/* — Compact Header — */}
              <div className="relative bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 px-5 py-4 text-center">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Emergency Contacts
                </h1>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-800 font-medium">
                  Alerted first during an emergency or scan event
                </p>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 pointer-events-none" />
              </div>

              <div className="px-4 sm:px-5 pb-5 pt-4 space-y-3.5">
                {isContactPickerSupported && (
                  <button
                    type="button"
                    onClick={handleImportContact}
                    className="w-full h-9 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone size={14} /> Import from phone contacts
                  </button>
                )}

                <div className="space-y-3">
                  {emergencyContacts.map((contact, idx) => (
                    <div key={contact.id} className="rounded-xl border border-slate-200 p-3 space-y-2 relative bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Contact {idx + 1}
                        </span>
                        {emergencyContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmergencyContact(contact.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label={`Remove contact ${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(contact.id, "name", e.target.value)}
                        placeholder="Full name"
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-amber-400 font-medium"
                      />

                      <div>
                        <input
                          type="text"
                          value={contact.relationship}
                          onChange={(e) => updateEmergencyContact(contact.id, "relationship", e.target.value)}
                          placeholder="Relationship (e.g. Mother)"
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-amber-400 font-medium"
                        />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {RELATIONSHIP_PRESETS.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => updateEmergencyContact(contact.id, "relationship", label)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors cursor-pointer ${contact.relationship === label
                                  ? "border-amber-400 bg-amber-100 text-amber-800"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <PhoneInputWithCountry
                        value={contact.phone}
                        onChange={(full) => updateEmergencyContact(contact.id, "phone", full)}
                        placeholder="10-digit mobile"
                      />
                      {contact.phone.trim() && !isValidContactPhone(contact.phone) && (
                        <p className="text-[10px] font-semibold text-red-500">Enter a valid phone number.</p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEmergencyContactRow}
                  className="w-full h-8.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  + Add another contact
                </button>

                {contactsError && (
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                    <AlertTriangle size={12} />
                    {contactsError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleFinishEmergencyContacts}
                  disabled={activatingQr}
                  className="w-full h-10.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm transition-all active:scale-[0.99] cursor-pointer text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {activatingQr ? (
                    <span>Activating…</span>
                  ) : (
                    <><ShieldCheck size={16} /> Save Contacts &amp; Activate Sticker</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipEmergencyContacts}
                  disabled={activatingQr}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}



        {/* ============ LOCATION REQUEST (Light Mode) ============ */}
        {phase === "location-request" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8 text-center animate-fade-in w-full">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-md shadow-blue-500/10">
              <MapPin size={36} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Location Permission Required</h2>
            <p className="text-gray-500 text-xs leading-relaxed max-w-[260px] mx-auto mb-6">
              To notify the vehicle owner with your exact spot, please allow location access when prompted by your phone browser.
            </p>
            <button
              onClick={requestLocation}
              className="w-full py-3.5 rounded-2xl text-gray-900 font-bold text-sm shadow-md shadow-yellow-500/20 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}
            >
              Allow GPS Location
            </button>
          </div>
        )}

        {/* ============ LOCATION DENIED (Light Mode) ============ */}
        {phase === "location-denied" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8 text-center animate-fade-in w-full">
            <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Location Access Blocked</h2>
            <p className="text-gray-500 text-xs leading-relaxed max-w-[260px] mx-auto mb-6">
              Please enable location permission in your browser settings so the owner knows where your alert originated.
            </p>
            <button
              onClick={requestLocation}
              className="w-full py-3.5 rounded-2xl bg-yellow-400 text-gray-900 font-bold text-sm shadow-md hover:bg-yellow-500 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ============ EMERGENCY SCREEN (Redesigned matching requested design mockup) ============ */}
        {phase === "emergency" && qrData && (
          <div className="w-full max-w-md mx-auto animate-fade-in space-y-2 pb-6">
            {/* ============ MAIN MENU VIEW ============ */}
            {activeSubMenu === "none" && (
              <div className="space-y-3 animate-fade-in">
                {/* 2. EMERGENCY ASSISTANCE RED GRADIENT CARD */}
                <div className="bg-gradient-to-br from-[#D91C1C] via-[#C01515] to-[#800C0C] rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden space-y-3">
                  {/* Background Concentric Rings Overlay */}
                  <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />

                  {/* Top Header & Siren Graphic */}
                  <div className="flex items-start justify-between relative z-10 gap-2">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-2 shadow-xs backdrop-blur-xs">
                        <AlertTriangle size={22} className="text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        This is Emergency or an accident
                      </h2>
                      <p className="text-xs text-white/80 font-medium mt-0.5">
                        We've detected an emergency or accident
                      </p>
                    </div>

                    {/* Siren Graphic */}
                    <div className="flex-shrink-0 pt-1">
                      <EmergencySirenGraphic />
                    </div>
                  </div>

                  {/* 3 Quick Specs Row */}
                  <div className="grid grid-cols-3 divide-x divide-white/20 py-2 border-y border-white/15 text-center text-white relative z-10">
                    <div className="flex flex-col items-center px-1">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <MapPin size={16} className="text-white" />
                      </div>
                      <span className="text-[11px] font-bold leading-tight">Share Live</span>
                      <span className="text-[10px] text-white/80">Location</span>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <PhoneCall size={16} className="text-white" />
                      </div>
                      <span className="text-[11px] font-bold leading-tight">Notify</span>
                      <span className="text-[10px] text-white/80">Contacts</span>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Stethoscope size={16} className="text-white" />
                      </div>
                      <span className="text-[11px] font-bold leading-tight">Request</span>
                      <span className="text-[10px] text-white/80">Ambulance</span>
                    </div>
                  </div>

                  {/* SEND SOS Button */}
                  <button
                    onClick={() => setActiveSubMenu("emergency-main")}
                    className="w-full bg-white hover:bg-gray-50 text-[#C01515] font-black py-3 px-6 rounded-full flex items-center justify-center gap-3 shadow-md active:scale-98 transition-all cursor-pointer group relative z-10"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#C01515] text-white flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      <PhoneCall size={16} className="fill-white text-white" />
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-wider text-[#C01515]">
                      Get Help  </span>
                  </button>


                </div>

                {/* 3. QUICK ACTIONS SECTION */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Quick Actions</h3>
                    <span className="text-xs text-gray-400 font-normal">Tap on any service</span>
                  </div>

                  {/* 3x2 Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. Tow Truck */}
                    <button
                      onClick={() => {
                        setActiveSubMenu("towing");
                        setTowingImage(null);
                      }}
                      className="bg-white border border-gray-100 hover:border-red-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img src={towIcon} alt="Tow Truck" className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Tow Truck</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">Roadside recovery</p>
                      </div>
                    </button>

                    {/* 2. Mechanic */}
                    <button
                      onClick={() => setActiveSubMenu("mechanical")}
                      className="bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img src={mechanicIcon} alt="Mechanic" className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Mechanic</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">On-site repair</p>
                      </div>
                    </button>

                    {/* 3. Parking Issue */}
                    <button
                      onClick={() => setActiveSubMenu("parking")}
                      className="bg-white border border-gray-100 hover:border-blue-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-xs">
                          P
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Parking Issue</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">
                          {getAdminContacts("Parking").length > 0 ? getAdminContacts("Parking")[0].label : "Blocking path"}
                        </p>
                      </div>
                    </button>

                    {/* 4. Flat Tyre */}
                    <button
                      onClick={() => { setActiveSubMenu("flat-tire"); setFlatTireImage(null); }}
                      className="bg-white border border-gray-100 hover:border-purple-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img src={flatTireIcon} alt="Flat Tyre" className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Flat Tyre</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">Tyre assistance</p>
                      </div>
                    </button>

                    {/* 5. Theft Detected */}
                    <button
                      onClick={() => setActiveSubMenu("theft")}
                      className="bg-white border border-gray-100 hover:border-rose-200 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#FFE4E6] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <img src={theftIcon} alt="Theft Detected" className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Theft Alert</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">
                          {getAdminContacts("Theft").length > 0 ? getAdminContacts("Theft")[0].label : "Report and alert"}
                        </p>
                      </div>
                    </button>

                    {/* 6. Headlights */}
                    <button
                      onClick={() => setActiveSubMenu("headlights")}
                      className="bg-white border border-gray-100 hover:border-slate-300 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {/* Car Headlight Icon */}
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                          {/* Headlight body */}
                          <rect x="13" y="7" width="8" height="10" rx="3" stroke="#D97706" strokeWidth="2" />
                          {/* Inner lens */}
                          <circle cx="17" cy="12" r="2" fill="#D97706" />
                          {/* Light beam rays */}
                          <line x1="4" y1="10" x2="11" y2="11" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="3" y1="12" x2="11" y2="12" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
                          <line x1="4" y1="14" x2="11" y2="13" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Headlights</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal mt-0.5">
                          {getAdminContacts("Headlights").length > 0 ? getAdminContacts("Headlights")[0].label : "are on"}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* 6. AI SAFETY ASSISTANT & SUPPORT BAR */}
                  <button
                    onClick={() => setAiChatOpen(true)}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                        <Bot size={22} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-black text-white tracking-tight">RapiQR AI Assistant</p>
                        <p className="text-[11px] font-medium text-white/90">Ask AI for emergency advice &amp; owner assistance</p>
                      </div>
                    </div>
                    <div className="bg-white text-orange-700 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                      CHAT
                    </div>
                  </button>
                </div>

                {/* 5. MESSAGE VEHICLE OWNER CARD WITH FULL-COLORED WHATSAPP BUTTON */}
                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0 font-bold">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        Message Vehicle Owner
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        Send a direct alert via WhatsApp
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={visitorMessage}
                    onChange={(e) => setVisitorMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && visitorMessage.trim()) {
                        sendWhatsAppAlertManually("Visitor Message", visitorMessage.trim());
                      }
                    }}
                    placeholder="Type your message here..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 font-normal transition-colors"
                  />
                  <button
                    onClick={() => {
                      const msg = visitorMessage.trim() || "Hi, I scanned your vehicle's RapiQR code and need to contact you.";
                      sendWhatsAppAlertManually("Visitor Message", msg);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span>Send Message via WhatsApp</span>
                  </button>
                </div>



                <div className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm flex items-center justify-between divide-x divide-gray-100">
                  {/* Left Half: You're Protected */}
                  <div className="flex items-center gap-2.5 pr-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">You're Protected</p>
                      <p className="text-[10px] text-gray-400 font-normal truncate">We care about your safety</p>
                    </div>
                  </div>

                  {/* Right Half: 24/7 Support */}
                  <div className="flex items-center justify-between pl-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                        <PhoneCall size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">24/7 Support</p>
                        <p className="text-[10px] text-gray-400 font-normal truncate">Always here to help</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0 ml-1" />
                  </div>
                </div>
              </div>
            )}

            {/* ============ SUB-MENUS (when activeSubMenu !== "none") ============ */}
            {activeSubMenu !== "none" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 space-y-4">
                {/* ============ EMERGENCY MAIN BUTTON SUB-MENU (3 BUTTONS) ============ */}
                {activeSubMenu === "emergency-main" && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Header bar with Back button */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                      <button
                        onClick={() => setActiveSubMenu("none")}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <ShieldAlert size={16} className="text-red-500" /> Emergency Options
                        </span>
                      </div>
                    </div>

                    {/* Emergency Action Buttons */}
                    <div className="space-y-3">
                      {/* Button 1: Request Ambulance (from Admin Communication Page) */}
                      {getAdminContacts("Ambulance").length > 0 ? (
                        getAdminContacts("Ambulance").map((amb, i) => (
                          <button
                            key={`amb-${i}`}
                            onClick={() => window.open(`tel:${amb.phone.replace(/[^0-9+]/g, "")}`)}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold flex-shrink-0">
                                <Stethoscope size={22} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-sm font-black text-white tracking-tight">Request Ambulance</p>
                                <p className="text-[11px] font-medium text-white/80 truncate">{amb.label}</p>
                              </div>
                            </div>
                            <div className="bg-white text-red-600 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                              <PhoneCall size={12} /> CALL
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                          <p className="text-xs font-semibold text-gray-400">No ambulance provider configured</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add one in Communication settings</p>
                        </div>
                      )}

                      {/* Button 2: Call Family Members */}
                      {(() => {
                        const familyContacts = [
                          ...getTowingContacts().filter((c) => c.role === "Family / Emergency Contact"),
                          ...getAdminContacts("Family"),
                        ];
                        return familyContacts.length > 0 ? (
                          <button
                            onClick={() => setActiveSubMenu("family")}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-green-600/20 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold flex-shrink-0">
                                <User size={22} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-sm font-black text-white tracking-tight">Call Family Members</p>
                                <p className="text-[11px] font-medium text-white/80">
                                  {familyContacts.length} contact{familyContacts.length !== 1 ? "s" : ""} available
                                </p>
                              </div>
                            </div>
                            <div className="bg-white text-emerald-700 font-black text-xs px-3 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                              <PhoneCall size={12} /> CALL
                            </div>
                          </button>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                            <p className="text-xs font-semibold text-gray-400">No family contacts configured</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">Add emergency contacts in your Client Dashboard</p>
                          </div>
                        );
                      })()}

                      {/* Button 3: Share Location */}
                      <button
                        onClick={handleShareLocation}
                        disabled={locationSharing}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                            📍
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-black text-white tracking-tight">Share Location</p>
                          </div>
                        </div>
                        <div className="bg-white text-blue-700 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                          {locationSharing ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} SEND
                        </div>
                      </button>
                      {locationShareBanner && (
                        <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> {locationShareBanner}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ============ VEHICLE HELP SUB-MENU CARD ============ */}
                {activeSubMenu === "mechanical" && (
                  <div className="space-y-3 animate-fade-in">
                    {/* Header bar with Back button */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                      <button
                        onClick={() => {
                          setActiveSubMenu("none");
                          setTowingImage(null);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back to Emergency Services
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <Wrench size={16} className="text-orange-500" /> Mechanical Options
                        </span>
                        <p className="text-[10px] font-semibold text-gray-400">Select a service</p>
                      </div>
                    </div>

                    {/* Sub-Category Options Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Towing Assistance */}
                      <button
                        onClick={() => {
                          setActiveSubMenu("towing");
                          setTowingImage(null);
                        }}
                        className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-red-300 hover:bg-red-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shadow-2xs">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 group-hover:text-red-600 transition-colors">Towing Service</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                            {getAdminContacts("Towing").length > 0
                              ? `${getAdminContacts("Towing").length} provider${getAdminContacts("Towing").length !== 1 ? "s" : ""}`
                              : "Not configured"}
                          </p>
                        </div>
                      </button>

                      {/* Flat Tire / Puncher */}
                      <button
                        onClick={() => { setActiveSubMenu("flat-tire"); setFlatTireImage(null); }}
                        className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                          <Wrench size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 group-hover:text-amber-600 transition-colors">Flat Tire Fix</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                            {getAdminContacts("Flat Tire").length > 0
                              ? getAdminContacts("Flat Tire")[0].label
                              : "Towing & Repair"}
                          </p>
                        </div>
                      </button>

                      {/* Fuel & Battery */}
                      <button
                        onClick={() => {
                          const battery = getAdminContacts("Battery");
                          if (battery.length > 0) window.open(`tel:${battery[0].phone.replace(/[^0-9+]/g, "")}`);
                        }}
                        className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-yellow-300 hover:bg-yellow-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold shadow-2xs">
                          <Battery size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 group-hover:text-yellow-600 transition-colors">Battery</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                            {getAdminContacts("Battery").length > 0
                              ? getAdminContacts("Battery")[0].label
                              : "Not configured"}
                          </p>
                        </div>
                      </button>

                      {/* Mechanic */}
                      <button
                        onClick={() => {
                          const mechanic = getAdminContacts("Mechanic");
                          if (mechanic.length > 0) window.open(`tel:${mechanic[0].phone.replace(/[^0-9+]/g, "")}`);
                        }}
                        className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-orange-300 hover:bg-orange-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs">
                          <Settings size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 group-hover:text-orange-600 transition-colors">Mechanic</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                            {getAdminContacts("Mechanic").length > 0
                              ? getAdminContacts("Mechanic")[0].label
                              : "Not configured"}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ============ TOWING BREAKDOWN STEP VIEW ============ */}
                {activeSubMenu === "towing" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                      <button
                        onClick={() => {
                          setActiveSubMenu("mechanical");
                          setTowingImage(null);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back to Mechanical
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <Truck size={16} className="text-red-500" /> Towing Service
                        </span>
                      </div>
                    </div>

                    {/* Manual Full-Colored WhatsApp Action Card */}
                    <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-center space-y-2">
                      <p className="text-xs font-bold text-gray-900">Towing / Breakdown Recovery?</p>
                      <p className="text-[11px] text-gray-500 font-medium">Send a WhatsApp alert to request towing assistance for this vehicle.</p>
                      <button
                        onClick={() => sendWhatsAppAlertManually("Towing Service Needed", "Roadside breakdown / towing assistance requested for your vehicle.")}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                      >
                        <WhatsAppIcon className="w-5 h-5 fill-white" />
                        <span>Send WhatsApp Alert to Owner</span>
                      </button>
                    </div>

                    {!towingImage ? (
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                        <div className="grid grid-cols-2 gap-3">
                          <label className="bg-[#FF5500] hover:bg-[#E64D00] text-white font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all text-center">
                            <Camera size={18} />
                            <span>Take Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setTowingImage(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          <label className="bg-white border-2 border-[#FFD6B3] hover:bg-orange-50/50 text-[#FF5500] font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all text-center">
                            <Upload size={18} />
                            <span>Upload Picture</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setTowingImage(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 h-28 bg-gray-900 flex items-center justify-center shadow-xs">
                          <img src={towingImage} alt="Vehicle Breakdown" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                            <span className="text-white font-extrabold text-xs flex items-center gap-1">
                              <Check size={14} className="text-emerald-400" /> Photo Uploaded
                            </span>
                            <label className="bg-white/90 hover:bg-white text-gray-900 font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95">
                              Change Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setTowingImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {getAdminContacts("Towing").length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                              <p className="text-xs font-semibold text-gray-400">No towing providers configured</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add Towing providers in Communication settings</p>
                            </div>
                          ) : (
                            getAdminContacts("Towing").map((c, i) => (
                              <div
                                key={i}
                                className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2 transition-all hover:border-gray-300"
                              >
                                <div className="min-w-0 pr-1">
                                  <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{c.role}</p>
                                  {c.role === "Vehicle Owner / Primary" || c.role === "Family / Emergency Contact" ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 border border-emerald-200">
                                      <Lock size={9} /> Number Hidden (Privacy Protected)
                                    </span>
                                  ) : (
                                    <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                                >
                                  <PhoneCall size={14} /> CALL
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ============ MEDICAL HELP SUB-MENU CARD ============ */}
                {activeSubMenu === "medical" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                      <button
                        onClick={() => setActiveSubMenu("none")}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <Heart size={16} className="text-emerald-500 fill-emerald-500" /> Medical Options
                        </span>
                        <p className="text-[10px] font-semibold text-gray-400">Select a service</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {getAdminContacts("Ambulance").length > 0 ? (
                        getAdminContacts("Ambulance").map((amb, i) => (
                          <button
                            key={`med-amb-${i}`}
                            onClick={() => window.open(`tel:${amb.phone.replace(/[^0-9+]/g, "")}`)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-2xl p-3 text-left hover:opacity-95 transition-all active:scale-[0.98] shadow-md shadow-green-500/20 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                                <Stethoscope size={18} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-white">{amb.label}</p>
                                <p className="text-[10px] font-bold text-emerald-100">{amb.phone}</p>
                              </div>
                            </div>
                            <div className="bg-white text-emerald-700 font-black text-[10px] px-3 py-1 rounded-lg">
                              CALL
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                          <p className="text-xs font-semibold text-gray-400">No ambulance provider configured</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add one in Communication settings</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => alert("🚨 First Aid Advice: Stay calm, check breathing, elevate legs if dizzy, call 108 if unresponsive.")}
                          className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                            <Activity size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors">First Aid Guide</p>
                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">Instant Advice</p>
                          </div>
                        </button>

                        <button
                          onClick={() => location && window.open(`https://www.google.com/maps/search/hospitals/@${location.lat},${location.lng},14z`)}
                          className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors">Nearby Hospital</p>
                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">Google Maps Search</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============ FAMILY MEMBERS SUB-MENU ============ */}
                {activeSubMenu === "family" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                      <button
                        onClick={() => setActiveSubMenu("none")}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <PhoneCall size={16} className="text-emerald-500" /> Family Contacts
                        </span>
                        <p className="text-[10px] font-semibold text-gray-400">
                          {(() => {
                            const total = getAdminContacts("Family").length + getTowingContacts().filter((c) => c.role === "Family / Emergency Contact").length;
                            return `${total} number${total !== 1 ? "s" : ""} available`;
                          })()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleShareLocation}
                      disabled={locationSharing}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-2xs cursor-pointer disabled:opacity-70"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold flex-shrink-0">
                        {locationSharing ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-gray-900">Share My Live Location</p>
                        <p className="text-[10px] font-semibold text-gray-400">Notifies owner &amp; emergency contacts</p>
                      </div>
                      <ExternalLink size={14} className="text-gray-300 flex-shrink-0 ml-auto" />
                    </button>
                    {locationShareBanner && (
                      <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> {locationShareBanner}
                      </p>
                    )}

                    {getTowingContacts().filter((c) => c.role === "Family / Emergency Contact").length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Owner's Emergency Contacts</p>
                        {getTowingContacts().filter((c) => c.role === "Family / Emergency Contact").map((contact, i) => (
                          <div
                            key={`owner-ec-${i}`}
                            className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3 transition-all hover:border-emerald-300"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                                <User size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-gray-900 leading-tight truncate">{contact.label}</p>
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <Lock size={9} /> Number Hidden (Privacy Protected)
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // Trigger automated alert dispatch & initiate call bridge
                                if (qrData && location) {
                                  const payload = {
                                    qrId: qrData.id,
                                    qrUrl: qrData.qrUrl,
                                    latitude: location.lat,
                                    longitude: location.lng,
                                    accuracy: location.accuracy,
                                    deviceId: navigator.userAgent.slice(0, 40),
                                    timestamp: new Date().toISOString(),
                                    message: `EMERGENCY CALL REQUEST for ${contact.label}`,
                                    vehicleName: qrData.vehicleName,
                                    vehicleNumber: qrData.vehicleNumber,
                                  };
                                  const alerts = JSON.parse(localStorage.getItem("repiqr-alerts") || localStorage.getItem("namoqr-alerts") || "[]");
                                  alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
                                  localStorage.setItem("repiqr-alerts", JSON.stringify(alerts));
                                  localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
                                }
                                openMaskedCall(contact.label, contact.name);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                            >
                              <PhoneCall size={14} /> CALL
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {getTowingContacts().filter((c) => c.role === "Family / Emergency Contact").length === 0 && getAdminContacts("Family").length === 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <PhoneCall size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">No family contacts configured</p>
                        <p className="text-[11px] text-gray-300 mt-1">Configure emergency contacts for this sticker in your Client Dashboard.</p>
                      </div>
                    )}

                    {getAdminContacts("Family").length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                        {getAdminContacts("Family").map((contact, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 transition-all hover:border-gray-300"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                                <User size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight truncate">{contact.label}</p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{contact.role}</p>
                                <p className="text-sm font-mono font-black text-gray-800 mt-1">{contact.phone}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(`tel:${contact.phone.replace(/[^0-9+]/g, "")}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                            >
                              <PhoneCall size={14} /> CALL
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ============ PARKING ISSUE SUB-MENU ============ */}
                {activeSubMenu === "parking" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button onClick={() => setActiveSubMenu("none")} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer">
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-[10px]">P</div>
                          Parking Issue
                        </span>
                      </div>

                      {/* Manual Full-Colored WhatsApp Action Card */}
                      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Vehicle Blocking Path?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send a direct WhatsApp notification to the owner to request moving their vehicle.</p>
                        <button
                          onClick={() => sendWhatsAppAlertManually("Parking Issue", "Hi, your vehicle is blocking a path/driveway. Please move it as soon as possible.", ownerContact?.phone)}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppIcon className="w-5 h-5 fill-white" />
                          <span>Send WhatsApp Alert to Owner</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button onClick={() => openMaskedCall("Vehicle Owner")} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                            <PhoneCall size={14} /> CALL
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Parking").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Parking").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                                <PhoneCall size={14} /> CALL
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============ HEADLIGHTS SUB-MENU ============ */}
                {activeSubMenu === "headlights" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button onClick={() => setActiveSubMenu("none")} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer">
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Lightbulb size={16} className="text-amber-500" /> Headlights
                        </span>
                      </div>

                      {/* Manual Full-Colored WhatsApp Action Card */}
                      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Headlights Left On?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Alert the owner immediately via WhatsApp so their vehicle battery doesn't drain.</p>
                        <button
                          onClick={() => sendWhatsAppAlertManually("Headlights On", "Hi, your vehicle's headlights are left turned on. Please check them.", ownerContact?.phone)}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppIcon className="w-5 h-5 fill-white" />
                          <span>Send WhatsApp Alert to Owner</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button onClick={() => openMaskedCall("Vehicle Owner")} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                            <PhoneCall size={14} /> CALL
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Headlights").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Headlights").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                                <PhoneCall size={14} /> CALL
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============ THEFT ALERT SUB-MENU ============ */}
                {activeSubMenu === "theft" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button onClick={() => setActiveSubMenu("none")} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer">
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <img src={theftIcon} alt="Theft" className="w-4 h-4 object-contain" /> Theft Alert
                        </span>
                      </div>

                      {/* Manual Full-Colored WhatsApp Action Card */}
                      <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Suspicious Activity / Tampering?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send an emergency alert directly to the owner via WhatsApp.</p>
                        <button
                          onClick={() => sendWhatsAppAlertManually("Theft Alert", "EMERGENCY: Someone reported suspicious activity or potential theft regarding your vehicle.", ownerContact?.phone)}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppIcon className="w-5 h-5 fill-white" />
                          <span>Send Emergency WhatsApp Alert</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button onClick={() => openMaskedCall("Vehicle Owner")} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                            <PhoneCall size={14} /> CALL
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Theft").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Theft").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                                <PhoneCall size={14} /> CALL
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============ FLAT TIRE SUB-MENU (photo upload + owner phone) ============ */}
                {activeSubMenu === "flat-tire" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button onClick={() => { setActiveSubMenu("none"); setFlatTireImage(null); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer">
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <img src={flatTireIcon} alt="Flat Tyre" className="w-4 h-4 object-contain" /> Flat Tyre
                        </span>
                      </div>

                      {/* Manual Full-Colored WhatsApp Action Card */}
                      <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Flat Tyre Detected?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send a WhatsApp alert to the vehicle owner.</p>
                        <button
                          onClick={() => sendWhatsAppAlertManually("Flat Tyre", "Hi, noticed a flat tyre on your vehicle. Please check it.", ownerContact?.phone)}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppIcon className="w-5 h-5 fill-white" />
                          <span>Send WhatsApp Alert to Owner</span>
                        </button>
                      </div>

                      {!flatTireImage ? (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                          <p className="text-[11px] font-semibold text-gray-500 px-0.5">Add a photo of the flat tyre so help arrives prepared.</p>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="bg-[#FF5500] hover:bg-[#E64D00] text-white font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all text-center">
                              <Camera size={18} />
                              <span>Take Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFlatTireImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            <label className="bg-white border-2 border-[#FFD6B3] hover:bg-orange-50/50 text-[#FF5500] font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all text-center">
                              <Upload size={18} />
                              <span>Upload Picture</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFlatTireImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 h-28 bg-gray-900 flex items-center justify-center shadow-xs">
                          <img src={flatTireImage} alt="Flat Tyre" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                            <span className="text-white font-extrabold text-xs flex items-center gap-1">
                              <Check size={14} className="text-emerald-400" /> Photo Uploaded
                            </span>
                            <label className="bg-white/90 hover:bg-white text-gray-900 font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95">
                              Change Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setFlatTireImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button onClick={() => openMaskedCall("Vehicle Owner")} className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                            <PhoneCall size={14} /> CALL
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Flat Tire").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Flat Tire").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)} className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer">
                                <PhoneCall size={14} /> CALL
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ============ ACTIVATION SUCCESS (owner just activated their sticker) ============ */}
        {phase === "success" && qrData && (
          <div className="w-full max-w-sm sm:max-w-md mx-auto animate-fade-in">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl p-5 sm:p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">All set! Your sticker is active.</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {regEmail.trim()
                    ? `We've sent a confirmation to ${regEmail.trim()}.`
                    : "You can manage it anytime from your dashboard."}
                </p>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 text-left space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activation Summary</p>
                <div className="text-xs font-semibold text-slate-700 space-y-1">
                  <p>• Sticker: <span className="font-mono font-bold text-slate-900">{qrData.id}</span></p>
                  <p>• Owner: {regName.trim() || "—"}</p>
                  <p>• Activated: {formatTime(new Date().toISOString())}</p>
                  <p>
                    • Emergency contacts:{" "}
                    {emergencyContacts.filter((c) => c.name.trim() && isValidContactPhone(c.phone)).length} added
                  </p>
                </div>
              </div>

              {/* ONLY 2 BUTTONS: Continue & View Sticker Safety Page */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={onGoToDashboard || onBack}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => setPhase("emergency")}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>View Sticker's Safety Page</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating AI Assistant FAB Button */}
        {phase === "emergency" && (
          <button
            onClick={() => setAiChatOpen(true)}
            className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/40 active:scale-95 transition-all cursor-pointer"
          >
            <Bot size={18} />
            <span>AI Safety Assistant</span>
          </button>
        )}

        {/* ============ OPENROUTER AI CHAT MODAL ============ */}
        {aiChatOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={() => setAiChatOpen(false)}
          >
            <div
              className="bg-white w-full max-w-lg h-[90vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Bar for Mobile */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between flex-shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shadow-inner">
                    <Bot size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      RapiQR Safety AI
                      <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/90 font-medium">Instant Emergency &amp; Owner Assistance</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  title="Close Chat"
                >
                  ✕
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs ${msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                          : 'bg-slate-900 text-amber-400'
                        }`}
                    >
                      {msg.role === 'user' ? 'U' : <Bot size={17} />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-xs ${msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-tr-xs font-semibold'
                          : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-start gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 p-3.5 rounded-2xl shadow-lg max-w-[290px] animate-fade-in text-white">
                    <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-black text-[10px]">
                        AI
                      </div>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">RapiQR Neural Core</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-200 leading-tight">Analyzing vehicle QR context &amp; safety protocols...</p>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 pt-0.5">
                        <span>Processing request</span>
                        <span className="inline-flex gap-1">
                          <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
                {[
                  '🚨 Vehicle Blocking Driveway',
                  '🚗 Need Towing Assistance',
                  '🚑 Medical Emergency Advice',
                  '🔒 How to Call Owner Safely',
                  '💡 Headlights Left On'
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendAiMessage(chip)}
                    disabled={aiLoading}
                    className="text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-gray-200 transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  placeholder="Ask AI safety assistant..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium transition-all"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || aiLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white flex items-center justify-center font-bold shadow-md transition-all flex-shrink-0 cursor-pointer active:scale-95"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============ MASKED CALL MODAL ============ */}
        {maskedCallTarget && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={() => setMaskedCallTarget(null)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Lock size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Masked Call — {maskedCallTarget.label}</h3>
                    <p className="text-[11px] text-white/85 font-medium">Their real number stays private</p>
                  </div>
                </div>
                <button
                  onClick={() => setMaskedCallTarget(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your phone number — we'll call you first, then securely connect you to {maskedCallTarget.label.toLowerCase()}. Neither of you will see the other's real number.
                </p>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Your Phone Number</label>
                  <PhoneInputWithCountry
                    value={maskedCallPhone}
                    onChange={(full) => { setMaskedCallPhone(full); setMaskedCallResult(null); }}
                  />
                </div>

                {maskedCallResult && (
                  <p className={`flex items-center gap-1.5 text-xs font-semibold ${maskedCallResult.success ? "text-emerald-600" : "text-red-500"}`}>
                    {maskedCallResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {maskedCallResult.message}
                  </p>
                )}

                <button
                  onClick={submitMaskedCall}
                  disabled={maskedCallBusy}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer text-sm disabled:opacity-60"
                >
                  {maskedCallBusy ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Starting call…</span>
                    </>
                  ) : (
                    <><PhoneCall size={16} /> Start Masked Call</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
