import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Navigation, PhoneCall, Send, Loader2, CheckCircle, Plus } from 'lucide-react';
import { Vehicle, QRCodeData, Report } from '../types';


const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
};

const btnStyle: React.CSSProperties = {
  background: '#0070d1',
  color: '#fff',
  border: 'none',
  borderRadius: 9999,
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  height: '52px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const badgeStyle: React.CSSProperties = {
  background: '#0070d1',
  color: '#fff',
  borderRadius: 9999,
  fontSize: '13px',
  fontWeight: 700,
  padding: '6px 16px',
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

  // Activation form states
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activationError, setActivationError] = useState('');

  const reportTypeMeta: Record<ReportType, { icon: any; label: string; color: string }> = {
    wrong_parking: { icon: Navigation, label: 'Parking', color: '#0070d1' },
    accident: { icon: AlertTriangle, label: 'Hazard', color: '#c81b3a' },
    contact_owner: { icon: PhoneCall, label: 'Contact', color: '#d53b00' },
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

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);
    setActivationProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setActivationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        const nextVehId = `V-${Date.now().toString().slice(-4)}`;
        const randomPlate = `N-${Math.floor(1000 + Math.random() * 9000)}`;
        const newVehicle: Vehicle = {
          id: nextVehId,
          make: 'Generic',
          model: 'Vehicle',
          year: new Date().getFullYear(),
          color: 'Default',
          licensePlate: randomPlate,
          status: 'active',
          qrCodeUrl: qrCodeId,
          createdAt: new Date().toISOString(),
        };

        const updatedQrCode: QRCodeData = {
          id: qrCodeId,
          vehicleId: nextVehId,
          status: 'active',
          scansCount: 0,
          createdAt: new Date().toISOString(),
        };

        if (onActivateSticker) {
          onActivateSticker(newVehicle, updatedQrCode);
        }
        setIsActivating(false);
        setActivationSuccess(true);
      }
    }, 150);
  };

  // Unlinked Sticker/Tag Activation View
  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#f5f7fa] font-sans text-black">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!activationSuccess ? (
              <motion.div
                key="activation-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-6 md:p-8 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                  {!isActivating ? (
                    <>
                      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 text-white rounded-full bg-[#0070d1]">
                        <Plus size={24} />
                      </div>
                      <h2 className="font-sans text-2xl font-bold uppercase tracking-tight text-black">Link & Activate Tag</h2>
                      <p className="font-sans text-sm text-black/60 mt-2 mb-6">
                        This sticker is currently unlinked. Activate protection below.
                      </p>

                      <div className="flex gap-4 w-full">
                        <button
                          type="button"
                          onClick={onNavigateHome}
                          className="flex-1 py-3 border border-slate-200 text-xs font-bold uppercase tracking-wider text-black rounded-full hover:bg-slate-50 transition-all cursor-pointer h-12 flex items-center justify-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleActivate}
                          className="flex-1 py-3 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer h-12 flex items-center justify-center"
                        >
                          Activate Tag
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full py-8 px-4 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-[#0070d1]/20 border-t-[#0070d1] animate-spin mb-6" />

                      <div className="w-full space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#0070d1]">
                          <span>Activating QR Tag...</span>
                          <span>{Math.round(activationProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#0070d1] h-full transition-all duration-75"
                            style={{ width: `${activationProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="activation-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="p-6 md:p-8 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 bg-emerald-100 text-emerald-600 rounded-full">
                    <CheckCircle size={24} className="fill-emerald-100" />
                  </div>
                  <h2 className="font-sans text-2xl font-bold uppercase tracking-tight mb-2 text-black">Tag Activated!</h2>
                  <p className="font-sans text-xs text-black/60 mb-6 max-w-sm leading-relaxed">
                    Sticker Tag is now active and protecting your vehicle.
                  </p>

                  {/* Visual Windshield sticker layout preview (User Side View) */}
                  {(() => {
                    const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${qrCodeId}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;
                    
                    return (
                      <div className="p-5 bg-black text-white rounded-md border border-white/10 flex flex-col items-center text-center w-full max-w-[240px] shadow-lg mb-6">
                        <div className="text-[9px] font-bold text-white/50 tracking-wider uppercase mb-2.5">
                          STICKER ID: {qrCodeId}
                        </div>
                        <div className="w-28 h-28 bg-white p-2 rounded-md border flex items-center justify-center border-[#0070d1]">
                          <img src={qrImgUrl} alt={`QR Code`} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-3.5">
                          <span className="font-sans font-bold text-xs block uppercase tracking-tight text-white">
                            DEFAULT VEHICLE
                          </span>
                          <span className="text-[9px] font-bold block mt-1 tracking-wider uppercase text-white/60">
                            PROTECTION ACTIVE
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-widest block mt-2 text-[#0070d1]">
                            PlayStation Edition
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={onNavigateHome}
                    className="w-full py-3 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer h-12 flex items-center justify-center"
                  >
                    Go to Portal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-tr from-slate-50 to-slate-100 font-sans text-black">
      <div className="w-full max-w-md md:max-w-lg space-y-4">
        {/* ── Section 1: Vehicle Badge ──────────────────── */}
        <div className="p-6 bg-white border border-[#f3f3f3] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#0070d1]">Scanned Asset</span>
            <h3 className="font-sans text-lg md:text-xl font-bold uppercase tracking-tight truncate text-black mt-1">
              {vehicle.color} {vehicle.make} {vehicle.model}
            </h3>
            <p className="font-sans text-xs text-black/60 font-semibold mt-0.5">{vehicle.licensePlate}</p>
          </div>
          <span className="shrink-0 bg-[#0070d1] text-white rounded-full text-xs font-bold px-4 py-1.5 shadow-xs">
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
              className="space-y-4"
            >
              {/* ── Section 2: Issue Picker ──────────────── */}
              <div className="p-5 bg-white border border-[#f3f3f3] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex gap-3">
                  {(Object.keys(reportTypeMeta) as ReportType[]).map((key) => {
                    const meta = reportTypeMeta[key];
                    const Icon = meta.icon!;
                    const isActive = reportType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReportType(key)}
                        className={`flex-1 flex flex-col items-center gap-2.5 py-4 px-3 text-center transition-all duration-200 cursor-pointer rounded-xl border ${
                          isActive 
                            ? 'bg-slate-50 border-slate-900 border-2 scale-[1.02]' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={22} className={isActive ? 'text-black' : 'text-black/60'} />
                        <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-wider text-black">
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 3: Message + Send ────────────── */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 bg-white border border-[#f3f3f3] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      reportType === 'wrong_parking'
                        ? 'e.g. Blocking driveway #14'
                        : reportType === 'accident'
                        ? 'e.g. Window left open'
                        : 'e.g. Please call me'
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#0070d1] focus:bg-white rounded-xl outline-none transition-all font-sans text-sm md:text-base resize-none mb-4 min-h-[90px]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs md:text-sm font-bold uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] h-14 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin mr-1.5" /> Sending...</>
                    ) : (
                      <><Send size={16} className="mr-1.5" /> Send Alert</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div
              key="success"
              className="p-8 text-center bg-white border border-[#f3f3f3] rounded-2xl shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4 bg-emerald-100 text-emerald-600 rounded-full">
                <CheckCircle size={24} className="fill-emerald-100" />
              </div>
              <h2 className="font-sans text-2xl font-bold uppercase tracking-tight mb-2 text-black">Alert Dispatched</h2>
              <p className="font-sans text-xs text-black/60 mb-6 max-w-sm leading-relaxed">
                Owner has been notified privately. Your contact number remains completely secure.
              </p>
              
              <button
                onClick={() => { setSubmitted(false); setMessage(''); }}
                className="w-full py-3.5 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-black rounded-full hover:bg-slate-50 transition-all cursor-pointer h-12 flex items-center justify-center mb-3"
              >
                Send Another
              </button>
              
              <button 
                onClick={onNavigateHome} 
                className="w-full py-3.5 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer h-12 flex items-center justify-center"
              >
                Done
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
