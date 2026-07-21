import { useState, useEffect, useCallback, useRef } from "react";

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

const QR_DOMAIN = "https://namoqr.linkspace-service.workers.dev";

function getQrIdFromUrl(): string | null {
  // Support both new format (oqr.linkspace-service.workers.dev/{id}) and legacy format (#/qr/{id})
  const path = window.location.pathname;
  const hash = window.location.hash;
  // New format: direct path like /QR-XXXX or /QR-XXXX/
  const directMatch = path.match(/^\/([^/]+)/);
  const hashMatch = hash.match(/#\/qr\/([^/]+)/);
  const legacyMatch = path.match(/\/qr\/([^/]+)/);
  
  if (directMatch && directMatch[1] !== "") {
    const id = directMatch[1];
    // QR IDs always start with QR- or CL- prefix (from the uid helper)
    if (id.startsWith("QR-") || id.startsWith("CL-")) {
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

/* ---------------------------------------------------------------------- */
/*  Main component                                                         */
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
  const gpsWatchRef = useRef<number | null>(null);

  /* ---- Cleanup GPS watcher on unmount ---- */
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, []);

  /* ---- Step 1: Validate QR from URL ---- */
  useEffect(() => {
    const qrId = getQrIdFromUrl();
    if (!qrId) {
      setErrorMsg("No QR code ID found in URL.");
      setPhase("error");
      return;
    }

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 18 + 6;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          const stored = localStorage.getItem("namoqr-qrlist");
          const list: any[] = stored ? JSON.parse(stored) : [];
          const found = list.find((q: any) => q.id === qrId || q.qrUrl?.includes(qrId));
          if (!found) {
            setErrorMsg(`QR "${qrId}" not found or invalid.`);
            setPhase("error");
            return;
          }
          const data = {
            id: found.id,
            qrUrl: found.qrUrl || `${QR_DOMAIN}/${found.id}`,
            vehicleName: found.vehicleName,
            vehicleNumber: found.vehicleNumber,
            clientId: found.clientId,
            status: found.status,
            template: found.template,
          };
          setQrData(data);
          // First-time activation required before showing emergency
          if (found.status === "inactive") {
            setPhase("activation");
          } else {
            setPhase("location-request");
          }
        }, 400);
      }
      setProgress(Math.min(100, prog));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /* ---- Step 2: Request Location ---- */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this device.");
      setPhase("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
        setPhase("emergency");
      },
      (err) => {
        if (err.code === 1) setPhase("location-denied");
        else if (err.code === 2) {
          setErrorMsg("Location unavailable. Please try again.");
          setPhase("error");
        } else {
          setPhase("location-denied");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (phase === "location-request") requestLocation();
  }, [phase, requestLocation]);

  /* ---- Watch GPS for live updates ---- */
  useEffect(() => {
    if (phase !== "emergency") return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, [phase]);

  /* ---- Step 2.5: Activation (first scan) ---- */
  const handleActivation = useCallback(() => {
    if (!qrData) return;
    setActivatingQr(true);

    // Brief delay so user sees the activating state
    setTimeout(() => {
      // Update QR status from "inactive" to "active" in localStorage
      const stored = localStorage.getItem("namoqr-qrlist");
      const list: any[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((q: any) => q.id === qrData.id);
      if (idx >= 0) {
        list[idx].status = "active";
        list[idx].scans = (list[idx].scans || 0) + 1;
        list[idx].lastScannedAt = new Date().toISOString();
        list[idx].activatedBy = visitorName || "Anonymous";
        list[idx].activationNote = visitorMessage || undefined;
        list[idx].activatedAt = new Date().toISOString();
        localStorage.setItem("namoqr-qrlist", JSON.stringify(list));

        // Also create an activation alert
        const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
        alerts.unshift({
          id: Date.now(),
          qrId: qrData.id,
          qrUrl: qrData.qrUrl,
          vehicleName: qrData.vehicleName,
          vehicleNumber: qrData.vehicleNumber,
          visitorName: visitorName || "Anonymous",
          message: visitorMessage || undefined,
          latitude: null,
          longitude: null,
          timestamp: new Date().toISOString(),
          status: "activated",
          type: "activation",
        });
        localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));
      }

      // Update local state and proceed to emergency flow
      setActivatingQr(false);
      setQrData({ ...qrData, status: "active" });
      setPhase("location-request");
    }, 800);
  }, [qrData, visitorName, visitorMessage]);

  /* ---- Step 3: Send Emergency Alert ---- */
  const sendAlert = useCallback(() => {
    if (!qrData || !location) return;
    setPhase("sending");
    setActivating(true);
    setActivateProgress(0);
    setActivateStatus("Preparing alert...");

    const steps = [
      { p: 15, s: "Verifying GPS..." },
      { p: 35, s: "Capturing location..." },
      { p: 55, s: "Attaching QR data..." },
      { p: 75, s: "Sending notification..." },
      { p: 90, s: "Notifying owner..." },
      { p: 100, s: "Done!" },
    ];

    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) {
        setActivateProgress(steps[i].p);
        setActivateStatus(steps[i].s);
        i++;
      } else {
        clearInterval(iv);
        const payload = {
          qrId: qrData.id,
          qrUrl: qrData.qrUrl,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          deviceId: navigator.userAgent.slice(0, 40),
          timestamp: new Date().toISOString(),
          message: "Emergency Alert",
          vehicleName: qrData.vehicleName,
          vehicleNumber: qrData.vehicleNumber,
        };

        const alerts = JSON.parse(localStorage.getItem("namoqr-alerts") || "[]");
        alerts.unshift({ ...payload, id: Date.now(), status: "sent" });
        localStorage.setItem("namoqr-alerts", JSON.stringify(alerts));

        const stored = localStorage.getItem("namoqr-qrlist");
        const list: any[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex((q: any) => q.id === qrData.id);
        if (idx >= 0) {
          list[idx].scans = (list[idx].scans || 0) + 1;
          list[idx].lastScannedAt = new Date().toISOString();
          localStorage.setItem("namoqr-qrlist", JSON.stringify(list));
        }

        setTimeout(() => {
          setActivating(false);
          setAlertSent(true);
          setPhase("success");
        }, 500);
      }
    }, 400);

    return () => clearInterval(iv);
  }, [qrData, location]);

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-[#0F0F14] text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Status bar placeholder */}
      <div className="h-12 flex items-center px-5 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/15 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* ============ VALIDATING ============ */}
        {phase === "validating" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-8 relative">
              <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="var(--orange, #D9581F)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Verifying QR Code</h2>
            <p className="text-white/40 text-sm mb-8 max-w-[240px]">Please wait while we validate your QR code</p>
            <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D9581F, #F59E0B)" }}
              />
            </div>
            <p className="text-white/30 text-xs mt-3 font-mono">{Math.round(progress)}%</p>
          </div>
        )}

        {/* ============ ACTIVATION (First scan) ============ */}
        {phase === "activation" && qrData && (
          <div className="w-full max-w-sm animate-fade-in space-y-5">
            {/* Header */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                First Activation
              </div>
              <h1 className="text-2xl font-bold">Activate This QR</h1>
              <p className="text-white/40 text-sm mt-1">This QR has not been activated yet. Let the owner know you're here.</p>
            </div>

            {/* Vehicle/Product Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                  🚗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{qrData.vehicleName}</p>
                  <p className="text-xs text-white/40 font-mono">{qrData.vehicleNumber}</p>
                </div>
                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-md">{qrData.clientId}</span>
              </div>
            </div>

            {/* Visitor Details Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Your Details (optional)</p>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Your Name</label>
                <input
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 text-sm bg-white/10 border border-white/10 rounded-xl outline-none text-white placeholder-white/30 focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Message to Owner</label>
                <textarea
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  placeholder="e.g., Just letting you know I\'m here..."
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm bg-white/10 border border-white/10 rounded-xl outline-none text-white placeholder-white/30 focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">After Activation</p>
              <div className="space-y-2">
                {[
                  "Owner gets notified of your visit",
                  "Time & location recorded securely",
                  "Emergency options become available",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-white/50">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Activate Button */}
            <button
              onClick={handleActivation}
              disabled={activatingQr}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
              style={{ background: activatingQr ? "#6B7280" : "linear-gradient(135deg, #10B981, #059669)" }}
            >
              {activatingQr ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  ACTIVATING...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  ACTIVATE &amp; NOTIFY OWNER
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-white/20 pb-2">
              Your name and message will be shared with the owner.
            </p>
          </div>
        )}

        {/* ============ LOCATION REQUEST ============ */}
        {phase === "location-request" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Location Required</h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed">
              To send an emergency alert, your current location is required. This helps the owner find you quickly.
            </p>
            <button
              onClick={requestLocation}
              className="mt-8 px-8 py-3 rounded-full text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              Allow Location
            </button>
            <button onClick={onBack} className="mt-4 text-sm text-white/30 hover:text-white/50 transition-colors">
              Go Back
            </button>
          </div>
        )}

        {/* ============ LOCATION DENIED ============ */}
        {phase === "location-denied" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Location Access Required</h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed mb-6">
              Please enable location access in your device settings to send an emergency alert.
            </p>
            <button
              onClick={() => {
                if (typeof (navigator as any).permissions?.request === "function") {
                  (navigator as any).permissions.query({ name: "geolocation" }).then(() => requestLocation());
                } else {
                  requestLocation();
                }
              }}
              className="px-8 py-3 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95"
            >
              Try Again
            </button>
            <button onClick={onBack} className="mt-4 text-sm text-white/30 hover:text-white/50 transition-colors">
              Go Back
            </button>
          </div>
        )}

        {/* ============ EMERGENCY SCREEN ============ */}
        {phase === "emergency" && qrData && (
          <div className="w-full max-w-sm animate-fade-in space-y-5">
            {/* Header */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Emergency Mode
              </div>
              <h1 className="text-2xl font-bold">Emergency Assistance</h1>
              <p className="text-white/40 text-sm mt-1">Vehicle owner will be notified securely</p>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                  🚗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{qrData.vehicleName}</p>
                  <p className="text-xs text-white/40 font-mono">{qrData.vehicleNumber}</p>
                </div>
                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-md">{qrData.clientId}</span>
              </div>
            </div>

            {/* Location Card */}
            {location && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" /><circle cx="12" cy="9" r="2" /></svg>
                  <span className="text-xs font-semibold text-emerald-400">Location Detected</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Latitude</p>
                    <p className="text-sm font-mono font-semibold mt-0.5">{formatCoord(location.lat)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Longitude</p>
                    <p className="text-sm font-mono font-semibold mt-0.5">{formatCoord(location.lng)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Accuracy</p>
                    <p className="text-sm font-mono font-semibold mt-0.5">~{location.accuracy}m</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2.5">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2.5">
                <ActionCard icon="📞" label="Contact Owner" sub="Notify via app" color="#3B82F6" onClick={() => window.open(`${QR_DOMAIN}/${qrData.id}/contact`)} />
                <ActionCard icon="💬" label="Send Message" sub="SMS alert" color="#8B5CF6" onClick={() => window.open(`sms:?body=Emergency! Vehicle ${qrData.vehicleNumber} needs assistance.`)} />
                <ActionCard icon="📍" label="Share Location" sub="Live GPS" color="#10B981" onClick={() => location && window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`)} />
                <ActionCard icon="📸" label="Upload Photo" sub="Optional" color="#F59E0B" onClick={() => {}} />
              </div>
            </div>

            {/* Send Alert Button */}
            <button
              onClick={sendAlert}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform shadow-lg shadow-red-500/20"
              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              SEND EMERGENCY ALERT
            </button>

            <p className="text-center text-[10px] text-white/20 pb-2">
              Your location, time, and QR data will be shared with the vehicle owner.
            </p>
          </div>
        )}

        {/* ============ SENDING ============ */}
        {phase === "sending" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 relative">
              <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-1">Sending Alert</h2>
            <p className="text-white/40 text-sm mb-8">{activateStatus}</p>
            <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-400 ease-out"
                style={{ width: `${activateProgress}%` }}
              />
            </div>
            <div className="mt-6 space-y-1.5 text-left w-full max-w-[200px]">
              {["GPS Verified", "Time Captured", "QR Data Attached", "Device Registered"].map((item, i) => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: activateProgress > (i + 1) * 20 ? "#10B981" : "rgba(255,255,255,0.2)" }}>
                  {activateProgress > (i + 1) * 20 ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-white/20" />
                  )}
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ SUCCESS ============ */}
        {phase === "success" && qrData && (
          <div className="flex flex-col items-center text-center animate-fade-in w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-6 animate-success-pop">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" className="animate-check-in">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-1">Alert Sent Successfully</h2>
            <p className="text-white/40 text-sm mb-6">The vehicle owner has been notified.</p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-3">Included</p>
              <div className="space-y-2">
                {[
                  `Live Location (${location ? `${formatCoord(location.lat)}, ${formatCoord(location.lng)}` : "N/A"})`,
                  `Time: ${formatTime(new Date().toISOString())}`,
                  `QR: ${qrData.vehicleNumber}`,
                  `Alert ID: ${Date.now().toString(36).toUpperCase()}`,
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-emerald-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-white/30 mb-6">The owner may contact you shortly.</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => window.open(`${QR_DOMAIN}/${qrData.id}/contact`)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                📞 Contact Owner
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: "linear-gradient(135deg, #D9581F, #B84418)" }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ============ ERROR ============ */}
        {phase === "error" && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid QR Code</h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed mb-8">{errorMsg}</p>
            <button
              onClick={onBack}
              className="px-8 py-3 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Action Card sub-component                                              */
/* ---------------------------------------------------------------------- */

function ActionCard({ icon, label, sub, color, onClick }: { icon: string; label: string; sub: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 text-left hover:bg-white/8 transition-colors active:scale-[0.97]"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{label}</p>
        <p className="text-[10px] text-white/30">{sub}</p>
      </div>
    </button>
  );
}
