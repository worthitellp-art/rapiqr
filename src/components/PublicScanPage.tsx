import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Navigation, 
  PhoneCall, 
  Send, 
  Loader2, 
  CheckCircle, 
  Plus, 
  Flame, 
  Droplet, 
  Activity, 
  Package, 
  ShieldAlert, 
  Users, 
  Briefcase, 
  Heart, 
  Key, 
  Backpack, 
  MapPin,
  Compass,
  QrCode,
  Globe,
  Info,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Car,
  Bike,
  Home,
  Luggage
} from 'lucide-react';
import { NamoProduct, QRCodeData, Report, ReportType } from '../types';

interface PublicScanPageProps {
  qrCodeId: string;
  products: NamoProduct[];
  qrCodes?: QRCodeData[];
  onActivateSticker?: (newProduct: NamoProduct, updatedQrCode: QRCodeData) => void;
  onSubmitReport: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  onNavigateHome: () => void;
}

export default function PublicScanPage({
  qrCodeId,
  products,
  qrCodes,
  onActivateSticker,
  onSubmitReport,
  onNavigateHome,
}: PublicScanPageProps) {
  // Find product by QR link
  const product = products.find((p) => p.qrCodeId === qrCodeId || p.id === qrCodeId);
  
  const [reportType, setReportType] = useState<ReportType>('contact_owner');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Home Gate specifically
  const [selectedHomeAlert, setSelectedHomeAlert] = useState<ReportType>('visitor_notification');
  
  // Child Verification specifically
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [pickupVerifierName, setPickupVerifierName] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<'idle' | 'success' | 'fail'>('idle');

  // Key / Luggage finder contact details
  const [finderPhone, setFinderPhone] = useState('');

  // Activation flow states
  const [activationProgress, setActivationProgress] = useState(0);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activationCategory, setActivationCategory] = useState<'car' | 'bike' | 'home' | 'luggage' | 'keychain' | 'child'>('car');

  // Activation detail form states
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carPlate, setCarPlate] = useState('');

  // Map report types to label & design styles
  const getAlertMeta = (type: ReportType) => {
    switch (type) {
      case 'accident':
        return { label: 'Accident/Hazard', icon: AlertTriangle, color: '#c81b3a' };
      case 'wrong_parking':
        return { label: 'Wrong Parking', icon: Navigation, color: '#d53b00' };
      case 'medical_emergency':
        return { label: 'Medical Alert', icon: Activity, color: '#c81b3a' };
      case 'fire_emergency':
        return { label: 'Fire Emergency', icon: Flame, color: '#c81b3a' };
      case 'water_leakage':
        return { label: 'Water Leak', icon: Droplet, color: '#0070d1' };
      case 'gas_leakage':
        return { label: 'Gas Leak', icon: ShieldAlert, color: '#d53b00' };
      case 'security_alert':
        return { label: 'Security Alert', icon: ShieldCheck, color: '#c81b3a' };
      case 'courier_arrival':
        return { label: 'Courier Delivery', icon: Package, color: '#0070d1' };
      case 'visitor_notification':
        return { label: 'Visitor Ring', icon: Users, color: '#0070d1' };
      case 'lost_luggage':
        return { label: 'Luggage Found', icon: Briefcase, color: '#E25822' };
      case 'lost_key':
        return { label: 'Lost Keys Recovery', icon: Key, color: '#E25822' };
      case 'lost_child':
        return { label: 'Child Lost Help', icon: Backpack, color: '#c81b3a' };
      case 'contact_owner':
      default:
        return { label: 'Contact Owner', icon: PhoneCall, color: '#E25822' };
    }
  };

  const handleAlertSubmit = (e: React.FormEvent, customType?: ReportType, customMsg?: string) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    
    const finalType = customType || reportType;
    const finalMsg = customMsg || message || `Emergency update scanned via QR Tag ${qrCodeId}`;

    setTimeout(() => {
      onSubmitReport({
        vehicleId: product.id,
        vehicleLabel: product.name,
        licensePlate: product.details.licensePlate || undefined,
        type: finalType,
        message: finalMsg,
        location: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.01,
          lng: -122.4194 + (Math.random() - 0.5) * 0.01,
          accuracy: 10,
          timestamp: new Date().toISOString()
        },
        reporterPhone: finderPhone || undefined
      });
      setIsSubmitting(false);
      setSubmitted(true);
    }, 850);
  };

  const handleVerifyPickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || product.category !== 'child') return;
    if (pickupCodeInput.trim() === (product.details.pickupVerificationCode || '9574-SAFE')) {
      setVerificationFeedback('success');
      // Create visitor alert
      onSubmitReport({
        vehicleId: product.id,
        vehicleLabel: product.name,
        type: 'visitor_notification',
        message: `GUARDIAN VERIFIED: ${pickupVerifierName} has verified and picked up the child.`,
        location: null,
      });
    } else {
      setVerificationFeedback('fail');
    }
  };

  const handleActivateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);
    setActivationProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setActivationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);

        const nextProductId = `P-${Date.now().toString().slice(-4)}`;
        
        let initialDetails: NamoProduct['details'] = {};
        if (activationCategory === 'car') {
          initialDetails = {
            make: carMake || 'Tesla',
            model: carModel || 'Model Y',
            color: carColor || 'Black',
            licensePlate: carPlate.toUpperCase() || 'N-QR-PLAY',
          };
        } else if (activationCategory === 'bike') {
          initialDetails = {
            make: 'Honda',
            model: 'CB300R',
            color: 'Matte Black',
            licensePlate: 'BK-9912',
          };
        } else if (activationCategory === 'home') {
          initialDetails = {
            houseProfile: 'Villa 12, Park Street',
            emergencyInstructions: 'Main electrical fuse is inside the left boundary wall.',
            availabilityStatus: 'available',
            familyContacts: [{ name: 'Mihir Rathod', relation: 'Owner', phone: '+1 (555) 0192' }]
          };
        } else if (activationCategory === 'keychain') {
          initialDetails = {
            bloodGroup: 'B+',
            medicalConditions: 'Asthma',
            allergies: 'Peanuts',
            sosContacts: [{ name: 'Family Guard', phone: '+1 (555) 0192' }]
          };
        }

        const newProduct: NamoProduct = {
          id: nextProductId,
          category: activationCategory,
          name: `My NamoQR ${activationCategory.toUpperCase()}`,
          status: 'active',
          qrCodeId: qrCodeId,
          assignedTo: 'Self',
          createdAt: new Date().toISOString(),
          scansCount: 0,
          details: initialDetails,
        };

        const updatedQrCode: QRCodeData = {
          id: qrCodeId,
          vehicleId: nextProductId,
          status: 'active',
          scansCount: 0,
          createdAt: new Date().toISOString(),
        };

        if (onActivateSticker) {
          onActivateSticker(newProduct, updatedQrCode);
        }
        setIsActivating(false);
        setActivationSuccess(true);
      }
    }, 120);
  };

  // ────────────────────────────────────────────────────────
  // UNLINKED TAG ACTIVATION WIZARD VIEW
  // ────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[var(--cream)] font-sans text-[var(--ink)]">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {!activationSuccess ? (
              <motion.div
                key="activation-wizard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-6 md:p-8 bg-[var(--paper)] border border-[var(--line)] rounded-2xl"
              >
                {!isActivating ? (
                  <form onSubmit={handleActivateNewTag} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--orange)]/10 flex items-center justify-center text-[var(--orange)]">
                        <QrCode size={20} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-bold uppercase tracking-wide">Link Physical Sticker</h2>
                        <p className="text-[10px] text-[var(--ink-soft)] uppercase tracking-widest font-mono">Sticker Serial: {qrCodeId}</p>
                      </div>
                    </div>

                    {/* Step 1: Select Category */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Select Product Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { category: 'car', icon: Car, label: 'Car Sticker' },
                          { category: 'bike', icon: Bike, label: 'Bike Tag' },
                          { category: 'home', icon: Home, label: 'Home Gate' },
                          { category: 'luggage', icon: Luggage, label: 'Luggage Tag' },
                          { category: 'keychain', icon: Key, label: 'Keychain' },
                          { category: 'child', icon: Backpack, label: 'Child Bag' },
                        ].map((cat) => {
                          const Icon = cat.icon;
                          const isSel = activationCategory === cat.category;
                          return (
                            <button
                              key={cat.category}
                              type="button"
                              onClick={() => setActivationCategory(cat.category as any)}
                              className={`p-3 rounded-lg border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                isSel ? 'bg-[var(--orange)]/15 border-[var(--orange)] text-[var(--orange)]' : 'bg-[var(--cream-deep)] border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                              }`}
                            >
                              <Icon size={20} />
                              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Input product details based on choice */}
                    {activationCategory === 'car' && (
                      <div className="space-y-4 pt-2 border-t border-[var(--line)] text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--orange)]">Car Parameters</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--ink-soft)] uppercase mb-1">Make</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. BMW, Tesla" 
                              value={carMake} 
                              onChange={(e) => setCarMake(e.target.value)}
                              className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--ink-soft)] uppercase mb-1">Model</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. M3, Model Y" 
                              value={carModel} 
                              onChange={(e) => setCarModel(e.target.value)}
                              className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--ink-soft)] uppercase mb-1">Color</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Matte Gray" 
                              value={carColor} 
                              onChange={(e) => setCarColor(e.target.value)}
                              className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--ink-soft)] uppercase mb-1">License Plate</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. CA-QR-42" 
                              value={carPlate} 
                              onChange={(e) => setCarPlate(e.target.value)}
                              className="w-full clay-input text-xs uppercase font-mono tracking-wider placeholder:text-[var(--ink-faint)]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activationCategory !== 'car' && (
                      <div className="p-4 bg-[var(--cream-deep)] border border-[var(--line)] rounded text-left">
                        <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-sans">
                          You are activating a <strong className="text-[var(--ink)] uppercase">{activationCategory} tag</strong>. Product-specific forms, SOS links, and contact parameters will be automatically pre-configured.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-[var(--line)]">
                      <button
                        type="button"
                        onClick={onNavigateHome}
                        style={{background: 'var(--ink)', color: 'var(--cream)'}}
                        className="flex-1 clay-btn text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 clay-btn clay-btn-primary text-xs"
                      >
                        Activate QR Tag
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full border-4 border-[var(--orange)]/10 border-t-[var(--orange)] animate-spin mb-6" />
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--orange)] animate-pulse">
                      Activating Ecosystem Link...
                    </span>
                    <div className="w-48 bg-[var(--cream-deep)] h-1.5 rounded-full overflow-hidden mt-4">
                      <div 
                        className="bg-[var(--orange)] h-full transition-all duration-150" 
                        style={{ width: `${activationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="activation-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-8 bg-[var(--paper)] border border-[var(--green)]/20 rounded-2xl text-center"
              >
                <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 bg-[var(--green-soft)] text-[var(--green)] rounded-full">
                  <CheckCircle size={24} />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--ink)]">QR Sticker Activated</h2>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-2 mb-6 max-w-xs mx-auto">
                  Security shield is now operational. Place the hardware sticker on your physical asset to enable private scan alerts.
                </p>

                <div className="p-4 bg-[var(--cream-deep)] border border-[var(--line)] rounded-lg text-left mb-6 space-y-2">
                  <span className="text-[10px] font-bold text-[var(--orange)] uppercase tracking-wide block">Next Steps & Safety Tips</span>
                  <div className="text-[11px] text-[var(--ink)] space-y-1.5 leading-relaxed font-sans">
                    <p>1. Clean the target surface thoroughly before application.</p>
                    <p>2. Sticker works best on glass or plastic surfaces.</p>
                    <p>3. Do not scratch or pierce the black printed QR matrix.</p>
                  </div>
                </div>

                <button
                  onClick={onNavigateHome}
                  className="w-full clay-btn clay-btn-primary text-xs h-12"
                >
                  Enter User Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // ACTIVE PRODUCTS PUBLIC SCAN VIEWS
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[var(--cream)] font-sans text-[var(--ink)] relative">
      <div className="w-full max-w-xl space-y-4">
        
        {/* Header Ribbon: Scanned Product Context */}
        <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-xl flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--orange)]">Scanned Device</span>
            <h3 className="text-base font-bold uppercase tracking-tight text-[var(--ink)] mt-0.5">{product.name}</h3>
            <span className="text-[10px] text-[var(--ink-soft)] block font-mono">{product.qrCodeId}</span>
          </div>

          <div className="flex items-center gap-2">
            {product.category === 'car' && <Car className="text-[var(--orange)]" size={20} />}
            {product.category === 'bike' && <Bike className="text-[var(--orange)]" size={20} />}
            {product.category === 'home' && <Home className="text-[var(--orange)]" size={20} />}
            {product.category === 'luggage' && <Luggage className="text-[var(--orange)]" size={20} />}
            {product.category === 'keychain' && <Key className="text-[var(--orange)]" size={20} />}
            {product.category === 'child' && <Backpack className="text-[var(--orange)]" size={20} />}
            <span className="px-2 py-0.5 rounded bg-[var(--green-soft)] text-[var(--green)] border border-[var(--green)]/20 text-[9px] font-bold uppercase tracking-widest">
              Live Shield
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="scan-form-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              
              {/* CAR & BIKE SCANNING INTERFACE */}
              {(product.category === 'car' || product.category === 'bike') && (
                <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-2xl space-y-6">
                  <div className="text-left space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wide">Vehicle Incident Form</h4>
                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-sans">
                      Select the issue below to notify the owner. Your contact details remain anonymous.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'wrong_parking', label: 'Wrong Parking', icon: Navigation },
                      { type: 'accident', label: 'Crash / Accident', icon: AlertTriangle },
                      { type: 'contact_owner', label: 'General Message', icon: PhoneCall },
                    ].map((btn) => {
                      const Icon = btn.icon;
                      const isSel = reportType === btn.type;
                      return (
                        <button
                          key={btn.type}
                          type="button"
                          onClick={() => setReportType(btn.type as any)}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                            isSel ? 'bg-[var(--orange)]/15 border-[var(--orange)] text-[var(--orange)]' : 'bg-[var(--cream-deep)] border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {product.category === 'car' && reportType === 'accident' && (
                    <div className="p-3 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded-lg text-left flex items-start gap-3">
                      <ShieldCheck size={16} className="text-[var(--orange)] shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed text-[var(--orange)]/90 font-sans font-medium">
                        <strong>AI Crash Assistance Active:</strong> Scanning this triggers real-time accident support telemetry to the owner's emergency contact list.
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleAlertSubmit} className="space-y-4">
                    <div className="text-left">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1.5 pl-1">Message Detail</label>
                      <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Your car is blocking my garage door, please help shift it."
                        className="w-full p-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink)] outline-none focus:border-[var(--orange)] placeholder:text-[var(--ink-faint)]"
                      />
                    </div>

                    <div className="text-left">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1.5 pl-1">Your Callback Phone (Optional)</label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 992-0192"
                        value={finderPhone}
                        onChange={(e) => setFinderPhone(e.target.value)}
                        className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full clay-btn clay-btn-primary text-xs disabled:opacity-50"
                    >
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Dispatched...</> : <><Send size={14} /> Send Anonymous Alert</>}
                    </button>
                  </form>
                </div>
              )}

              {/* HOME GATE SCANNING INTERFACE */}
              {product.category === 'home' && (
                <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-2xl space-y-6">
                  <div className="flex justify-between items-start border-b border-[var(--line)] pb-4">
                    <div className="text-left space-y-0.5">
                      <h4 className="text-sm font-bold uppercase tracking-wide">Home Gate Alert</h4>
                      <p className="text-[11px] text-[var(--ink-soft)] font-sans">{product.details.houseProfile || 'Resident Gateway'}</p>
                    </div>

                    {/* Availability Indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--ink-soft)]">Status:</span>
                      {product.details.availabilityStatus === 'available' && (
                        <span className="px-2 py-0.5 bg-[var(--green-soft)] text-[var(--green)] border border-[var(--green)]/20 text-[9px] font-bold uppercase tracking-wider rounded">
                          Available
                        </span>
                      )}
                      {product.details.availabilityStatus === 'away' && (
                        <span className="px-2 py-0.5 bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20 text-[9px] font-bold uppercase tracking-wider rounded">
                          Away
                        </span>
                      )}
                      {product.details.availabilityStatus === 'do_not_disturb' && (
                        <span className="px-2 py-0.5 bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20 text-[9px] font-bold uppercase tracking-wider rounded">
                          Silent / DND
                        </span>
                      )}
                    </div>
                  </div>

                  {product.details.emergencyInstructions && (
                    <div className="p-3 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded-lg text-left">
                      <span className="text-[9px] font-bold text-[var(--orange)] uppercase tracking-widest block mb-1">Emergency Instructions</span>
                      <p className="text-xs text-[var(--ink)] font-sans leading-relaxed">{product.details.emergencyInstructions}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] text-left">Select Alert Option</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { type: 'visitor_notification', label: 'Visitor Ring', icon: Users },
                        { type: 'courier_arrival', label: 'Courier Arrival', icon: Package },
                        { type: 'medical_emergency', label: 'Medical Emergency', icon: Activity },
                        { type: 'fire_emergency', label: 'Fire Emergency', icon: Flame },
                        { type: 'water_leakage', label: 'Water Leakage', icon: Droplet },
                        { type: 'gas_leakage', label: 'Gas Leakage', icon: ShieldAlert },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = selectedHomeAlert === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setSelectedHomeAlert(item.type as any)}
                            className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isSel ? 'bg-[var(--orange)]/15 border-[var(--orange)] text-[var(--orange)]' : 'bg-[var(--cream-deep)] border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                            }`}
                          >
                            <Icon size={16} className="shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={(e) => handleAlertSubmit(e, selectedHomeAlert, message || `Resident alert sent for ${selectedHomeAlert}`)} className="space-y-4">
                    <div className="text-left">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1.5 pl-1">Optional Details</label>
                      <textarea
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Neighbors water pipe is dripping into gate driveway..."
                        className="w-full p-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink)] outline-none focus:border-[var(--orange)] placeholder:text-[var(--ink-faint)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full clay-btn clay-btn-primary text-xs"
                    >
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : 'Send Resident Notification'}
                    </button>
                  </form>
                </div>
              )}

              {/* LUGGAGE SCANNING INTERFACE */}
              {product.category === 'luggage' && (
                <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-2xl space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center mx-auto border border-[var(--green)]/20">
                      <UserCheck size={24} />
                    </div>
                    <h4 className="text-base font-bold uppercase tracking-wide">Owner Verified Security</h4>
                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-sans max-w-sm mx-auto">
                      You have scanned a verified luggage asset. Check the owner's status note below to assist in recovery.
                    </p>
                  </div>

                  {product.details.lostFoundNote && (
                    <div className="p-4 bg-[var(--green-soft)] border border-[var(--green)]/20 rounded-lg text-left space-y-1">
                      <span className="text-[10px] font-bold text-[var(--green)] uppercase tracking-widest block">Owner Lost-Found Note</span>
                      <p className="text-xs text-[var(--ink)] font-sans italic">"{product.details.lostFoundNote}"</p>
                    </div>
                  )}

                  <div className="p-4 bg-[var(--cream-deep)] border border-[var(--line)] rounded-xl space-y-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] text-left">Connect with Owner</span>
                    
                    <form onSubmit={(e) => handleAlertSubmit(e, 'lost_luggage', message || `Luggage Tag Scanned`)} className="space-y-3">
                      <div>
                        <input
                          type="tel"
                          required
                          placeholder="Your Phone Number"
                          value={finderPhone}
                          onChange={(e) => setFinderPhone(e.target.value)}
                          className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={2}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Where is the luggage? (e.g. Munich Terminal 2 Baggage Counter)"
                          className="w-full p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)] outline-none focus:border-[var(--orange)] placeholder:text-[var(--ink-faint)]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full clay-btn clay-btn-primary"
                      >
                        {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Dispatching...</> : 'Send Recovery Update'}
                      </button>
                    </form>
                  </div>

                  <div className="flex items-center gap-2 justify-center text-[10px] font-bold uppercase text-[var(--ink-faint)] font-sans">
                    <Globe size={12} />
                    <span>International Recovery Support Integrated</span>
                  </div>
                </div>
              )}

              {/* KEYCHAIN SCANNING INTERFACE */}
              {product.category === 'keychain' && (
                <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-2xl space-y-6">
                  <div className="text-left border-b border-[var(--line)] pb-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide">Emergency SOS Profile</h4>
                    <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">Assigned: {product.assignedTo}</p>
                  </div>

                  {/* Medical Parameter Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded text-center">
                      <span className="text-[9px] font-bold text-[var(--orange)] uppercase tracking-wide block">Blood Group</span>
                      <span className="text-lg font-bold text-[var(--ink)] block mt-1">{product.details.bloodGroup || '—'}</span>
                    </div>
                    <div className="p-3 bg-[var(--cream-deep)] border border-[var(--line)] rounded text-center col-span-2">
                      <span className="text-[9px] font-bold text-[var(--ink-soft)] uppercase tracking-wide block text-left pl-1">Medical Conditions</span>
                      <span className="text-xs font-semibold text-[var(--ink)] block text-left pl-1 mt-1 truncate">{product.details.medicalConditions || 'None Declared'}</span>
                    </div>
                  </div>

                  {product.details.allergies && (
                    <div className="p-3.5 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded text-left">
                      <span className="text-[9px] font-bold text-[var(--orange)] uppercase tracking-wide block">Allergy Records</span>
                      <span className="text-xs font-semibold text-[var(--ink)] block mt-1 leading-normal font-sans">{product.details.allergies}</span>
                    </div>
                  )}

                  {/* SOS Actions panel */}
                  <div className="space-y-3 pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] text-left">SOS Fast Action Link</span>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => handleAlertSubmit(e, 'medical_emergency', 'SOS Triggered: Scanner alerted for Keychain Medical SOS!')}
                        className="flex-1 py-3 bg-[var(--orange-deep)] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <ShieldAlert size={14} /> Notify Family SOS
                      </button>
                      
                      <button 
                        onClick={() => {
                          alert("Live location sharing simulated. Coordinates logged to server.");
                          onSubmitReport({
                            vehicleId: product.id,
                            vehicleLabel: product.name,
                            type: 'lost_key',
                            message: `LOCATION TRACKING PINNED: Finder shares approximate location.`,
                            location: {
                              lat: 37.7749,
                              lng: -122.4194,
                              accuracy: 5
                            }
                          });
                        }}
                        className="flex-1 py-3 bg-[var(--ink)] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <MapPin size={14} /> Share Live Location
                      </button>
                    </div>
                  </div>

                  {/* Finder Recovery Input Form */}
                  <div className="p-4 bg-[var(--cream-deep)] border border-[var(--line)] rounded-xl text-left space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Found this item? Connect securely</span>
                    <form onSubmit={(e) => handleAlertSubmit(e, 'lost_key', message || 'Keychain found report!')} className="space-y-3">
                      <input
                        type="tel"
                        required
                        placeholder="Your contact number"
                        value={finderPhone}
                        onChange={(e) => setFinderPhone(e.target.value)}
                        className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                      />
                      <textarea
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Leave recovery details (e.g. Left keys at counter 4)"
                        className="w-full p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)] outline-none focus:border-[var(--orange)] placeholder:text-[var(--ink-faint)]"
                      />
                      <button type="submit" className="w-full clay-btn clay-btn-primary text-xs">
                        Submit Recovery Message
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* CHILD SCHOOL BAG STICKER & KEYCHAIN */}
              {product.category === 'child' && (
                <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-2xl space-y-6">
                  <div className="text-left border-b border-[var(--line)] pb-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide">Child Outing Safety Shield</h4>
                    <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">School: {product.details.schoolName || 'Not Declared'}</p>
                  </div>

                  {/* Pickup Verification Box */}
                  <div className="p-4 bg-[var(--cream-deep)] border border-[var(--line)] rounded-xl text-left space-y-3">
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={16} className="text-[var(--orange)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">Guardian Pickup Verification</span>
                    </div>

                    <form onSubmit={handleVerifyPickup} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Your Name (e.g. Driver, Uncle)"
                          value={pickupVerifierName}
                          onChange={(e) => setPickupVerifierName(e.target.value)}
                          className="w-full clay-input text-xs placeholder:text-[var(--ink-faint)]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Enter Pickup Code"
                          value={pickupCodeInput}
                          onChange={(e) => setPickupCodeInput(e.target.value)}
                          className="w-full clay-input text-xs font-bold uppercase text-center tracking-widest placeholder:text-[var(--ink-faint)]"
                        />
                      </div>
                      <button type="submit" className="w-full clay-btn clay-btn-primary text-xs">
                        Verify Authorization
                      </button>
                    </form>

                    {verificationFeedback === 'success' && (
                      <div className="p-2.5 bg-[var(--green-soft)] border border-[var(--green)]/20 text-[var(--green)] text-xs font-bold rounded uppercase tracking-wide text-center">
                        ✓ Verification Success: Guardian Authorized
                      </div>
                    )}
                    {verificationFeedback === 'fail' && (
                      <div className="p-2.5 bg-[var(--orange)]/10 border border-[var(--orange)]/20 text-[var(--orange)] text-xs font-bold rounded uppercase tracking-wide text-center">
                        ⚠ Verification Failure: Code Incorrect
                      </div>
                    )}
                  </div>

                  {/* Bus details section */}
                  {product.details.busDetails && (
                    <div className="p-3 bg-[var(--cream-deep)] border border-[var(--line)] rounded-lg text-left flex items-start gap-2.5 font-sans">
                      <Compass size={16} className="text-[var(--orange)] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-[var(--ink)] block">Bus Route Logistics</span>
                        <span className="text-[var(--ink-soft)] block mt-0.5">{product.details.busDetails}</span>
                      </div>
                    </div>
                  )}

                  {/* SOS Notification Trigger */}
                  <div className="p-4 bg-[var(--orange-deep)]/15 border border-[var(--orange-deep)]/20 rounded-xl space-y-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--orange)] text-left">Emergency SOS trigger</span>
                    
                    <button 
                      onClick={(e) => handleAlertSubmit(e, 'lost_child', 'SOS ACTION: Child found lost alert dispatcher!')}
                      className="w-full py-3.5 bg-[var(--orange-deep)] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      <ShieldAlert size={14} /> Notify Parent Instantly
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            <motion.div
              key="alert-dispatched"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center bg-[var(--paper)] border border-[var(--line)] rounded-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4 bg-[var(--green-soft)] text-[var(--green)] rounded-full">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--ink)]">Message Dispatched</h2>
              <p className="text-xs text-[var(--ink-soft)] mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                Your notification has been routed securely to the owner. Your contact details remain protected by NamoQR.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setSubmitted(false); setMessage(''); setFinderPhone(''); }}
                  style={{background: 'var(--ink)', color: 'var(--cream)'}}
                  className="flex-1 clay-btn text-xs"
                >
                  Send Another
                </button>
                <button 
                  onClick={onNavigateHome} 
                  className="flex-1 clay-btn clay-btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
