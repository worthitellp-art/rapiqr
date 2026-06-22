import React from 'react';
import { motion } from 'motion/react';
import { QrCode, ShieldCheck, ArrowRight, Car, Menu, X } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onSimulateScan: (qrId: string) => void;
}

export default function LandingPage({ onStart, onLogin, onSimulateScan }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="bg-[#f0f4f8] text-slate-800 font-sans min-h-screen selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/45 bg-white/40 backdrop-blur-xl px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-6">
            <a href="#how-namoqr-works" className="hidden sm:inline-block font-sans text-sm font-bold transition-all hover:text-[#3B82F6]" style={{ color: '#1C398E' }}>About</a>
            <a href="#interactive-demo-hub" className="hidden sm:inline-block font-sans text-sm font-bold transition-all hover:text-[#3B82F6]" style={{ color: '#1C398E' }}>Services</a>
          </div>

          <div className="flex items-center gap-2 font-serif font-black text-xl sm:text-2xl tracking-tighter shrink-0 select-none" style={{ color: '#3B82F6' }}>
            <QrCode size={20} className="sm:size-[22px]" />
            <span>NAMO<span className="font-medium" style={{ color: '#1C398E' }}>QR</span></span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onStart} className="clay-btn clay-btn-primary px-4 sm:px-5 py-2 text-[11px] sm:text-xs">
              Get Started
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 rounded-xl transition-all active:scale-90" style={{ color: '#1C398E' }}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="sm:hidden pb-3 flex flex-col gap-2 px-2">
            <a href="#how-namoqr-works" onClick={() => setMenuOpen(false)} className="font-sans text-sm font-bold py-2 px-3 rounded-xl transition-all" style={{ color: '#1C398E' }}>About</a>
            <a href="#interactive-demo-hub" onClick={() => setMenuOpen(false)} className="font-sans text-sm font-bold py-2 px-3 rounded-xl transition-all" style={{ color: '#1C398E' }}>Services</a>
          </motion.div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="relative pt-12 sm:pt-20 md:pt-28 pb-20 sm:pb-28 md:pb-32 overflow-hidden z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center text-center lg:text-left">
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-3xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight uppercase"
                style={{ color: '#1C398E', textShadow: '4px 4px 0 rgba(59,130,246,0.15), 8px 8px 0 rgba(59,130,246,0.05)' }}
              >
                Secure Your Car. <br />
                <span className="font-light" style={{ color: '#3B82F6', textShadow: '2px 2px 0 rgba(59,130,246,0.1)' }}>Contact Privately.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-sans text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
                style={{ color: '#1C398E' }}
              >
                Windshield QR tags let bystanders alert you about parking or emergencies instantly. No phone numbers shared, total privacy.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
              >
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={onStart}
                  className="clay-btn clay-btn-primary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight size={14} className="sm:size-4" />
                </motion.button>
                <motion.a
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ scale: 1.02 }}
                  href="#interactive-demo-hub"
                  className="clay-btn clay-btn-white w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm flex items-center justify-center"
                >
                  Try Scanned Demo
                </motion.a>
              </motion.div>
            </div>

            <div className="lg:col-span-5 flex justify-center pt-6 sm:pt-8 lg:pt-0">
              <motion.div
                className="relative w-full max-w-[240px] xs:max-w-xs sm:max-w-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <div
                  className="p-4 sm:p-6 flex flex-col items-center relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: '20px',
                    boxShadow: 'inset 6px 6px 12px rgba(255,255,255,0.95), inset -6px -6px 12px rgba(59,130,246,0.08), 0 20px 40px -8px rgba(59,130,246,0.12)',
                  }}
                >
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 font-helvetica text-[8px] sm:text-[10px] font-bold uppercase tracking-wider" style={{
                    background: '#3B82F6', color: '#fff', borderRadius: '16px',
                    boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.1)',
                  }}>
                    Windshield Tag
                  </div>
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mt-5 sm:mt-6 p-1.5 sm:p-2 flex items-center justify-center relative overflow-hidden" style={{
                    background: '#fff', borderRadius: '16px',
                    boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.04), inset -4px -4px 8px rgba(255,255,255,0.8), 0 4px 12px rgba(59,130,246,0.06)',
                  }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/scan/QR-8A3F')}`}
                      alt="Windshield QR Tag"
                      className="w-full h-full object-contain"
                    />
                    <motion.div
                      className="absolute inset-x-0 h-[2px]"
                      style={{ background: '#3B82F6', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
                      animate={{ top: ['4%', '96%', '4%'] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    />
                  </div>
                  <div className="mt-3 sm:mt-4 text-center">
                    <span className="font-serif font-black text-[10px] sm:text-xs uppercase tracking-tight block" style={{ color: '#1C398E' }}>Tesla Model 3</span>
                    <span className="font-helvetica text-[8px] sm:text-[10px] font-bold block mt-0.5" style={{ color: '#1C398E', opacity: 0.6 }}>Plate: P-ELECTRIC</span>
                  </div>
                </div>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: [0, -12, 0], opacity: 1 }}
                  transition={{ y: { repeat: Infinity, duration: 5, ease: "easeInOut" }, opacity: { delay: 0.5, duration: 0.8 } }}
                  className="absolute -bottom-6 sm:-bottom-8 -right-2 sm:-right-4 w-36 sm:w-44 p-3 sm:p-4 flex flex-col items-center text-center"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.2), inset -4px -4px 10px rgba(0,0,0,0.15), 0 12px 28px -4px rgba(79,70,229,0.3)',
                    color: '#fff',
                  }}
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-1.5 sm:mb-2" style={{
                    background: 'rgba(16,185,129,0.15)', borderRadius: '50%',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(0,0,0,0.1)',
                  }}>
                    <QrCode size={12} className="sm:size-4 animate-pulse" style={{ color: '#34d399' }} />
                  </div>
                  <span className="font-helvetica text-[8px] sm:text-[10px] tracking-widest font-bold uppercase" style={{ color: '#a5b4fc' }}>Scan Detected</span>
                  <h5 className="text-[10px] sm:text-[11px] font-bold text-white mt-0.5 sm:mt-1 leading-tight">Instant Notification</h5>
                  <button
                    onClick={() => onSimulateScan('QR-8A3F')}
                    className="mt-2 sm:mt-3 w-full py-1 sm:py-1.5 font-bold text-[8px] sm:text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                    style={{
                      background: '#fff', color: '#4f46e5', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.8)',
                      boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    Test Scan Flow
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Demo Section ────────────────────────────────── */}
      <section id="interactive-demo-hub" className="py-12 sm:py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-5 sm:p-8 md:p-10" style={{
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.9)', borderRadius: '20px',
            boxShadow: 'inset 6px 6px 12px rgba(255,255,255,0.95), inset -6px -6px 12px rgba(59,130,246,0.06), 0 20px 40px -8px rgba(59,130,246,0.1)',
          }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
              <div className="max-w-md">
                <span className="inline-block text-[10px] sm:text-xs font-helvetica px-3 py-1 font-bold uppercase tracking-widest mb-2 sm:mb-3" style={{
                  background: '#3B82F6', color: '#fff', borderRadius: '20px',
                  boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.1)',
                }}>
                  Interactive Demo
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ color: '#1C398E' }}>Simulate QR Scanner</h3>
                <p className="font-sans text-[11px] sm:text-xs mt-1.5 leading-relaxed font-medium" style={{ color: '#1C398E', opacity: 0.6 }}>
                  Select a preset tag to experience the scan flow.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
                {[
                  { id: 'QR-8A3F', label: 'Tesla Model 3', color: '#3B82F6' },
                  { id: 'QR-9K2L', label: 'BMW M4 Coupe', color: '#1C398E' },
                  { id: 'QR-5T7S', label: 'Toyota RAV4', color: '#16A34A' },
                ].map((car) => (
                  <button
                    key={car.id}
                    onClick={() => onSimulateScan(car.id)}
                    className="flex flex-col items-center justify-center p-2.5 sm:p-4 text-center transition-all active:scale-95 cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.5)', borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.7)',
                      boxShadow: 'inset 3px 3px 6px rgba(255,255,255,0.9), inset -3px -3px 6px rgba(59,130,246,0.04)',
                    }}
                  >
                    <Car size={16} className="sm:size-5 mb-1" style={{ color: car.color }} />
                    <span className="font-helvetica text-[9px] sm:text-xs font-bold" style={{ color: '#1C398E', opacity: 0.5 }}>{car.label}</span>
                    <span className="font-serif text-[8px] sm:text-[10px] font-black uppercase mt-0.5" style={{ color: car.color }}>Scan {car.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section id="how-namoqr-works" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: '#1C398E' }}>How NamoQR Works</h2>
            <p className="font-sans text-xs sm:text-sm mt-2 font-medium" style={{ color: '#1C398E', opacity: 0.5 }}>
              Four steps from registration to secure real-world protection.
            </p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {[
              { num: '01', title: 'Add Vehicle', desc: 'Add your vehicle details like make, model, and plate into your secure dashboard.' },
              { num: '02', title: 'Generate QR', desc: 'Generate a customized QR code tag mapped to your specific vehicle ID.' },
              { num: '03', title: 'Stick Tag', desc: 'Print your window tag and place it on your dashboard or windshield.' },
              { num: '04', title: 'Get Alerts', desc: 'Bystanders scan to report blocking or hazards. We alert you privately.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className="p-5 sm:p-6 space-y-3 sm:space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.6)', borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 4px 4px 8px rgba(255,255,255,0.9), inset -4px -4px 8px rgba(59,130,246,0.04)',
                }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-serif text-sm sm:text-base font-black text-white" style={{
                  background: '#3B82F6', borderRadius: '14px',
                  boxShadow: 'inset 3px 3px 6px rgba(255,255,255,0.3), inset -3px -3px 6px rgba(0,0,0,0.1)',
                }}>
                  {step.num}
                </div>
                <h3 className="font-serif font-black text-base sm:text-lg uppercase tracking-tight" style={{ color: '#1C398E' }}>{step.title}</h3>
                <p className="font-sans text-[11px] sm:text-xs leading-relaxed font-medium" style={{ color: '#1C398E', opacity: 0.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: '#1C398E' }}>Simple Pricing</h2>
            <p className="font-sans text-xs sm:text-sm mt-2 font-medium" style={{ color: '#1C398E', opacity: 0.5 }}>
              Start protecting your vehicle for free, or upgrade for full coverage.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden" style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: 'inset 6px 6px 12px rgba(255,255,255,0.95), inset -6px -6px 12px rgba(59,130,246,0.06), 0 20px 40px -8px rgba(59,130,246,0.1)',
            }}>
              <div>
                <span className="font-helvetica text-[10px] sm:text-xs tracking-wider font-extrabold uppercase" style={{ color: '#1C398E', opacity: 0.4 }}>Basic Protection</span>
                <h3 className="font-serif text-xl sm:text-2xl font-black mt-1 uppercase tracking-tight" style={{ color: '#1C398E' }}>Free Tier</h3>
                <div className="mt-3 sm:mt-4 flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-serif font-black tracking-tight" style={{ color: '#1C398E' }}>$0</span>
                  <span className="text-xs sm:text-sm font-semibold ml-1" style={{ color: '#1C398E', opacity: 0.4 }}>forever</span>
                </div>
                <p className="font-sans text-[11px] sm:text-xs leading-relaxed mt-3 sm:mt-4 font-medium" style={{ color: '#1C398E', opacity: 0.5 }}>
                  Essential tools for individual owners who want straightforward privacy-focused security.
                </p>
                <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-[11px] sm:text-xs border-t pt-5 sm:pt-6 font-semibold" style={{ borderColor: 'rgba(59,130,246,0.06)', color: '#1C398E' }}>
                  {['1 Registered Vehicle', '1 Standard Printable QR Code', 'Real-time Email Alerts', 'Location Tagging'].map((f) => (
                    <li key={f} className="flex items-center gap-2 sm:gap-2.5">
                      <ShieldCheck size={14} className="sm:size-4 shrink-0" style={{ color: '#3B82F6', opacity: 0.5 }} />
                      <span style={{ opacity: 0.8 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <motion.button whileTap={{ scale: 0.93 }} onClick={onStart} className="clay-btn clay-btn-primary w-full mt-6 sm:mt-8 py-3 sm:py-3.5 text-[11px] sm:text-xs">
                Sign Up Free
              </motion.button>
            </div>

            {/* Pro */}
            <div className="p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.2), inset -4px -4px 10px rgba(0,0,0,0.1), 0 12px 28px -4px rgba(59,130,246,0.3)',
              color: '#fff',
            }}>
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-2.5 py-0.5 sm:py-1 font-helvetica text-[8px] sm:text-[10px] font-bold uppercase bg-white rounded-full tracking-wider shadow-xs" style={{ color: '#3B82F6' }}>
                Recommended
              </div>
              <div>
                <span className="font-helvetica text-[10px] sm:text-xs tracking-wider font-extrabold uppercase" style={{ opacity: 0.7 }}>Total Shield</span>
                <h3 className="font-serif text-xl sm:text-2xl font-black mt-1 uppercase tracking-tight">Pro Premium</h3>
                <div className="mt-3 sm:mt-4 flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-serif font-black tracking-tight">$5</span>
                  <span className="text-xs sm:text-sm font-semibold ml-1" style={{ opacity: 0.7 }}>/ month</span>
                </div>
                <p className="font-sans text-[11px] sm:text-xs leading-relaxed mt-3 sm:mt-4 font-medium" style={{ opacity: 0.8 }}>
                  Advanced alert channels, SMS callbacks, priority support, and custom styles.
                </p>
                <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-[11px] sm:text-xs border-t pt-5 sm:pt-6 font-bold" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {['Unlimited Vehicles', 'Unlimited QR Codes', 'SMS Callback Alerts', 'Custom SVG Download'].map((f) => (
                    <li key={f} className="flex items-center gap-2 sm:gap-2.5">
                      <ShieldCheck size={14} className="sm:size-4 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <motion.button whileTap={{ scale: 0.93 }} onClick={onStart} className="clay-btn clay-btn-white w-full mt-6 sm:mt-8 py-3 sm:py-3.5 text-[11px] sm:text-xs">
                Get Pro Shield
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-10 md:p-14 text-center relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.2), inset -4px -4px 10px rgba(0,0,0,0.1), 0 12px 28px -4px rgba(59,130,246,0.3)',
            color: '#fff',
          }}>
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase">Secure your vehicle today</h2>
              <p className="font-sans text-[11px] sm:text-xs md:text-sm mt-3 leading-relaxed font-semibold" style={{ opacity: 0.8 }}>
                No phone number disclosure, no complicated tracking. Join thousands of drivers avoiding municipal towing fees and disputes.
              </p>
              <motion.button whileTap={{ scale: 0.93 }} onClick={onStart} className="clay-btn clay-btn-white mt-6 sm:mt-8 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm inline-flex items-center gap-2">
                Access Dashboard <ArrowRight size={14} className="sm:size-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/40 bg-white/20 backdrop-blur-md py-8 sm:py-12 text-center relative z-10">
        <p className="font-serif font-black text-lg sm:text-xl uppercase tracking-tighter" style={{ color: '#3B82F6' }}>
          NAMO<span className="font-medium" style={{ color: '#1C398E' }}>QR</span>
        </p>
        <p className="font-helvetica text-[10px] sm:text-[11px] mt-2" style={{ color: '#1C398E', opacity: 0.35 }}>
          &copy; {new Date().getFullYear()} NAMOQR, Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
