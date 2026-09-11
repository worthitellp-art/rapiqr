import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStickerCategoryLabel, getCategoryIcon, getCategoryLabel } from "../../stickerModules";
import PhoneInputWithCountry from "../common/PhoneInputWithCountry";
import InstallAppFab from "../common/InstallAppFab";
import InstallAppBar from "../common/InstallAppBar";
import CategoryScanView from "./CategoryScanView";
import AssistantChat from "./AssistantChat";
import { getCategoryVariant, BESPOKE_CATEGORIES, type VariantAction } from "./categoryVariants";
import type { CategoryButtonAction, ServiceProvider } from "./tileActions";
import { handleCategoryButtonAction } from "./categoryButtonActions";
import { apiClient } from "../../lib/apiClient";
import AppLogo from "../common/AppLogo";
import groupLogo from "../../../assets/Group 1000005716.png";
import groupLogo1 from "../../../assets/darkbglogo.png";
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
  X,
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
  BellRing,
  MessageCircle,
  Users,
  Shield,
  QrCode,
  Zap,
  Radio
} from "lucide-react";
import RepiChat, { customerTokenKey } from "../chat/RepiChat";
import { isChatOpen as recallChatOpen, setChatOpen as rememberChatOpen } from "../../lib/chatStorage";
import activationArt from "../../assets/illustrations/activation-art.jpg";
import guardianArt from "../../assets/illustrations/guardian-art.jpg";
import deepinspireScene from "../../assets/illustrations/deepinspire-scene.jpg";

