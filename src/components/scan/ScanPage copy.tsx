import React, { useState, useEffect, useCallback, useRef } from "react";
import { getQrCodeByIdFromDb } from "../../lib/supabaseService";
import groupLogo from "../../../assets/Group 1000005716.png";
import groupLogo1 from "../../../assets/darkbglogo.png";
import groupLogo2 from "../../../assets/Group 1000005716-2.png";
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
  Fuel,
  Activity,
  Camera,
  Upload,
  Check,
  Send,
  Bot,
  Disc,
  Siren
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Types                                                                   */
/* ---------------------------------------------------------------------- */

type Phase =
  | "validating"
  | "activation"
  | "location-request"
  | "location-denied"
  | "gps-off"
  | "emergency"
  | "sending"
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
              <stop offset="35%" stopColor="#FACC15" />
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

/* ---------------------------------------------------------------------- */
/*  Main Light Theme Component                                             */
/* ---------------------------------------------------------------------- */

export default function ScanPage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("validating");
  const [progress, setProgress] = useState(0);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateProgress, setActivateProgress] = useState(0);
  const [activateStatus, setActivateStatus] = useState("");
  const [alertSent, setAlertSent] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [activatingQr, setActivatingQr] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<"none" | "emergency-main" | "mechanical" | "medical" | "towing" | "family">("none");
  const [towingImage, setTowingImage] = useState<string | null>(null);

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

  /* ---- QR Validation Effect ---- */
  useEffect(() => {
    const qrId = getQrIdFromUrl();
    if (!qrId) {
      setErrorMsg("No QR code ID found in URL.");
      setPhase("error");
      return;
    }

    const startTime = Date.now();
    const duration = 600;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(prog);

      if (prog >= 100) {
        clearInterval(interval);

        setTimeout(async () => {
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
            try {
              const dbRecord = await getQrCodeByIdFromDb(cleanQrId);
              if (dbRecord) {
                found = {
                  id: dbRecord.id,
                  clientId: dbRecord.client_id,
                  status: dbRecord.status,
                  vehicleName: `Vehicle (${dbRecord.id})`,
                  vehicleNumber: `REG-${dbRecord.id.slice(-4)}`,
                  template: dbRecord.template_name || "Default",
                };
              }
            } catch {
              // fallback below
            }
          }

          // Universal fallback: If valid QR format (QR- or CL-), auto-initialize as activatable sticker
          if (!found && (cleanQrId.startsWith("QR") || cleanQrId.startsWith("CL"))) {
            found = {
              id: cleanQrId,
              clientId: cleanQrId.startsWith("CL") ? cleanQrId : `CL${cleanQrId.replace(/^QR/, "")}`,
              vehicleName: `RapiQR Safety Tag (${cleanQrId})`,
              vehicleNumber: `REG-${cleanQrId.slice(-4)}`,
              status: "inactive",
              template: "Default",
            };
            const updatedList = [found, ...list];
            localStorage.setItem("namoqr-qrlist", JSON.stringify(updatedList));
          }

          if (!found) {
            setErrorMsg(`QR "${qrId}" not found or invalid.`);
            setPhase("error");
            return;
          }

          const data = {
            id: found.id,
            qrUrl: `${getQrBaseUrl()}/${found.id}`,
            vehicleName: found.vehicleName || `Vehicle (${found.id})`,
            vehicleNumber: found.vehicleNumber || `REG-${found.id.slice(-4)}`,
            clientId: found.clientId || found.id,
            status: found.status || "inactive",
            template: found.template || "Default",
          };
          setQrData(data);

          // Immediately switch phase upon reaching 100% progress
          if (found.status === "inactive") {
            setPhase("activation");
          } else {
            setPhase("emergency");
            requestLocation();
          }
        }, 50);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [requestLocation]);

  /* ---- Activation Handler ---- */
  const handleActivation = () => {
    if (!qrData) return;
    setActivatingQr(true);
    setTimeout(() => {
      const stored = localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);
      if (idx >= 0) {
        list[idx].status = "active";
        list[idx].activatedAt = new Date().toISOString();
        list[idx].visitorName = visitorName;
        list[idx].visitorMessage = visitorMessage;
        localStorage.setItem("namoqr-qrlist", JSON.stringify(list));
      }
      setQrData((prev) => (prev ? { ...prev, status: "active" } : null));
      setActivatingQr(false);
      requestLocation();
    }, 1200);
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
      <header className="w-full max-w-md mx-auto pt-4 px-4 flex items-center justify-between z-20">
        <button onClick={onBack} className="flex items-center cursor-pointer">
          <img src={groupLogo} alt="RapiQR Logo" className="h-9 sm:h-10 w-auto object-contain" />
        </button>

      </header>

      {/* Main Light Visitor Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-12 z-10 flex flex-col justify-center items-center">
        {/* ============ VALIDATING (Minimalist Boxless Grid) ============ */}
        {phase === "validating" && (
          <div className="flex flex-col items-center w-full max-w-sm px-2 animate-fade-in space-y-5 text-center">
            {/* Sleek Minimalist Ring Spinner */}
            <div className="relative flex items-center justify-center py-2">
              <div className="w-12 h-12 rounded-full border-2 border-gray-100 border-t-yellow-500 animate-spin" />
            </div>

            {/* Minimalist Title */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Verifying QR Code</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Connecting to Safety Network</p>
            </div>

            {/* Minimalist Progress Indicator */}
            <div className="w-full space-y-1">
              <div className="w-full h-1 bg-gray-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75 ease-out"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #EAB308, #F59E0B)" }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-gray-400">
                <span>VERIFYING</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Clean Minimalist 2x2 Grid Checklist */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1 text-left">
              {[
                { label: "Safety Network", minPct: 20 },
                { label: "Security Token", minPct: 50 },
                { label: "Vehicle Data", minPct: 80 },
                { label: "Live Connection", minPct: 98 },
              ].map((step, idx) => {
                const isDone = progress >= step.minPct;
                const isActive = progress < step.minPct && (idx === 0 || progress >= [20, 50, 80, 98][idx - 1]);

                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 ${isDone
                      ? "bg-white border-emerald-200 text-gray-900 font-semibold shadow-2xs"
                      : isActive
                        ? "bg-yellow-50/60 border-yellow-200 text-yellow-700 font-bold"
                        : "bg-gray-50/50 border-gray-100 text-gray-400 font-normal opacity-50"
                      }`}
                  >
                    <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                      {isDone ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : isActive ? (
                        <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className="text-[11px] tracking-tight truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ ACTIVATION (Super Clean & Minimal) ============ */}
        {phase === "activation" && qrData && (
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
              {/* Sleek Vehicle Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                <div className="w-11 h-11 rounded-2xl bg-[#EAB308] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-yellow-500/20">
                  <Car size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-gray-900 text-base truncate">{qrData.vehicleName}</h3>
                  <p className="font-mono text-xs font-bold text-gray-500">{qrData.vehicleNumber}</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  UNACTIVATED
                </span>
              </div>

              {/* Simple Explanation */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">QR Sticker Not Yet Activated</h2>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  If you are the owner, enter your activation code in the app. Otherwise, notify the owner below.
                </p>
              </div>

              {/* Minimal Message Form */}
              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#EAB308] transition-all font-medium"
                />
                <textarea
                  rows={2}
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  placeholder="Message for owner (e.g. Please move vehicle)"
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#EAB308] transition-all font-medium resize-none"
                />
              </div>

              {/* Clean Single Action Button */}
              <button
                onClick={handleActivation}
                disabled={activatingQr}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60"
                style={{ background: activatingQr ? "#6B7280" : "#EAB308" }}
              >
                {activatingQr ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Notify Owner &amp; Continue
                  </>
                )}
              </button>
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
          <div className="w-full max-w-md mx-auto animate-fade-in space-y-4">
            {/* Top Red Header Banner */}
            <div className="bg-[#B91C1C] rounded-3xl p-5 text-white shadow-xl space-y-4 relative overflow-hidden">
              {/* Top Bar: LIVE Logo & Vehicle Emergency Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white text-[#B91C1C] font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-ping" />
                    LIVE
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black text-lg tracking-tight">Rapi</span>
                    <span className="text-amber-300 font-black text-lg tracking-tight">QR</span>
                  </div>
                </div>

              </div>

              {/* Vehicle Profile Info Row */}
              <div className="flex items-center gap-3 pt-0.5">
                <img
                  src={
                    (qrData as any).vehicleImage ||
                    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={qrData.vehicleName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white/30 shadow-md flex-shrink-0"
                />
                <div className="min-w-0 space-y-0">
                  <h1 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                    {qrData.vehicleName}
                  </h1>
                  <p className="text-[11px] sm:text-xs font-bold text-white/90">
                    Vehicle NO.- {qrData.vehicleNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Area (White Card Container) */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 space-y-5">


              {/* ============ MAIN MENU VIEW ============ */}
              {activeSubMenu === "none" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Big Red Emergency Main Button */}
                  <button
                    onClick={() => setActiveSubMenu("emergency-main")}
                    className="w-full bg-[#B91C1C] hover:bg-[#A01818] text-white rounded-3xl p-5 sm:p-6 text-center shadow-lg shadow-red-700/20 active:scale-[0.98] transition-all cursor-pointer block group"
                  >
                    <EmergencySirenGraphic />
                    <h3 className="text-lg sm:text-xl font-black text-white mt-2 tracking-tight">
                      This is emergency or an accident
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-white/90 mt-1">
                      Notify/Call contacts, share location, request ambulance.
                    </p>
                  </button>

                  {/* Quick Actions Header */}
                  <div>
                    <h3 className="text-lg font-black text-gray-900 mb-3">Quick Actions</h3>

                    {/* 3 Columns x 2 Rows Grid */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {/* 1. Request Tow truck */}
                      <button
                        onClick={() => {
                          setActiveSubMenu("towing");
                          setTowingImage(null);
                        }}
                        className="bg-[#FF2E2E] hover:bg-[#E02626] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <Truck size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">Request Tow truck</span>
                      </button>

                      {/* 2. Request Mechanic */}
                      <button
                        onClick={() => setActiveSubMenu("mechanical")}
                        className="bg-[#FF8A00] hover:bg-[#E57C00] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <Wrench size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">Request Mechanic</span>
                      </button>

                      {/* 3. AI First Aid Assistant */}
                      <button
                        onClick={() => setActiveSubMenu("medical")}
                        className="bg-[#28A745] hover:bg-[#23923D] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <Bot size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">AI First Aid Assistant</span>
                      </button>

                      {/* 4. Parking Issue / Blocking path */}
                      <button
                        onClick={() => {
                          if (qrData && location) {
                            const payload = {
                              qrId: qrData.id,
                              qrUrl: qrData.qrUrl,
                              latitude: location.lat,
                              longitude: location.lng,
                              accuracy: location.accuracy,
                              deviceId: navigator.userAgent.slice(0, 40),
                              timestamp: new Date().toISOString(),
                              message: "No Parking / Blocking Path Alert",
                              vehicleName: qrData.vehicleName,
                              vehicleNumber: qrData.vehicleNumber,
                            };
                            const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
                            alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
                            localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
                            alert("Parking Alert sent to vehicle owner!");
                          }
                        }}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <Ban size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">Parking Issue /Blocking path</span>
                      </button>

                      {/* 5. Flat Tire */}
                      <button
                        onClick={() => {
                          const contacts = getTowingContacts();
                          if (contacts.length > 0) window.open(`tel:${contacts[0].phone.replace(/[^0-9+]/g, "")}`);
                          else alert("Flat Tire assistance ping dispatched to owner.");
                        }}
                        className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <Disc size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">Flat Tire</span>
                      </button>

                      {/* 6. Theft Detected */}
                      <button
                        onClick={() => {
                          if (qrData && location) {
                            const payload = {
                              qrId: qrData.id,
                              qrUrl: qrData.qrUrl,
                              latitude: location.lat,
                              longitude: location.lng,
                              accuracy: location.accuracy,
                              deviceId: navigator.userAgent.slice(0, 40),
                              timestamp: new Date().toISOString(),
                              message: "CRITICAL: Theft Detected Alert!",
                              vehicleName: qrData.vehicleName,
                              vehicleNumber: qrData.vehicleNumber,
                            };
                            const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
                            alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
                            localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
                            alert("🚨 Theft alert sent to owner & emergency network!");
                          }
                        }}
                        className="bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all min-h-[105px] shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          <ShieldAlert size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-black leading-tight">Theft Detected</span>
                      </button>
                    </div>
                  </div>

                  {/* Send Custom Message Bar */}
                  <div className="pt-2">
                    <div className="bg-[#EEF2F6] border border-gray-200 rounded-2xl p-1.5 pl-4 flex items-center justify-between gap-2 shadow-xs">
                      <input
                        type="text"
                        value={visitorMessage}
                        onChange={(e) => setVisitorMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendCustomMessage();
                        }}
                        placeholder="| Send Custom message to owner"
                        className="w-full bg-transparent text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none"
                      />
                      <button
                        onClick={handleSendCustomMessage}
                        className="w-10 h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ EMERGENCY MAIN BUTTON SUB-MENU (3 BUTTONS) ============ */}
              {activeSubMenu === "emergency-main" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Header bar with Back button */}
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl p-3 shadow-2xs">
                    <button
                      onClick={() => setActiveSubMenu("none")}
                      className="flex items-center gap-1.5 text-xs font-black text-red-600 hover:opacity-80 transition-opacity bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-red-200 cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 justify-end">
                        <ShieldAlert size={16} className="text-red-600" /> Emergency Options
                      </span>
                      <p className="text-[10px] font-bold text-gray-500">Choose action to proceed</p>
                    </div>
                  </div>

                  {/* 3 Main Emergency Action Buttons */}
                  <div className="space-y-3">
                    {/* Button 1: Vehicle Owner Primary Contact */}
                    <button
                      onClick={() => {
                        const contacts = getTowingContacts();
                        const primary = contacts.find((c) => c.primary) || contacts[0];
                        if (primary) {
                          window.open(`tel:${primary.phone.replace(/[^0-9+]/g, "")}`);
                        } else {
                          alert("No vehicle owner phone number registered.");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold flex-shrink-0">
                          <Car size={22} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-black text-white tracking-tight">Request Ambulance</p>
                          <p className="text-[11px] font-medium text-white/80 truncate">
                            Immediate connection to ambulance
                          </p>
                        </div>
                      </div>
                      <div className="bg-white text-red-600 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                        Get Help
                      </div>
                    </button>

                    {/* Button 2: Call Family Members */}
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
                            Let loved ones find you faster.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white text-emerald-700 font-black text-xs px-3 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
                        Call
                      </div>
                    </button>

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
                        <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold flex-shrink-0">
                          <MapPin size={22} />
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
                  <div className="flex items-center justify-between bg-[#FFF0F2] border border-[#FFD6DB] rounded-2xl p-3 shadow-2xs">
                    <button
                      onClick={() => setActiveSubMenu("none")}
                      className="flex items-center gap-1.5 text-xs font-black text-[#E52E3D] hover:opacity-80 transition-opacity bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-[#FFD6DB] cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 justify-end">
                        <Wrench size={16} className="text-[#E52E3D]" /> Mechanical Options
                      </span>
                      <p className="text-[10px] font-bold text-gray-500">Select specific service</p>
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
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">24x7 Flatbed Tow</p>
                      </div>
                    </button>

                    {/* Flat Tire / Puncher */}
                    <button
                      onClick={() => {
                        const contacts = getTowingContacts();
                        if (contacts.length > 0) window.open(`tel:${contacts[0].phone.replace(/[^0-9+]/g, "")}`);
                      }}
                      className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-red-300 hover:bg-red-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                        <Car size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-red-600 transition-colors">Flat Tire Fix</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">On-site Puncture</p>
                      </div>
                    </button>

                    {/* Fuel & Battery */}
                    <button
                      onClick={() => {
                        const contacts = getTowingContacts();
                        if (contacts.length > 0) window.open(`tel:${contacts[0].phone.replace(/[^0-9+]/g, "")}`);
                      }}
                      className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-red-300 hover:bg-red-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold shadow-2xs">
                        <Fuel size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-red-600 transition-colors">Battery</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">Jumpstart Assist</p>
                      </div>
                    </button>

                    {/* Engine Repair / Breakdown */}
                    <button
                      onClick={() => {
                        const contacts = getTowingContacts();
                        if (contacts.length > 0) window.open(`tel:${contacts[0].phone.replace(/[^0-9+]/g, "")}`);
                      }}
                      className="bg-white border border-gray-200 rounded-2xl p-3 text-left hover:border-red-300 hover:bg-red-50/40 transition-all active:scale-[0.98] shadow-2xs group flex flex-col justify-between h-26 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold shadow-2xs">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-red-600 transition-colors">Other</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">Mobile Mechanic</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ============ TOWING BREAKDOWN STEP VIEW ============ */}
              {activeSubMenu === "towing" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between bg-[#FFF0F2] border border-[#FFD6DB] rounded-2xl p-3 shadow-2xs">
                    <button
                      onClick={() => setActiveSubMenu("mechanical")}
                      className="flex items-center gap-1.5 text-xs font-black text-[#E52E3D] hover:opacity-80 transition-opacity bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-[#FFD6DB] cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 justify-end">
                        <Truck size={16} className="text-[#E52E3D]" /> Towing Helpline
                      </span>
                    </div>
                  </div>

                  {!towingImage ? (
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
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
                                reader.onloadend = () => setTowingImage(reader.result as string);
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
                        {getTowingContacts().map((c, i) => (
                          <div
                            key={i}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${c.primary ? "bg-[#FFF7ED] border-[#FFEDD5]" : "bg-white border-gray-200"
                              }`}
                          >
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-extrabold text-gray-900 leading-tight">{c.label}</p>
                                {c.primary && (
                                  <span className="bg-[#FF5500] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wide">
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-mono font-black text-gray-800 mt-1">{c.phone}</p>
                            </div>

                            <button
                              onClick={() => window.open(`tel:${c.phone.replace(/[^0-9+]/g, "")}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
                            >
                              <PhoneCall size={14} /> CALL
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============ MEDICAL HELP SUB-MENU CARD ============ */}
              {activeSubMenu === "medical" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3 shadow-2xs">
                    <button
                      onClick={() => setActiveSubMenu("none")}
                      className="flex items-center gap-1.5 text-xs font-black text-[#16A34A] hover:opacity-80 transition-opacity bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-[#BBF7D0] cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 justify-end">
                        <Heart size={16} className="text-[#16A34A] fill-[#16A34A]" /> Medical Options
                      </span>
                      <p className="text-[10px] font-bold text-gray-500">Select specific service</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => window.open("tel:108")}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-2xl p-3 text-left hover:opacity-95 transition-all active:scale-[0.98] shadow-md shadow-green-500/20 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                          <Stethoscope size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Call Ambulance 108</p>
                          <p className="text-[10px] font-bold text-emerald-100">National Medical Helpline</p>
                        </div>
                      </div>
                      <div className="bg-white text-emerald-700 font-black text-[10px] px-3 py-1 rounded-lg">
                        CALL 108
                      </div>
                    </button>

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
                  <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3 shadow-2xs">
                    <button
                      onClick={() => setActiveSubMenu("none")}
                      className="flex items-center gap-1.5 text-xs font-black text-[#16A34A] hover:opacity-80 transition-opacity bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-[#BBF7D0] cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 justify-end">
                        <PhoneCall size={16} className="text-[#16A34A]" /> Family &amp; Owner Contacts
                      </span>
                      <p className="text-[10px] font-bold text-gray-500">{getTowingContacts().length} numbers available</p>
                    </div>
                  </div>

                  <button
                    onClick={() => location && window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black text-gray-900">Share My Live Location</p>
                      <p className="text-[10px] font-bold text-gray-500">Send GPS pin to contacts</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 flex-shrink-0 ml-auto" />
                  </button>

                  <div className="space-y-2">
                    {getTowingContacts().length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <PhoneCall size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">No contacts available</p>
                        <p className="text-xs text-gray-400 mt-1">Owner has not added any numbers yet</p>
                      </div>
                    ) : (
                      getTowingContacts().map((contact, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${contact.primary ? "bg-[#FFF7ED] border-[#FFEDD5] shadow-xs" : "bg-white border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-2xs ${contact.primary ? "bg-[#FF5500] text-white" : "bg-emerald-100 text-emerald-600"
                                }`}
                            >
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-extrabold text-gray-900 leading-tight truncate">{contact.label}</p>
                                {contact.primary && (
                                  <span className="bg-[#FF5500] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wide flex-shrink-0">
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-gray-500 mt-0.5">{contact.role}</p>
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
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Footer Support Info Pill */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-4 flex items-center justify-around text-[11px] font-semibold text-gray-600 mt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-yellow-500" />
                  Your safety is our priority
                </span>
                <div className="w-px h-4 bg-gray-200" />
                <span className="flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-blue-500" />
                  24/7 Support
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============ SENDING (Light Mode) ============ */}
        {phase === "sending" && qrData && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8 text-center animate-fade-in w-full space-y-5">
            <div className="relative flex items-center justify-center py-2">
              <div className="w-16 h-16 rounded-full border-2 border-gray-100 border-t-red-500 animate-spin" />
              <ShieldAlert size={24} className="absolute text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Sending Alert</h2>
              <p className="text-xs text-gray-500 mt-1">Please wait while we dispatch your emergency ping...</p>
            </div>

            <div className="w-full space-y-2">
              <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${activateProgress}%`, background: "linear-gradient(90deg, #EF4444, #DC2626)" }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-gray-400">
                <span>{activateStatus}</span>
                <span>{Math.round(activateProgress)}%</span>
              </div>
            </div>
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
      </main>
    </div>
  );
}
