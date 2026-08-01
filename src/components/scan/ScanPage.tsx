import React, { useState, useEffect, useCallback, useRef } from "react";
import { getQrCodeByIdFromDb, activateQrInDb } from "../../lib/supabaseService";
import { getStickerCategoryLabel, getCategoryIcon, getCategoryLabel } from "../../stickerModules";
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

  Activity,
  Camera,
  Upload,
  Check,
  Send,
  Bot,
  Disc,
  Siren,
  Lightbulb,
  Battery,
  Settings
} from "lucide-react";

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
  activationCode?: string;
  category?: string;
}

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

/* ---------------------------------------------------------------------- */
/*  Constants & Helpers                                                     */
/* ---------------------------------------------------------------------- */

function getQrBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://namoqr.linkspace-service.workers.dev";
}

function getQrIdFromUrl(): string | null {
  const path = window.location.pathname;
  const hash = window.location.hash;
  const directMatch = path.match(/^\/([^/]+)/);
  const hashMatch = hash.match(/#\/qr\/([^/]+)/);
  const legacyMatch = path.match(/\/qr\/([^/]+)/);

  if (directMatch && directMatch[1] !== "") {
    const id = directMatch[1];
    if (id.toUpperCase().startsWith("QR") || id.toUpperCase().startsWith("CL")) {
      return decodeURIComponent(id);
    }
  }
  if (hashMatch) return decodeURIComponent(hashMatch[1]);
  if (legacyMatch) return decodeURIComponent(legacyMatch[1]);
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

export default function ScanPage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("validating");
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [alertSent, setAlertSent] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [activatingQr, setActivatingQr] = useState(false);
  const [activationCodeInput, setActivationCodeInput] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<"none" | "emergency-main" | "mechanical" | "medical" | "towing" | "family">("none");
  const [towingImage, setTowingImage] = useState<string | null>(null);

  // Registration form fields (after activation code is validated)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmergencyPhone, setRegEmergencyPhone] = useState("");
  const [regBloodGroup, setRegBloodGroup] = useState("O+");
  const [regAllergies, setRegAllergies] = useState("");
  const [regAddress, setRegAddress] = useState("");

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

  const handleActivateNow = () => {
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

    const storedCode = qrData.activationCode;
    if (!storedCode) {
      setActivationError("No activation code set for this sticker. Contact the admin.");
      return;
    }

    const entered = activationCodeInput.trim().toUpperCase();
    if (!entered) {
      setActivationError("Please enter your activation code.");
      return;
    }

    if (entered !== storedCode.toUpperCase()) {
      setActivationError("Invalid activation code. Please try again.");
      return;
    }

    handleRegisterSubmit();
  };

  const handleSendAiMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInput;
    if (!promptToSend.trim() || aiLoading) return;

    const userMsg = { role: 'user' as const, content: promptToSend };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated);
    if (!customPrompt) setAiInput('');
    setAiLoading(true);

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "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";

    // Array of active free models on OpenRouter
    const freeModels = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.5-flash:free",
      "deepseek/deepseek-r1:free",
      "openrouter/auto"
    ];

    let reply = "";
    for (const modelId of freeModels) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "RapiQR Emergency AI Assistant",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: "system",
                content: `You are RapiQR Safety AI Assistant assisting a user who scanned vehicle QR tag ${qrData?.vehicleNumber || 'QR Tag'}. Help with wrong parking, emergency medical first aid, towing, or owner contact. Be concise, practical, direct, and polite.`
              },
              ...updated
            ]
          })
        });

        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
          break; // Success! Exit loop
        }
      } catch {
        // Try next model if fetch fails
      }
    }

    if (!reply) {
      reply = "I am RapiQR Safety AI Assistant. How can I help you contact the vehicle owner or arrange emergency help?";
    }

    setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setAiLoading(false);
  };

  const handleSendCustomMessage = () => {
    if (!visitorMessage.trim()) return;
    if (qrData) {
      const payload = {
        qrId: qrData.id,
        qrUrl: qrData.qrUrl,
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        accuracy: location?.accuracy || 0,
        deviceId: navigator.userAgent.slice(0, 40),
        timestamp: new Date().toISOString(),
        message: `Custom Message: ${visitorMessage}`,
        vehicleName: qrData.vehicleName,
        vehicleNumber: qrData.vehicleNumber,
      };
      const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
      alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
      localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
      alert("Custom message sent to vehicle owner!");
      setVisitorMessage("");
    }
  };

  /* ---- Get Admin Provided Contact Numbers ---- */
  const getTowingContacts = (filterCategory?: string) => {
    if (!qrData) return [];
    const storedQrList = JSON.parse(localStorage.getItem("namoqr-qrlist") || "[]");
    const storedClientStickers = JSON.parse(localStorage.getItem("namoqr-client-stickers") || "[]");
    const adminHelplines = JSON.parse(localStorage.getItem("namoqr-helplines") || "[]");

    const allRecords = [...storedQrList, ...storedClientStickers];
    const fullRecord = allRecords.find((q: any) => q.id === qrData.id || q.clientId === qrData.clientId) || {};
    const contacts: { label: string; phone: string; role: string; primary?: boolean; category?: string }[] = [];

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

    // 2. Secondary Emergency Phone
    if (fullRecord.secondaryPhone || fullRecord.altPhone) {
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
    const stored = localStorage.getItem("namoqr-qrlist");
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
            activationCode: dbRecord.activation_code,
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
        activationCode: record.activationCode,
        category: record.category,
      };
      setQrData(data);

      // First-time scan → activation code required; Already active → emergency page
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
        localStorage.setItem("namoqr-qrlist", JSON.stringify(updatedList));
        resolveQr(fallback);
      } else {
        setErrorMsg(`QR "${qrId}" not found or invalid.`);
        setPhase("error");
      }
    }
  }, [requestLocation]);

  /* ---- Registration Form Submit (after activation code validated) ---- */
  const handleRegisterSubmit = () => {
    if (!qrData) return;
    if (!regName.trim() || !regPhone.trim()) {
      setActivationError("Please enter your name and phone number.");
      return;
    }

    setActivatingQr(true);

    const fullPhone = regPhone.trim().startsWith("+")
      ? regPhone.trim()
      : `${regCountry}${regPhone.trim().replace(/\s+/g, "")}`;

    // Save to Supabase
    activateQrInDb({
      qrId: qrData.id,
      category: qrData.category || "car",
      ownerName: regName.trim(),
      ownerPhone: fullPhone,
      emergencyPhone: regEmergencyPhone.trim(),
      bloodGroup: regBloodGroup,
      allergies: regAllergies.trim(),
      address: regAddress.trim(),
    });

    setTimeout(() => {
      // Also save to localStorage as fallback
      const stored = localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);

      const registrationData = {
        ownerName: regName.trim(),
        ownerPhone: fullPhone,
        emergencyPhone: regEmergencyPhone.trim(),
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
        list[idx].secondaryPhone = registrationData.emergencyPhone;
        list[idx].bloodGroup = registrationData.bloodGroup;
        list[idx].allergies = registrationData.allergies;
        list[idx].address = registrationData.address;
        list[idx].visitorMessage = "Self-activated via code";
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
        localStorage.setItem("namoqr-qrlist", JSON.stringify([newRecord, ...list]));
      }

      setQrData((prev) => (prev ? { ...prev, status: "active" } : null));
      setActivatingQr(false);
      setPhase("success");
      setTimeout(() => {
        setPhase("emergency");
      }, 2000);
    }, 800);
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

      const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
      alerts.unshift({ ...payload, id: Date.now() + index, status: "sent" });
      localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));

      const stored = localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);
      if (idx >= 0) {
        list[idx].scans = (list[idx].scans || 0) + 1;
        list[idx].lastScannedAt = new Date().toISOString();
        list[idx].lastLocation = { lat: currentLoc.lat, lng: currentLoc.lng };
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

      {/* Top RapiQR Brand Header Bar */}
      <header className="w-full max-w-md mx-auto pt-3 px-4 flex items-center justify-between z-20">

      </header>

      {/* Main Light Visitor Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-2 pb-5 z-10 flex flex-col justify-center items-center">
        {/* ============ ACTIVATION — Enter Activation Code ============ */}
        {phase === "activation" && qrData && (
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* ——— Yellow Gradient Header ——— */}
              <div className="relative bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 px-8 pt-10 pb-16">
                <h1 className="mt-5 text-center text-3xl font-bold text-slate-900">
                  Activate Your {getStickerCategoryLabel(qrData.category) || "Sticker"}
                </h1>
                <p className="mt-2 text-center text-sm text-slate-700">
                  Enter your details below to activate this QR tag
                </p>
                {/* Decorative circles */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" />
                <div className="absolute -left-8 bottom-4 h-20 w-20 rounded-full bg-white/10" />
              </div>

              {/* ——— Overlapping White Body ——— */}
              <div className="rounded-t-3xl bg-white px-6 pb-4 pt-2">

                {/* Tag Card */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                      {getCategoryIcon((qrData.category || "car") as any)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {getCategoryLabel((qrData.category || "car") as any)}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Single Activation Form: Name + Phone Number */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => { setRegName(e.target.value); setActivationError(null); }}
                      placeholder="Enter your full name"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={regCountry}
                        onChange={(e) => { setRegCountry(e.target.value); setActivationError(null); }}
                        title="Country dial code"
                        className="h-12 w-24 flex-shrink-0 rounded-xl border border-slate-200 px-2 text-sm outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200 font-bold bg-white"
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
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {activationError && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                      <AlertTriangle size={12} />
                      {activationError}
                    </p>
                  )}

                  <button
                    onClick={handleRegisterSubmit}
                    disabled={activatingQr}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold shadow-md transition-all hover:scale-[1.02] active:scale-100 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 text-xs"
                  >
                    {activatingQr ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Activating…</span>
                      </>
                    ) : (
                      <><ShieldCheck size={16} /> Activate Sticker</>
                    )}
                  </button>
                </div>


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
            {/* 1. TOP VEHICLE CARD */}
            <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 shadow-sm space-y-2">
              {/* Header Row: Live Badge & Brand Logo */}
              <div className="flex items-center justify-between">
                <span className="bg-red-50 text-[#D92D20] border border-red-100 font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#D92D20] animate-pulse" />
                  LIVE
                </span>
                <button onClick={onBack} className="cursor-pointer flex items-center">
                  <img src={logoForWhBg} alt="RapiQR Logo" className="h-5 sm:h-6 w-auto object-contain" />
                </button>
              </div>

              {/* Vehicle Profile Info Row */}
              <div className="flex items-center gap-3 pt-0.5">
                <img
                  src={
                    (qrData as any).vehicleImage ||
                    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={qrData.vehicleName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-gray-100 shadow-xs flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate tracking-tight">
                    {qrData.vehicleName}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-0.5">
                    Vehicle No. <span className="text-[#D92D20] font-black">{qrData.vehicleNumber}</span>
                  </p>

                </div>
              </div>
            </div>

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
                      onClick={() => {
                        const parking = getAdminContacts("Parking");
                        if (parking.length > 0) {
                          window.open(`tel:${parking[0].phone.replace(/[^0-9+]/g, "")}`);
                        } else if (qrData && location) {
                          const payload = {
                            qrId: qrData.id,
                            qrUrl: qrData.qrUrl,
                            latitude: location.lat,
                            longitude: location.lng,
                            accuracy: location.accuracy,
                            deviceId: navigator.userAgent.slice(0, 40),
                            timestamp: new Date().toISOString(),
                            message: "Parking Issue / Blocking Path Alert",
                            vehicleName: qrData.vehicleName,
                            vehicleNumber: qrData.vehicleNumber,
                          };
                          const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
                          alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
                          localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
                          alert("Parking Issue alert sent to vehicle owner!");
                        }
                      }}
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
                      onClick={() => setActiveSubMenu("mechanical")}
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
                      onClick={() => {
                        const theft = getAdminContacts("Theft");
                        if (theft.length > 0) {
                          window.open(`tel:${theft[0].phone.replace(/[^0-9+]/g, "")}`);
                        } else {
                          setActiveSubMenu("family");
                        }
                      }}
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
                      onClick={() => {
                        const headlights = getAdminContacts("Headlights");
                        if (headlights.length > 0) {
                          window.open(`tel:${headlights[0].phone.replace(/[^0-9+]/g, "")}`);
                        } else {
                          setActiveSubMenu("medical");
                        }
                      }}
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
                      <Sparkles size={13} /> CHAT
                    </div>
                  </button>                </div>

                {/* 5. MESSAGE VEHICLE OWNER CARD */}
                <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-900 leading-tight">
                      Message Vehicle Owner
                    </label>
                    <input
                      type="text"
                      value={visitorMessage}
                      onChange={(e) => setVisitorMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendCustomMessage();
                      }}
                      placeholder="Type your message here..."
                      className="w-full bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none font-normal mt-0.5"
                    />
                  </div>
                  <button
                    onClick={handleSendCustomMessage}
                    className="h-10 px-4 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center gap-1.5 shadow-xs flex-shrink-0 active:scale-95 transition-all cursor-pointer font-bold text-xs"
                  >
                    <Send size={14} className="fill-white text-white" />
                    Send
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

                      {/* Button 2: Call Family Members (from Admin Communication Page) */}
                      {getAdminContacts("Family").length > 0 ? (
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
                                {getAdminContacts("Family").length} contact{getAdminContacts("Family").length !== 1 ? "s" : ""} available
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
                          <p className="text-[10px] text-gray-300 mt-0.5">Ask admin to add Family contacts in Communication settings</p>
                        </div>
                      )}

                      {/* Button 3: Share Location */}
                      <button
                        onClick={() => {
                          if (location) {
                            const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                            window.open(mapsUrl);
                            if (qrData) {
                              const payload = {
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
                              };
                              const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
                              alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
                              localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
                              alert("Emergency location link generated & dispatched!");
                            }
                          } else {
                            requestLocation();
                          }
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer"
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
                          <Navigation size={14} /> SEND
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ============ VEHICLE HELP SUB-MENU CARD ============ */}
                {activeSubMenu === "mechanical" && (
                  <div className="space-y-3 animate-fade-in">
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
                        onClick={() => {
                          const flatTire = getAdminContacts("Flat Tire");
                          if (flatTire.length > 0) window.open(`tel:${flatTire[0].phone.replace(/[^0-9+]/g, "")}`);
                        }}
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
                              : "Not configured"}
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
                        onClick={() => setActiveSubMenu("mechanical")}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                          <Truck size={16} className="text-red-500" /> Towing Service
                        </span>
                      </div>
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
                                  <p className="text-sm font-mono font-black text-gray-800 mt-1">{c.phone}</p>
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
                          {getAdminContacts("Family").length} number{getAdminContacts("Family").length !== 1 ? "s" : ""} available
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => location && window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-gray-900">Share My Live Location</p>
                        <p className="text-[10px] font-semibold text-gray-400">Send GPS pin to contacts</p>
                      </div>
                      <ExternalLink size={14} className="text-gray-300 flex-shrink-0 ml-auto" />
                    </button>

                    {getAdminContacts("Family").length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <PhoneCall size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">No family contacts configured</p>
                        <p className="text-[11px] text-gray-300 mt-1">Ask admin to add Family contacts in Communication settings</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
              </div>
            )}
          </div>
        )}

        {/* ============ SUCCESS (Light Mode) ============ */}
        {phase === "success" && qrData && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-6 sm:p-8 text-center animate-fade-in w-full space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-md shadow-emerald-500/10">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Alert Dispatched!</h2>
              <p className="text-xs text-gray-500 mt-1">The vehicle owner has been notified of your emergency ping.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left space-y-2">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Alert Summary</p>
              <div className="text-xs font-semibold text-gray-800 space-y-1">
                <p>• Vehicle: <span className="font-mono font-bold text-gray-900">{qrData.vehicleNumber}</span></p>
                <p>• Time: {formatTime(new Date().toISOString())}</p>
                {location && <p>• Location: {formatCoord(location.lat)}, {formatCoord(location.lng)}</p>}
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full py-3.5 rounded-2xl bg-yellow-400 text-gray-900 font-bold text-sm shadow-md active:scale-95 transition-all hover:bg-yellow-500"
            >
              Done
            </button>
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      RapiQR Safety AI Assistant
                      <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">OpenRouter</span>
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium">Instant Emergency &amp; Owner Assistance</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-900 text-amber-400'
                      }`}>
                      {msg.role === 'user' ? 'U' : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-2xs ${msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white p-3 rounded-2xl border border-gray-200 max-w-[200px]">
                    <Sparkles size={14} className="animate-spin text-amber-500" />
                    <span>AI Assistant is typing...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
                {[
                  '🚨 Vehicle Blocking Driveway',
                  '🚗 Need Towing Assistance',
                  '🚑 Medical Emergency Advice',
                  '📱 How to Reach Owner'
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendAiMessage(chip)}
                    className="text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 px-3 py-1.5 rounded-full whitespace-nowrap border border-gray-200/60 transition-colors flex-shrink-0 cursor-pointer"
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
                className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask AI safety assistant..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || aiLoading}
                  className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white flex items-center justify-center font-bold shadow-xs transition-all flex-shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