/* WhatsApp logo SVG — matches the CategoryScanView WhatsAppIcon */
function WhatsAppSvg({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
  if (typeof window === "undefined") return null;

  const pathName = window.location.pathname;
  const hashString = window.location.hash;
  const searchString = window.location.search;

  const urlSearchParams = new URLSearchParams(searchString);
  const queryParameterId =
    urlSearchParams.get("sticker") ||
    urlSearchParams.get("code") ||
    urlSearchParams.get("qr") ||
    urlSearchParams.get("id");

  if (queryParameterId) {
    return decodeURIComponent(queryParameterId);
  }

  const hashRouteMatch = hashString.match(/#\/(qr|activate|verify|emergency|scan)\/([^/]+)/i);
  if (hashRouteMatch) {
    return decodeURIComponent(hashRouteMatch[2]);
  }

  const legacyPathMatch = pathName.match(/\/(qr|activate|verify|emergency|scan)\/([^/]+)/i);
  if (legacyPathMatch) {
    return decodeURIComponent(legacyPathMatch[2]);
  }

  const singleSegmentMatch = pathName.match(/^\/([^/]+)/);
  if (singleSegmentMatch && singleSegmentMatch[1] !== "") {
    const candidateId = singleSegmentMatch[1];
    const reservedRoutes = [
      "activate",
      "verify",
      "emergency",
      "scan",
      "admin",
      "distributor",
      "checkout",
      "auth",
      "index.html",
    ];

    if (!reservedRoutes.includes(candidateId.toLowerCase())) {
      return decodeURIComponent(candidateId);
    }
  }

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
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="85%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
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
  const { profile } = useAuth();
  const [phase, setPhase] = useState<Phase>("validating");
  const [qrData, setQrData] = useState<QrData | null>(null);

  /* The category on the QR record is what the admin picked when the sticker was
     minted; it decides which scan page the visitor lands on. */
  const categoryVariant = getCategoryVariant(qrData?.category);
  const isBespokeCategory = (BESPOKE_CATEGORIES as readonly string[]).includes(
    (qrData?.category || "car").trim().toLowerCase()
  );
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [sentReceipt, setSentReceipt] = useState<{
    sms: boolean;
    whatsapp: boolean;
    ownerNotified: boolean;
    timestamp: string;
  } | null>(null);
  const [activatingQr, setActivatingQr] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<"none" | "emergency-main" | "mechanical" | "towing" | "family" | "parking" | "headlights" | "theft" | "flat-tire">("none");
  const [flatTireImage, setFlatTireImage] = useState<string | null>(null);

  // Quick-issue SMS dispatch (Parking / Headlights / Theft) — fired automatically
  // the moment the visitor taps the quick-action tile, using the real backend alert route
  // (same one the "Message Vehicle Owner" box uses) so the owner is actually notified,
  // instead of the old fake localStorage + alert() popup.
  const [quickAlertStatus, setQuickAlertStatus] = useState<Record<string, { sending: boolean; sent: boolean; simulated: boolean }>>({});

  // RepiChat — in-app real-time chat with the sticker owner, replacing WhatsApp deep links.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  // A visitor mid-conversation is on a phone: an incoming call, a tab switch or
  // a flaky signal reloads this page under them. The panel remembers it was
  // open (per sticker) so the reload drops them straight back into the thread
  // instead of the scan screen. The flag can only be read once the QR has
  // resolved, since it is scoped to that sticker — and the first pass only
  // restores, so it can't overwrite the flag with the not-yet-restored value.
  const chatRestoredRef = useRef(false);
  useEffect(() => {
    if (!qrData) return;
    if (!chatRestoredRef.current) {
      chatRestoredRef.current = true;
      if (recallChatOpen(qrData.id)) setChatOpen(true);
      return;
    }
    rememberChatOpen(qrData.id, chatOpen);
  }, [qrData, chatOpen]);

  // Stop the page behind the sheet from scrolling while the chat owns the screen.
  useEffect(() => {
    if (!chatOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [chatOpen]);

  // Masked calling — replaces every direct `tel:` link, whether to the owner,
  // one of their emergency contacts, or an admin-configured helpline provider
  // (Ambulance, Towing, Mechanic, ...), with a server-brokered Cloudshope
  // anonymous call bridge. The real number is resolved server-side — from
  // qrId (+ optional contactName) or from helplineId — and never sent to, or
  // shown in, the browser; the backend mints a DID (virtual number) mapped to
  // the real number, and the visitor dials that DID directly — Cloudshope's
  // telecom layer connects it, and any callback on that DID auto-connects
  // back to this visitor. This also hides the visitor's own number from
  // whoever they're calling, business helplines included.
  const [maskedCallTarget, setMaskedCallTarget] = useState<{ label: string; contactName?: string; helplineId?: string } | null>(null);
  const [maskedCallDid, setMaskedCallDid] = useState<string | null>(null);
  const [maskedCallBusy, setMaskedCallBusy] = useState(false);
  const [maskedCallError, setMaskedCallError] = useState<string | null>(null);

  const fetchMaskedCallNumber = async (target: { label: string; contactName?: string; helplineId?: string }) => {
    if (!qrData && !target.helplineId) return;
    setMaskedCallBusy(true);
    setMaskedCallError(null);
    setMaskedCallDid(null);
    try {
      const res = await apiClient.cloudshope.getCallNumber({
        qrId: qrData?.id,
        contactName: target.contactName,
        helplineId: target.helplineId,
      });
      if (res.success && res.did) {
        setMaskedCallDid(res.did);
      } else {
        setMaskedCallError(res.error || "Couldn't generate a call number — try again.");
      }
    } catch (err: any) {
      setMaskedCallError(err.message || "Couldn't reach the server — try again.");
    } finally {
      setMaskedCallBusy(false);
    }
  };

  const openMaskedCall = (label: string, contactName?: string, helplineId?: string) => {
    const target = { label, contactName, helplineId };
    setMaskedCallTarget(target);
    setMaskedCallDid(null);
    setMaskedCallError(null);
    fetchMaskedCallNumber(target);
  };

  // Admin-configured helplines (Ambulance, Towing, Mechanic, ...), fetched from
  // the backend so they work for a genuine first-time visitor — the old
  // localStorage-only read (namoqr-helplines) only ever had data on the admin's
  // own browser. Seeded from localStorage for an instant first paint, then
  // replaced by the real fetch.
  const [helplines, setHelplines] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("repiqr-helplines") || localStorage.getItem("namoqr-helplines") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    apiClient.helplines.getPublic().then((res) => {
      if (res.success && Array.isArray(res.data)) setHelplines(res.data);
    }).catch(() => { /* keep the localStorage-seeded list on failure */ });
  }, []);

  // The customer side of RepiChat has no account — it's identified by an opaque
  // token held in localStorage per QR id, the same one <RepiChat/> bootstraps
  // with. Resolving/minting it here lets a quick-issue alert land in the exact
  // same thread the visitor sees when the chat panel opens.
  const getChatCustomerToken = useCallback(() => {
    if (!qrData) return undefined;
    const key = customerTokenKey(qrData.id);
    let token = localStorage.getItem(key);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(key, token);
    }
    return token;
  }, [qrData]);

  // Emergency and Quick-issue alert dispatch:
  // Dispatches alert to backend (which auto-sends WhatsApp via MSG91 to the
  // owner), saves in localStorage alert history, and syncs with the visitor's
  // in-app RepiChat thread. The visitor never sees the owner's number.
  const sendQuickIssueAlert = async (alertType: string, defaultMessage: string) => {
    if (!qrData) return;
    const locationText = location ? `\n📍 Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : "";
    const fullMessage = `🚨 RepiQR Emergency Alert: ${alertType}\n🏷️ Item/Vehicle: ${qrData.vehicleName} (${qrData.vehicleNumber})\n\n${defaultMessage}${locationText}`;

    // 1. Save alert locally so Alert History in Client Dashboard immediately reflects it
    const alertRecord = {
      id: `alert-${Date.now()}`,
      qrId: qrData.id,
      qrUrl: qrData.qrUrl,
      latitude: location?.lat || 0,
      longitude: location?.lng || 0,
      accuracy: location?.accuracy || 0,
      deviceId: navigator.userAgent.slice(0, 40),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      message: fullMessage,
      vehicleName: qrData.vehicleName,
      vehicleNumber: qrData.vehicleNumber,
      customerToken: getChatCustomerToken(),
      type: "emergency",
      event_type: "Emergency Alert",
      status: "sent",
    };

    try {
      const storedAlerts = JSON.parse(localStorage.getItem("repiqr-alerts") || localStorage.getItem("namoqr-alerts") || "[]");
      storedAlerts.unshift(alertRecord);
      localStorage.setItem("repiqr-alerts", JSON.stringify(storedAlerts));
      localStorage.setItem("namoqr-alerts", JSON.stringify(storedAlerts));
    } catch {
      /* ignore local storage error */
    }

    // 2. Post alert to backend server
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
        customerToken: getChatCustomerToken(),
        type: "emergency",
      });
    } catch {
      /* ignore non-critical backend logger failure */
    }

    // 3. WhatsApp is dispatched automatically by the backend (via MSG91) straight
    // to the owner — the visitor never sees the owner's number. Opening
    // api.whatsapp.com here would leak that number, so it is deliberately not done.

    setChatInitialMessage(undefined);
    setChatOpen(true);
  };

  // "Message Vehicle Owner" free-text card — opens RepiChat and sends the
  // typed message directly, no SMS fan-out (that's reserved for the
  // safety-critical quick-issue tiles above).
  const openChatWithMessage = (message: string) => {
    if (!qrData) return;
    setChatInitialMessage(message);
    setChatOpen(true);
  };

  // Registration form fields (after activation code is validated)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regMessage, setRegMessage] = useState("");
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

  // AI Chat Assistant — the conversation itself lives in <AssistantChat/>, which
  // seeds its greeting and suggested questions from the scanned tag's category.
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const [buyerPhone, setBuyerPhone] = useState("");
  const [phoneMatchesBuyer, setPhoneMatchesBuyer] = useState(false);

  // OTP verification step state (two-step activation flow) — sends a real
  // Twilio SMS via the backend (POST /api/qr/:id/send-activation-otp) instead
  // of the old hardcoded "0000". On a Twilio trial account, delivery only
  // succeeds to Caller-ID-verified numbers; "000000" is the master bypass
  // code (Server/services/phoneVerificationService.js) for testing when a
  // number isn't verified or Twilio credentials aren't configured.
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpSimulated, setOtpSimulated] = useState(false);

  function isValidPhoneNumber(phone: string) {
    return /^\d{10}$/.test(phone.replace(/\D/g, ""));
  }

  // Prefill owner phone/name from the most recent purchase order (decision branch)
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

  const handleSendOtp = async () => {
    if (!qrData || otpSending) return;
    setActivationError(null);

    if (!regName.trim()) {
      setActivationError("Please enter your full name.");
      return;
    }
    if (!isValidPhoneNumber(regPhone)) {
      setActivationError("Please enter a valid 10-digit phone number.");
      return;
    }

    const fullPhone = `${regCountry}${regPhone.trim().replace(/\s+/g, "")}`;
    const effectiveName = regName.trim() || "Vehicle Owner";
    const effectiveNotes = regMessage.trim();

    setOtpSending(true);
    try {
      // 1. Immediately register and link the phone number & name to the sticker in MongoDB
      const activationRes = await apiClient.qr.activateQrCode(qrData.id, {
        category: qrData.category || "car",
        ownerName: effectiveName,
        ownerPhone: fullPhone,
        notes: effectiveNotes,
        userId: profile?.id,
      });

      if (activationRes?.data) {
        setQrData((prev) => (prev ? { ...prev, status: "active", vehicleName: effectiveName } : null));
      }

      // Update local storage backup
      const stored = localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);
      if (idx >= 0) {
        list[idx].status = "active";
        list[idx].ownerName = effectiveName;
        list[idx].ownerPhone = fullPhone;
        list[idx].notes = effectiveNotes;
        localStorage.setItem("repiqr-qrlist", JSON.stringify(list));
        localStorage.setItem("namoqr-qrlist", JSON.stringify(list));
      }

      // 2. If phone matches purchase record, skip OTP and proceed to emergency contacts
      if (phoneMatchesBuyer) {
        proceedToEmergencyContacts(true);
        return;
      }

      // 3. Attempt OTP sending (if configured, offers extra verification)
      try {
        const res = await apiClient.qr.sendActivationOtp(qrData.id, fullPhone);
        if (res?.success) {
          setOtpSimulated(Boolean(res.simulated));
          setOtpInput("");
          setActivationError(null);
          setOtpStep(true);
          return;
        }
      } catch (smsErr) {
        console.warn("SMS OTP unavailable, proceeding with direct activation:", smsErr);
      }

      // If SMS OTP is not active or fails, the sticker is already saved & linked! Proceed to next step.
      proceedToEmergencyContacts(true);
    } catch (err: any) {
      setActivationError(err?.message || "Couldn't register sticker — please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndActivate = async () => {
    if (!qrData || activatingQr) return;
    setActivationError(null);

    setActivatingQr(true);
    try {
      const res = await apiClient.qr.verifyActivationOtp(qrData.id, otpInput.trim());
      if (!res.success) {
        setActivationError(res.error || "Invalid code. Please try again.");
        return;
      }
      proceedToEmergencyContacts(true);
    } catch (err: any) {
      setActivationError(err?.message || "Couldn't reach the server — try again.");
    } finally {
      setActivatingQr(false);
    }
  };

  // Identity step is done (however it was verified) — move to the Emergency Contacts
  // step before finalizing activation.
  const proceedToEmergencyContacts = (verified: boolean) => {
    setPendingVerified(verified);
    setContactsError(null);
    setPhase("register");
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
          // Free-text chat message to the owner — not an emergency signal.
          type: "contact_owner",
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
        customerToken: getChatCustomerToken(),
        // Sent only from the red SOS/accident screen sharing live GPS — this IS
        // the true emergency signal the admin Alerts feed should surface first.
        type: "emergency",
      });
      const notifiedOwner = Boolean(res.smsResult?.sent);
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
    const active = helplines.filter((p: any) => p.active !== false);
    const toContact = (p: any) => ({ id: p.id, label: p.label, phone: p.phone, role: p.category, category: p.category });
    if (!filterCategory) return active.map(toContact);
    return active.filter((p: any) => p.category === filterCategory).map(toContact);
  };

  /* ---- Category scan pages (every sticker category except car / bike) ----
     The six quick-action tiles and every button inside them are declared as
     data in `categoryVariants.ts`; this is the single place that turns one of
     those declarations into a real action. Public emergency numbers dial
     straight from the handset, partner/support numbers resolve to whatever the
     admin configured on the Communication page, and every owner-facing button
     reuses the same backend alert + RepiChat routes the vehicle screen uses. */
  const [variantBanner, setVariantBanner] = useState<string | null>(null);


  const flashVariantBanner = (text: string) => {
    setVariantBanner(text);
    setTimeout(() => setVariantBanner((cur) => (cur === text ? null : cur)), 6000);
  };

  /* Partner/support buttons carry a placeholder number — the real one is
     whichever provider the admin added for that service. Matched on the
     provider's category, then on its label, so "Mechanic desk" finds the
     "Mechanic" provider. */
  const resolveProvider = (who: string) => {
    const needle = who.toLowerCase();
    const all = getAdminContacts();
    return (
      all.find((c: any) => c.category && needle.includes(String(c.category).toLowerCase())) ||
      all.find((c: any) => c.label && needle.includes(String(c.label).toLowerCase())) ||
      all.find((c: any) => c.category && String(c.category).toLowerCase().includes(needle.split(" ")[0])) ||
      null
    );
  };

  const runVariantAction = (action: VariantAction, context: string) => {
    switch (action.kind) {
      case "call": {
        if (action.via === "public") {
          window.location.href = `tel:${action.number.replace(/\s/g, "")}`;
          return;
        }
        const provider = resolveProvider(action.who);
        if (provider?.phone) {
          window.location.href = `tel:${String(provider.phone).replace(/\s/g, "")}`;
          return;
        }
        flashVariantBanner(
          `No ${action.who} is configured for this sticker yet — the owner's admin adds providers on the Communication page.`
        );
        return;
      }
      case "notify":
        sendQuickIssueAlert(context, action.text || getCategoryVariant(qrData?.category).alert);
        flashVariantBanner("Alert sent — the owner and their emergency contacts have been notified.");
        return;
      case "maps": {
        const around = location ? `/@${location.lat},${location.lng},14z` : "";
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(action.query)}${around}`);
        return;
      }
      case "pin":
        handleShareLocation();
        return;
      case "write":
        document.getElementById("variant-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
        (document.getElementById("variant-composer") as HTMLInputElement | null)?.focus();
        return;
      case "ask":
        setAiChatOpen(true);
        return;
    }
  };

  /* ---- Category tile-sheet buttons (SERVICE_PROVIDER / SEND_SMS / CHAT_OWNER) ----
     Everything inside a category tile sheet routes through one handler in
     categoryButtonActions.ts. Anything the three reusable types don't cover
     (public emergency dialling, Maps, the GPS pin, the composer, the assistant)
     arrives as "OTHER" and falls through to runVariantAction above, unchanged.
     The bespoke car/bike screen never reaches this. */
  const [variantProviderPanel, setVariantProviderPanel] = useState<{ serviceType: string; providers: ServiceProvider[] } | null>(null);
  const [variantBusy, setVariantBusy] = useState(false);

  const runCategoryButton = async (action: CategoryButtonAction, tileTitle: string) => {
    if (action.actionType === "OTHER") {
      runVariantAction(action.action, tileTitle);
      return;
    }
    if (!qrData || variantBusy) return;

    setVariantBusy(true);
    try {
      const result = await handleCategoryButtonAction(
        {
          actionType: action.actionType,
          tagId: qrData.id,
          category: (qrData.category || "").trim().toLowerCase(),
          serviceType: action.actionType === "SERVICE_PROVIDER" ? action.serviceType : undefined,
          message: action.actionType === "SERVICE_PROVIDER" ? undefined : action.message,
          issue: action.actionType === "SEND_SMS" ? action.issue : undefined,
        },
        {
          providers: helplines,
          location,
          qrUrl: qrData.qrUrl,
          tagName: qrData.vehicleName,
          tagNumber: qrData.vehicleNumber,
          customerToken: getChatCustomerToken(),
          visitorName: visitorName || undefined,
          openChat: (msg) => {
            setChatInitialMessage(msg);
            setChatOpen(true);
          },
          showProviders: setVariantProviderPanel,
        }
      );

      if (result.kind === "error") {
        flashVariantBanner(result.message);
        return;
      }

      if (result.kind === "sms") {
        // Report what actually happened — the alert is always saved, but the
        // WhatsApp itself can be simulated (no provider configured) or fail.
        flashVariantBanner(
          result.ownerNotified
            ? "WhatsApp sent — the owner has been notified."
            : result.simulated
              ? "Logged for the owner. WhatsApp is in test mode, so nothing was delivered."
              : "Saved to the owner's alert history, but the WhatsApp could not be delivered."
        );
      }
    } finally {
      setVariantBusy(false);
    }
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
      apiClient.qr.getQrCodeById(cleanQrId).then((res) => {
        const dbRecord = res?.data || null;
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
      const displayTag = cleanId.slice(0, 8).toUpperCase();
      const fallback = {
        id: cleanId,
        clientId: cleanId.startsWith("CL") ? cleanId : `CL-${displayTag}`,
        vehicleName: `RapiQR Safety Tag (${displayTag})`,
        vehicleNumber: `REG-${cleanId.slice(-4).toUpperCase()}`,
        status: "inactive",
        template: "Default",
      };
      const updatedList = [fallback, ...list];
      localStorage.setItem("repiqr-qrlist", JSON.stringify(updatedList));
      localStorage.setItem("namoqr-qrlist", JSON.stringify(updatedList));
      resolveQr(fallback);
    }
  }, [requestLocation]);

  /* ---- Registration Form Submit (after activation code validated) ---- */
  const handleRegisterSubmit = async (verified = true) => {
    if (!qrData) return;

    setActivatingQr(true);
    setActivationError(null);
    setContactsError(null);

    const effectiveName = regName.trim() || profile?.full_name || qrData.vehicleName || "Sticker Owner";
    const effectivePhone = regPhone.trim() || profile?.phoneNumber || "0000000000";

    const fullPhone = effectivePhone.startsWith("+")
      ? effectivePhone
      : `${regCountry}${effectivePhone.replace(/\s+/g, "")}`;

    const validContacts = emergencyContacts
      .filter((c) => c.name.trim() && isValidContactPhone(c.phone))
      .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim() || "Contact", phone: c.phone.trim() }));

    // Save to the backend, with a guaranteed local-storage fallback below.
    let activationResult: any = { success: true };
    try {
      const res = await apiClient.qr.activateQrCode(qrData.id, {
        category: qrData.category || "car",
        ownerName: effectiveName,
        ownerPhone: fullPhone,
        emergencyContacts: validContacts,
        bloodGroup: regBloodGroup,
        allergies: regAllergies.trim(),
        address: regAddress.trim(),
        notes: regMessage.trim(),
        userId: profile?.id,
      });
      if (res?.data) activationResult = res.data;
    } catch (err: any) {
      console.warn("Server activation fallback to local storage:", err);
    }

    setTimeout(() => {
      // Also save to localStorage as fallback
      const stored = localStorage.getItem("repiqr-qrlist") || localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);

      const registrationData = {
        ownerName: effectiveName,
        ownerPhone: fullPhone,
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

      // Also update client stickers storage if present
      try {
        const clientStickers = JSON.parse(localStorage.getItem("repiqr-client-stickers") || "[]");
        const sIdx = clientStickers.findIndex((s: any) => s.id === qrData.id || s.qrCodeId === qrData.id);
        if (sIdx >= 0) {
          clientStickers[sIdx].status = "Active";
          clientStickers[sIdx].ownerName = effectiveName;
          clientStickers[sIdx].ownerPhone = fullPhone;
          clientStickers[sIdx].contacts = validContacts;
          localStorage.setItem("repiqr-client-stickers", JSON.stringify(clientStickers));
        }
      } catch {
        /* ignore */
      }

      setQrData((prev) => (prev ? { ...prev, status: "active" } : null));
      setActivatingQr(false);

      // Fire-and-forget: confirmation + sample "what responders see" test-scan email.
      apiClient.notifications.sendActivationConfirmation({
        qrId: qrData.id,
        ownerName: effectiveName,
        category: qrData.category,
      }).catch(() => { /* non-blocking */ });

      setPhase("success");
    }, 400);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#F5F6FC] to-slate-100 text-slate-900 flex flex-col items-center justify-start font-sans relative selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* ── Multi-Layered Ambient Light & Grid Atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Precision Tech Dot Grid */}
        <div
          className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_35%,#000_60%,transparent_100%)]"
          style={{
            backgroundImage: "radial-gradient(rgba(100, 116, 139, 0.25) 1.25px, transparent 1.25px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top Radiant Amber / Gold Ambient Aura */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[380px] rounded-full blur-[100px] opacity-45 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(251,191,36,0.15) 50%, transparent 75%)" }}
        />

        {/* Subtle Bottom Cool Indigo / Cyan Glow */}
        <div
          className="absolute -bottom-28 right-1/4 w-[500px] h-[350px] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.12) 50%, transparent 80%)" }}
        />
      </div>

      {/* Main Visitor Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 pb-12 z-10 flex flex-col justify-center items-center">

        {/* ============ VALIDATING STATE (prevents blank screen during lookup) ============ */}
        {phase === "validating" && (
          <div className="w-full max-w-md mx-auto animate-fade-in p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-[#E11D48] mb-5">
              <Loader2 size={32} className="animate-spin text-[#E11D48]" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Verifying Smart Tag…</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Connecting securely to RapiQR network</p>
          </div>
        )}

        {/* ============ ERROR STATE (helpful message instead of blank screen) ============ */}
        {phase === "error" && (
          <div className="w-full max-w-md mx-auto animate-fade-in p-6 text-center">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-slate-200/80 shadow-2xl p-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">QR Sticker Not Found</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {errorMsg || "This QR code does not exist in the active fleet or was recently replaced."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                  else window.location.href = "/";
                }}
                className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {/* ============ GPS OFF STATE ============ */}
        {phase === "gps-off" && (
          <div className="w-full max-w-md mx-auto animate-fade-in p-6 text-center">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-slate-200/80 shadow-2xl p-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mx-auto">
                <MapPin size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">GPS Signal Offline</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Device GPS coordinates are temporarily unavailable. You can still message or call the owner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhase("emergency")}
                className="w-full py-3.5 px-6 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Continue to Tag View
              </button>
            </div>
          </div>
        )}

        {/* ============ ACTIVATION — Enter Activation Details (EXACT 1:1 DEEPINSPIRE UI) ============ */}
        {phase === "activation" && qrData && (
          <div className="w-full animate-fade-in">
            <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-white overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12 min-h-[620px] border border-slate-100 flex flex-col justify-between">
              
              {/* Illustrated Backdrop matching exact Deepinspire Vector Scene */}
              <img
                src={deepinspireScene}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0"
              />

              {/* Gradient mask for smooth text contrast on top left */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-0 w-full lg:w-3/5" />

              {/* Content Wrapper */}
              <div className="relative z-10 space-y-6">
                
                {/* 1. Header Section */}
                <div className="text-left max-w-xl space-y-1">
                  <div className="text-[#E11D48] font-black uppercase text-xs sm:text-sm tracking-wider">
                    DEEPINSPIRE · RAPIQR
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                    Let&apos;s connect
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md pt-1">
                    Have cool idea for new project? Need reliable partner to improve your product?<br className="hidden sm:inline" />
                    We are here to help you uncomplicate your product development.
                  </p>
                </div>

                {/* 2. Floating Form Card */}
                <div className="w-full max-w-lg bg-white rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-3.5 border border-slate-100/80 transition-all">
                  
                  {!otpStep ? (
                    <>
                      {/* Row 1: Your Name */}
                      <div className="rounded-full bg-[#f4f5f8] px-5 py-3 border border-transparent focus-within:border-[#E11D48] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/15 transition-all">
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => { setRegName(e.target.value); setActivationError(null); }}
                          placeholder="Your Name"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      {/* Row 2: Your email/phone */}
                      <div className="rounded-full bg-[#f4f5f8] px-4 py-2 flex items-center gap-2 border border-transparent focus-within:border-[#E11D48] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/15 transition-all">
                        <select
                          value={regCountry}
                          onChange={(e) => { setRegCountry(e.target.value); setActivationError(null); }}
                          title="Country code"
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
                        >
                          {ACTIVATION_COUNTRIES.map((c) => (
                            <option key={`${c.code}-${c.name}`} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                        <span className="text-slate-300">|</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={regPhone}
                          onChange={(e) => { setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setActivationError(null); }}
                          placeholder="Your email/phone"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      {/* Row 3: Company & Position (50% - 50% split) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-full bg-[#f4f5f8] px-5 py-3 border border-transparent focus-within:border-[#E11D48] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/15 transition-all">
                          <input
                            type="text"
                            value={getStickerCategoryLabel(qrData.category) || "Vehicle"}
                            readOnly
                            placeholder="Company"
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 cursor-default"
                          />
                        </div>
                        <div className="rounded-full bg-[#f4f5f8] px-5 py-3 border border-transparent focus-within:border-[#E11D48] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/15 transition-all">
                          <input
                            type="text"
                            value={qrData.id ? `#${qrData.id.slice(0, 8).toUpperCase()}` : "Smart Tag"}
                            readOnly
                            placeholder="Position"
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 cursor-default"
                          />
                        </div>
                      </div>

                      {/* Row 4: Message Box */}
                      <div className="rounded-[20px] bg-[#f4f5f8] px-5 py-3 border border-transparent focus-within:border-[#E11D48] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/15 transition-all">
                        <textarea
                          rows={2}
                          value={regMessage}
                          onChange={(e) => setRegMessage(e.target.value)}
                          placeholder="Message (optional notes or vehicle plate number)"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 resize-none"
                        />
                      </div>

                      {phoneMatchesBuyer && (
                        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-xs font-bold text-emerald-900 animate-fade-in">
                          <Check size={14} className="text-emerald-600 flex-shrink-0" />
                          <span>Purchase match detected — ready to activate.</span>
                        </div>
                      )}

                      {activationError && (
                        <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
                          {activationError}
                        </p>
                      )}

                      {/* Row 5: Center Aligned Red Pill CTA Button */}
                      <div className="text-center pt-2">
                        {phoneMatchesBuyer ? (
                          <button
                            type="button"
                            onClick={() => proceedToEmergencyContacts(true)}
                            disabled={activatingQr}
                            className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {activatingQr ? (
                              <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Activating…</span>
                            ) : (
                              <span>Send Message</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpSending}
                            className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {otpSending ? (
                              <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Sending OTP…</span>
                            ) : (
                              <span>Send Message</span>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* OTP Verification Form */
                    <div className="space-y-4 text-center py-2">
                      <h2 className="text-base font-black text-slate-900">Enter Verification Code</h2>
                      <p className="text-xs text-slate-500">
                        {otpSimulated
                          ? "Development mode: enter 000000 to verify."
                          : `Enter code sent to ${regCountry} ${regPhone}`}
                      </p>

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setActivationError(null); }}
                        placeholder="000000"
                        className="h-12 w-full rounded-full border border-slate-200 bg-[#f4f5f8] px-4 text-center font-mono text-xl font-black tracking-[0.4em] outline-none focus:bg-white focus:border-[#E11D48] text-slate-900 placeholder:text-slate-300"
                      />

                      {activationError && (
                        <p className="text-xs font-semibold text-red-500 bg-red-50 rounded-full py-1.5">
                          {activationError}
                        </p>
                      )}

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={handleVerifyOtpAndActivate}
                          disabled={activatingQr}
                          className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {activatingQr ? (
                            <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Verifying…</span>
                          ) : (
                            <span>Verify &amp; Connect</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOtpStep(false); setOtpInput(""); setActivationError(null); }}
                          className="block mx-auto text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1"
                        >
                          ← Change Phone
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============ EMERGENCY CONTACTS (after identity verified, before final activation) ============ */}
        {phase === "register" && qrData && (
          <div className="w-full animate-fade-in">
            <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-white overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12 min-h-[620px] border border-slate-100 flex flex-col justify-between">
              
              {/* Illustrated Backdrop */}
              <img
                src={guardianArt}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0 opacity-40 lg:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent pointer-events-none z-0 w-full lg:w-3/5" />

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="text-left max-w-xl space-y-1">
                  <div className="text-[#E11D48] font-black uppercase text-xs sm:text-sm tracking-wider">
                    STEP 2 OF 2 · GUARDIAN NETWORK
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                    Emergency Contacts
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md pt-1">
                    Add trusted family or friends to be alerted with your exact GPS location in any roadside emergency.
                  </p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-lg bg-white rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-4 border border-slate-100/80">
                  {isContactPickerSupported && (
                    <button
                      type="button"
                      onClick={handleImportContact}
                      className="w-full py-2.5 rounded-full border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Smartphone size={14} /> Import from phone contacts
                    </button>
                  )}

                  <div className="space-y-3">
                    {emergencyContacts.map((contact, idx) => (
                      <div key={contact.id} className="rounded-2xl border border-slate-200/80 bg-[#f8f9fc] p-4 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Contact {idx + 1} {idx === 0 ? "· Primary SOS" : ""}
                          </span>
                          {emergencyContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmergencyContact(contact.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                              aria-label={`Remove contact ${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="rounded-full bg-white px-4 py-2 border border-slate-200">
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(contact.id, "name", e.target.value)}
                            placeholder="Full name (e.g. Sarah Doe)"
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <div className="rounded-full bg-white px-4 py-2 border border-slate-200">
                            <input
                              type="text"
                              value={contact.relationship}
                              onChange={(e) => updateEmergencyContact(contact.id, "relationship", e.target.value)}
                              placeholder="Relationship (e.g. Spouse / Parent)"
                              className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {RELATIONSHIP_PRESETS.map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => updateEmergencyContact(contact.id, "relationship", label)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${contact.relationship === label
                                    ? "border-red-500 bg-[#E11D48] text-white font-extrabold"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                          <p className="text-[11px] font-semibold text-red-500">Enter a valid phone number.</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addEmergencyContactRow}
                    className="w-full py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    + Add another contact
                  </button>

                  {(contactsError || activationError) && (
                    <p className="text-xs font-semibold text-red-500 bg-red-50 rounded-2xl p-2.5">
                      {contactsError || activationError}
                    </p>
                  )}

                  <div className="text-center pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={handleFinishEmergencyContacts}
                      disabled={activatingQr}
                      className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {activatingQr ? (
                        <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Saving…</span>
                      ) : (
                        <span>Save &amp; Activate</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipEmergencyContacts}
                      disabled={activatingQr}
                      className="block mx-auto text-slate-500 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 py-1"
                    >
                      Skip for now →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============ LOCATION REQUEST ============ */}
        {phase === "location-request" && (
          <div className="w-full animate-fade-in">
            <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-white overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12 min-h-[500px] border border-slate-100 flex flex-col justify-between">
              
              <img
                src={deepinspireScene}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-0 w-full lg:w-3/5" />

              <div className="relative z-10 space-y-6">
                <div className="text-left max-w-xl space-y-1">
                  <div className="text-[#E11D48] font-black uppercase text-xs sm:text-sm tracking-wider">
                    PRECISION DISPATCH
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                    Location Access
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md pt-1">
                    To connect you with the vehicle owner or dispatch emergency help to your exact spot, please allow location access.
                  </p>
                </div>

                <div className="w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-4 border border-slate-100/80 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mx-auto">
                    <MapPin size={28} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Allow GPS in Browser</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Coordinates are encrypted and only transmitted during active emergency dispatch.
                  </p>
                  <button
                    onClick={requestLocation}
                    className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Allow GPS Location</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============ LOCATION DENIED ============ */}
        {phase === "location-denied" && (
          <div className="w-full animate-fade-in space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-7">
                <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] border border-white shadow-[0_25px_65px_-12px_rgba(220,38,38,0.15)] p-6 sm:p-8 text-center relative overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-500 absolute top-0 left-0 right-0" />
                  
                  <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-600 shadow-md shadow-red-500/10">
                    <AlertTriangle size={28} />
                  </div>
                  
                  <h2 className="text-xl font-black text-slate-900 mb-2">Location Access Blocked</h2>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                    Please enable location permission in your browser settings so responders know where your vehicle notification originated.
                  </p>
                  
                  <button
                    onClick={requestLocation}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="rounded-[24px] bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-4 text-left space-y-2">
                  <div className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                    How to enable GPS in browser:
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1.5">
                    <p>1. Tap the <strong>Lock / Settings icon</strong> in your browser address bar.</p>
                    <p>2. Select <strong>Permissions</strong> → <strong>Location</strong>.</p>
                    <p>3. Toggle to <strong>Allow</strong> and refresh.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ EMERGENCY SCREEN (Redesigned matching requested design mockup) ============ */}
        {phase === "emergency" && qrData && (
          <div className="w-full max-w-md mx-auto animate-fade-in space-y-2 pb-6">
            {/* ============ CATEGORY SCAN PAGE ============
                Every category the admin can mint a sticker for except car and
                bike, which keep the bespoke vehicle screens below. The whole
                screen — hero, six tiles, sheets — is driven by the category
                stored on the QR record. */}
            {!isBespokeCategory && (
              <CategoryScanView
                variant={categoryVariant}
                category={(qrData.category || "").trim().toLowerCase()}
                tagline={[qrData.vehicleName, qrData.vehicleNumber].filter(Boolean).join(" · ") || null}
                onAction={runVariantAction}
                onButton={runCategoryButton}
                onTileChange={() => setVariantProviderPanel(null)}
                providers={helplines}
                providerPanel={variantProviderPanel}
                onSendMessage={(text) => openChatWithMessage(text)}
                banner={variantBanner || locationShareBanner}
                busy={locationSharing || variantBusy}
              />
            )}

            {/* ============ MAIN MENU VIEW ============ */}
            {isBespokeCategory && activeSubMenu === "none" && (
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
                      onClick={() => setActiveSubMenu("towing")}
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
                      className="bg-white border border-gray-100 hover:border-yellow-300 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all min-h-[100px] shadow-2xs hover:shadow-sm relative group"
                    >
                      <ChevronRight size={12} className="text-gray-300 absolute top-2 right-2 group-hover:text-gray-500 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-1 flex-shrink-0 group-hover:scale-105 transition-transform">
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

                  {/* 6. INSTALL APP BAR — replaces the old AI Assistant entry point here */}
                  <InstallAppBar />
                </div>

                {/* 5. MESSAGE VEHICLE OWNER CARD — Big button opens popup & auto-sends SMS alert to owner */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                      <MessageSquare size={22} />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">
                        Message Vehicle Owner
                      </h4>
                      <p className="text-[11.5px] text-gray-400 font-medium mt-0.5">
                        Start a private chat. The owner receives a WhatsApp alert automatically.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const msg = "Hi, I scanned your vehicle's RapiQR code and need to contact you.";
                      openChatWithMessage(msg);
                    }}
                    className="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Message Owner</span>
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
            {isBespokeCategory && activeSubMenu !== "none" && (
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
                          <div
                            key={`amb-${i}`}
                            className="w-full bg-gray-100 text-gray-400 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center font-bold flex-shrink-0">
                                <Stethoscope size={22} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-sm font-black text-gray-500 tracking-tight">Request Ambulance</p>
                                <p className="text-[11px] font-medium text-gray-400 truncate">{amb.label}</p>
                              </div>
                            </div>
                            <div className="bg-white text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                              <Lock size={12} /> Soon
                            </div>
                          </div>
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
                      {/* Button 4: Alert Owner on WhatsApp */}
                      <button
                        onClick={() => {
                          sendQuickIssueAlert("Emergency Alert", qrData?.category === "car"
                            ? "I scanned the RepiQR tag on your car — there is an emergency at the vehicle."
                            : "I scanned the RepiQR tag on your bike — there is an emergency at the vehicle.");
                          flashVariantBanner("WhatsApp alert sent — the owner has been notified.");
                        }}
                        className="w-full bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-green-600/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                            <WhatsAppSvg size={22} />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-black text-white tracking-tight">Alert Owner on WhatsApp</p>
                            <p className="text-[11px] font-medium text-white/80">Sends alert + location to owner</p>
                          </div>
                        </div>
                        <div className="bg-white text-green-700 font-black text-xs px-3 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                          <WhatsAppSvg size={12} /> SEND
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

                {/* ============ MECHANIC SUB-MENU ============ */}
                {activeSubMenu === "mechanical" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button
                          onClick={() => setActiveSubMenu("none")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <img src={mechanicIcon} alt="Mechanic" className="w-4 h-4 object-contain" /> Mechanic
                        </span>
                      </div>

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Need Mechanic Assistance?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send a direct WhatsApp notification to the owner to report a mechanical issue.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Mechanic Needed", "Vehicle mechanical issue reported. Mechanic assistance requested.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Alert Owner on WhatsApp</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Mechanic").length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Mechanic").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                          <p className="text-xs font-semibold text-gray-400">No mechanic providers configured</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add Mechanic providers in Communication settings</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============ TOWING SUB-MENU ============ */}
                {activeSubMenu === "towing" && (() => {
                  const ownerContact = getTowingContacts().find((c) => c.primary) || getTowingContacts()[0] || null;
                  return (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                        <button
                          onClick={() => setActiveSubMenu("none")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          <ArrowLeft size={14} /> Back
                        </button>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <img src={towIcon} alt="Tow Truck" className="w-4 h-4 object-contain" /> Tow Truck
                        </span>
                      </div>

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Towing / Breakdown Recovery?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Alert the owner on WhatsApp to request towing assistance for this vehicle.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Towing Service Needed", "Roadside breakdown / towing assistance requested for your vehicle.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Alert Owner on WhatsApp</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
                          </button>
                        </div>
                      ) : null}

                      {getAdminContacts("Towing").length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">Admin Helplines</p>
                          {getAdminContacts("Towing").map((c, i) => (
                            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 leading-tight">{c.label}</p>
                                <p className="text-sm font-mono font-bold text-gray-700 mt-1">{c.phone}</p>
                              </div>
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                          <p className="text-xs font-semibold text-gray-400">No towing providers configured</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add Towing providers in Communication settings</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                              disabled
                              className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed"
                            >
                              <Lock size={14} /> Soon
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
                              disabled
                              className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed"
                            >
                              <Lock size={14} /> Soon
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

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Vehicle Blocking Path?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send a direct WhatsApp notification to the owner to request moving their vehicle.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Parking Issue", "Hi, your vehicle is blocking a path/driveway. Please move it as soon as possible.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Alert Owner on WhatsApp</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
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
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
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

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Headlights Left On?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Alert the owner immediately on WhatsApp so their vehicle battery doesn't drain.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Headlights On", "Hi, your vehicle's headlights are left turned on. Please check them.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Alert Owner on WhatsApp</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
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
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
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

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Suspicious Activity / Tampering?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send an emergency alert directly to the owner on WhatsApp.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Theft Alert", "EMERGENCY: Someone reported suspicious activity or potential theft regarding your vehicle.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Send Emergency WhatsApp Alert</span>
                        </button>
                      </div>

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
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
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
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

                      {/* Manual Full-Colored RepiChat Action Card */}
                      <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-900">Flat Tyre Detected?</p>
                        <p className="text-[11px] text-gray-500 font-medium">Send a WhatsApp alert to the vehicle owner.</p>
                        <button
                          onClick={() => sendQuickIssueAlert("Flat Tyre", "Hi, noticed a flat tyre on your vehicle. Please check it.")}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#15A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer mt-1"
                        >
                          <WhatsAppSvg className="w-5 h-5" />
                          <span>Alert Owner on WhatsApp</span>
                        </button>
                      </div>

                      {!flatTireImage ? (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                          <p className="text-[11px] font-semibold text-gray-500 px-0.5">Add a photo of the flat tyre so help arrives prepared.</p>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="bg-[#EAB308] hover:bg-[#CA8A04] text-gray-950 font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all text-center">
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

                            <label className="bg-white border-2 border-yellow-300 hover:bg-yellow-50/50 text-amber-800 font-extrabold text-xs py-4 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all text-center">
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
                        <div className="space-y-2">
                          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 h-28 bg-gray-900 flex items-center justify-center shadow-xs">
                            <img src={flatTireImage} alt="Flat Tyre" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                              <span className="text-white font-extrabold text-xs flex items-center gap-1">
                                <Check size={14} className="text-emerald-400" /> Photo Attached
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
                          <button
                            onClick={() => sendQuickIssueAlert("Flat Tyre", "Hi, noticed a flat tyre on your vehicle (photo attached). Please check it.")}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                          >
                            <Check size={15} />
                            <span>Send Photo & Alert Owner</span>
                          </button>
                        </div>
                      )}

                      {ownerContact ? (
                        <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle Owner Call</p>
                            <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Lock size={11} /> Number hidden — masked call</p>
                          </div>
                          <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                            <Lock size={14} /> Soon
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
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-not-allowed">
                                <Lock size={14} /> Soon
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
          <div className="w-full animate-fade-in">
            <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-white overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12 min-h-[560px] border border-slate-100 flex flex-col justify-between">
              
              <img
                src={deepinspireScene}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-0 w-full lg:w-3/5" />

              <div className="relative z-10 space-y-6">
                <div className="text-left max-w-xl space-y-1">
                  <div className="text-[#E11D48] font-black uppercase text-xs sm:text-sm tracking-wider">
                    24/7 PROTECTION ACTIVE
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                    All set! Tag is Live.
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md pt-1">
                    Your {getStickerCategoryLabel(qrData.category) || "smart sticker"} is now active and protected with 24/7 SafeSync™ call proxy and emergency SOS.
                  </p>
                </div>

                <div className="w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] p-6 sm:p-8 space-y-4 border border-slate-100/80 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Protected &amp; Ready</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Preview how bystanders will see and interact with your smart QR code.
                  </p>
                  <button
                    onClick={() => setPhase("emergency")}
                    className="rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm px-10 py-3.5 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Preview Public Scan View</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Floating Install App Button — replaces the old floating AI-assistant
            trigger in this spot (and the full-width "RapiQR AI Assistant" bar
            was replaced by InstallAppBar above). The assistant itself is still
            reachable via the category tiles' "Ask" action (see handleCategoryButtonAction). */}
        <InstallAppFab />

        {/* ============ ASSISTANT CHAT ============ */}
        <AssistantChat
          open={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          variant={categoryVariant}
          onAskServer={async (messages) => {
            // Routed through the backend so the model API key never ships to the browser
            const res = await apiClient.ai.chat(messages, qrData?.vehicleNumber);
            return res?.reply || null;
          }}
        />

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
                    <h3 className="font-extrabold text-sm">Anonymous Call — {maskedCallTarget.label}</h3>
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
                {maskedCallBusy && (
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    <p className="text-xs font-semibold text-gray-500">Generating a private number…</p>
                  </div>
                )}

                {!maskedCallBusy && maskedCallError && (
                  <div className="space-y-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                      <AlertTriangle size={14} /> {maskedCallError}
                    </p>
                    <button
                      onClick={() => fetchMaskedCallNumber(maskedCallTarget)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!maskedCallBusy && maskedCallDid && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Tap below to call — you'll be connected to {maskedCallTarget.label.toLowerCase()} without either of you seeing the other's real number.
                    </p>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 py-3 text-center">
                      <p className="text-lg font-extrabold tracking-wide text-blue-700">{maskedCallDid}</p>
                    </div>
                    <a
                      href={`tel:${maskedCallDid}`}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer text-sm"
                    >
                      <PhoneCall size={16} /> Call Now
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RepiChat — real-time in-app chat with the sticker owner (replaces WhatsApp deep links) */}
      {chatOpen && qrData && (
        <div
          className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4 bg-black/50 sm:backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Chat with the owner"
          onClick={() => {
            setChatOpen(false);
            setChatInitialMessage(undefined);
          }}
        >
          {/* Full-bleed sheet on a phone (dvh, so the mobile browser bars don't
              clip the composer); a floating card from the sm breakpoint up. */}
          <div
            className="w-full h-dvh sm:h-[min(38rem,88vh)] sm:w-auto sm:max-w-md sm:min-w-[24rem] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <RepiChat
              mode="customer"
              qrId={qrData.id}
              customerName={visitorName || undefined}
              initialMessage={chatInitialMessage}
              subtitle={`${qrData.vehicleName || "Vehicle"}${qrData.vehicleNumber ? ` · ${qrData.vehicleNumber}` : ""}`}
              onClose={() => {
                setChatOpen(false);
                setChatInitialMessage(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
