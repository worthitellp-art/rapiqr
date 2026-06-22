import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Navigation, PhoneCall, Send, Loader2, CheckCircle } from 'lucide-react';
import { Vehicle, QRCodeData, Report } from '../types';

const clayCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: 20,
  boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.95), inset -4px -4px 10px rgba(59,130,246,0.06), 0 12px 28px -6px rgba(59,130,246,0.12)',
};

const clayBtn: React.CSSProperties = {
  background: '#3B82F6',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 14,
  boxShadow: 'inset 3px 3px 8px rgba(255,255,255,0.3), inset -3px -3px 8px rgba(0,0,0,0.1), 0 6px 16px rgba(59,130,246,0.2)',
};

const clayBadge: React.CSSProperties = {
  background: '#3B82F6',
  color: '#fff',
  borderRadius: 16,
  boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.25), inset -2px -2px 4px rgba(0,0,0,0.08)',
};

type ReportType = 'wrong_parking' | 'accident' | 'contact_owner';

interface PublicScanPageProps {
  qrCodeId: string;
  vehicles: Vehicle[];
  qrCodes?: QRCodeData[];
  onActivateSticker?: (newVehicle: Vehicle, updatedQrCode: QRCodeData) => void;
  onSubmitReport: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  onNavigateHome: () => void;
}

export default function PublicScanPage({
  qrCodeId,
  vehicles,
  qrCodes,
  onActivateSticker,
  onSubmitReport,
  onNavigateHome,
}: PublicScanPageProps) {
  const vehicle = vehicles.find((v) => v.qrCodeUrl === qrCodeId || v.id === qrCodeId);
  const [reportType, setReportType] = useState<ReportType>('wrong_parking');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportTypeMeta: Record<ReportType, { icon: any; label: string; color: string }> = {
    wrong_parking: { icon: Navigation, label: 'Parking', color: '#D97706' },
    accident: { icon: AlertTriangle, label: 'Hazard', color: '#DC2626' },
    contact_owner: { icon: PhoneCall, label: 'Contact', color: '#3B82F6' },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReport({
        vehicleId: vehicle.id,
        vehicleLabel: `${vehicle.color} ${vehicle.make} ${vehicle.model}`,
        licensePlate: vehicle.licensePlate,
        type: reportType,
        message: message || `Alert via ${qrCodeId}`,
        location: null,
        reporterPhone: undefined,
      });
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs p-6 text-center" style={clayCard}>
          <div className="mx-auto w-10 h-10 flex items-center justify-center mb-3" style={{ ...clayBadge, borderRadius: '50%', width: 40, height: 40 }}>
            <AlertTriangle size={18} />
          </div>
          <h2 className="font-display text-base font-black uppercase tracking-tight mb-1" style={{ color: '#1C398E' }}>No Vehicle Found</h2>
          <p className="font-sans text-[11px] font-medium mb-4" style={{ color: '#1C398E', opacity: 0.5 }}>This QR tag is not linked to any vehicle yet.</p>
          <button onClick={onNavigateHome} className="w-full py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider cursor-pointer" style={clayBtn}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ── Section 1: Vehicle Badge ──────────────────── */}
        <div className="p-3 mb-2.5 flex items-center justify-between gap-2" style={clayCard}>
          <div className="min-w-0">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6', opacity: 0.6 }}>Scanned</span>
            <h3 className="font-display text-sm font-black uppercase tracking-tight truncate" style={{ color: '#1C398E' }}>
              {vehicle.color} {vehicle.make} {vehicle.model}
            </h3>
            <p className="font-mono text-[10px] font-semibold" style={{ color: '#1C398E', opacity: 0.4 }}>{vehicle.licensePlate}</p>
          </div>
          <span className="px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider shrink-0" style={clayBadge}>
            {qrCodeId}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* ── Section 2: Issue Picker ──────────────── */}
              <div className="p-3 mb-2.5" style={clayCard}>
                <div className="flex gap-1.5">
                  {(Object.keys(reportTypeMeta) as ReportType[]).map((key) => {
                    const meta = reportTypeMeta[key];
                    const Icon = meta.icon!;
                    const isActive = reportType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReportType(key)}
                        className="flex-1 flex flex-col items-center gap-1 py-2.5 px-2 text-center transition-all cursor-pointer active:scale-[0.97]"
                        style={{
                          background: isActive ? meta.color : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${isActive ? meta.color : 'rgba(255,255,255,0.6)'}`,
                          borderRadius: 14,
                          boxShadow: isActive
                            ? 'inset 2px 2px 5px rgba(255,255,255,0.25), inset -2px -2px 5px rgba(0,0,0,0.08)'
                            : 'inset 2px 2px 5px rgba(255,255,255,0.9), inset -2px -2px 5px rgba(59,130,246,0.03)',
                        }}
                      >
                        <Icon size={14} style={{ color: isActive ? '#fff' : '#1C398E' }} />
                        <span className="font-display text-[9px] font-black uppercase tracking-tight" style={{ color: isActive ? '#fff' : '#1C398E' }}>
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 3: Message + Send ────────────── */}
              <form onSubmit={handleSubmit}>
                <div className="p-3" style={clayCard}>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      reportType === 'wrong_parking'
                        ? 'e.g. Blocking driveway #14'
                        : reportType === 'accident'
                        ? 'e.g. Window left open'
                        : 'e.g. Please call me'
                    }
                    className="w-full px-3 py-2 text-xs outline-none transition-all font-medium resize-none mb-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.7)',
                      borderRadius: 12,
                      boxShadow: 'inset 2px 2px 5px rgba(59,130,246,0.03), inset -2px -2px 5px rgba(255,255,255,0.8)',
                      color: '#1C398E',
                      minHeight: 52,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    style={clayBtn}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={14} /> Send Alert</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 text-center" style={clayCard}
            >
              <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3" style={{ ...clayBadge, background: '#16A34A', borderRadius: '50%', width: 48, height: 48 }}>
                <CheckCircle size={22} />
              </div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight mb-1" style={{ color: '#1C398E' }}>Alert Sent</h2>
              <p className="font-sans text-[11px] font-medium mb-4" style={{ color: '#1C398E', opacity: 0.55 }}>
                Owner notified. Your contact stays private.
              </p>
              <button
                onClick={() => { setSubmitted(false); setMessage(''); }}
                className="w-full py-2.5 mb-2 font-sans text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  ...clayBtn,
                  background: 'rgba(255,255,255,0.7)',
                  color: '#1C398E',
                  boxShadow: 'inset 3px 3px 8px rgba(255,255,255,0.95), inset -3px -3px 8px rgba(59,130,246,0.06), 0 4px 10px rgba(59,130,246,0.06)',
                }}
              >
                Send Another
              </button>
              <button onClick={onNavigateHome} className="w-full py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98]" style={clayBtn}>
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
