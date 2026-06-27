import React from 'react';
import { motion } from 'motion/react';
import { QrCode, ShieldCheck, ArrowRight, Car, Menu, X, BellRing, Phone, Ambulance, GripHorizontal, ShieldAlert, Zap, Globe, Lock } from 'lucide-react';
import TiltCard from './ui/TiltCard';
import MagneticBtn from './ui/MagneticBtn';

const colors = {
  primary: '#0070d1', // PlayStation Blue
  primaryPressed: '#0064b7',
  commerce: '#d53b00', // Commerce Orange (CTA for purchasing)
  canvasDark: '#000000',
  canvasLight: '#ffffff',
  surfaceDarkElevated: '#121314',
  surfaceDarkCard: '#181818',
  surfaceCard: '#f5f7fa',
  surfaceSoft: '#f3f3f3',
  ink: '#000000',
  bodyLight: 'rgba(0,0,0,0.6)',
  bodyDark: 'rgba(255,255,255,0.7)',
  onDark: '#ffffff',
  hairlineLight: '#f3f3f3',
  hairlineDark: 'rgba(229,229,229,0.15)',
  goldStart: '#ffce21',
  goldEnd: '#ee8e00',
};

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onSimulateScan: (qrId: string) => void;
}

function BeaconPulse() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: 'rgba(0,112,209,0.3)', width: 80, height: 80 }}
          animate={{
            scale: [1, 3.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage({ onStart, onLogin, onSimulateScan }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const steps = [
    { num: '01', icon: Car, title: 'Register Your Vehicle', desc: 'Securely link your car details (make, model, color, license plate) to your account. Your personal contact information is held behind our encrypted shield.' },
    { num: '02', icon: QrCode, title: 'Print or Order Tag', desc: 'Download your high-fidelity, unique QR code sticker. Apply it to your windshield. Durable, weather-resistant, and optimized for scan readability.' },
    { num: '03', icon: BellRing, title: 'Anonymous Communication', desc: 'If there is an obstruction, hazard, or lockout, bystanders scan the tag and alert you instantly. Your phone number remains completely private.' },
  ];

  return (
    <div className="font-sans min-h-screen relative overflow-hidden bg-[#ffffff] text-[#000000]">
      
      {/* ── SONY/Brand Top-Bar (Realistic PlayStation style) ── */}


      {/* ── PlayStation Primary Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full px-5 sm:px-8 border-b" style={{
        background: colors.canvasDark,
        borderColor: colors.hairlineDark
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5 font-serif font-light text-lg tracking-tight shrink-0 select-none text-white">
            <QrCode size={20} className="text-[#0070d1]" />
            <span className="tracking-wide">NAMO<span className="font-bold text-[#0070d1]">QR</span></span>
          </div>

          <div className="hidden sm:flex items-center gap-8 h-full">
            {['How It Works', 'Key Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="font-sans text-[11px] font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white relative h-full flex items-center after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#0070d1] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="hidden sm:inline-block font-sans text-[11px] font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white"
            >
              Log In
            </button>
            <button onClick={onStart} className="clay-button-primary px-5 py-2 text-[11px] h-9 flex items-center justify-center font-bold tracking-wider">
              Get Started
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-1 text-white/80 transition-all bg-transparent border-none outline-none">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="sm:hidden pb-4 pt-2 flex flex-col gap-1.5 bg-black px-4 border-b border-white/10">
            {['How It Works', 'Key Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMenuOpen(false)}
                className="font-sans text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-md transition-all text-white/80 hover:bg-white/10"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* ── Hero (Dark Canvas Chapter) ────────────────────────────────────── */}
      <header className="relative min-h-[90vh] flex items-center py-20 overflow-hidden z-10" style={{ background: colors.canvasDark }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] mx-auto lg:mx-0"
                style={{
                  background: colors.primary,
                  borderRadius: '9999px',
                  color: colors.onDark,
                }}
              >
                Privacy first. No phone number shared.
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="ps-display-xl text-white leading-[1.1] text-left uppercase"
              >
                Your Car.<br />Always Connected.<br />
                <span className="font-light text-[#0070d1]">Safeguard Your Privacy.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-sans text-[16px] leading-relaxed max-w-lg mx-auto lg:mx-0 text-left"
                style={{ color: colors.bodyDark }}
              >
                A simple windshield QR sticker links bystanders, parking authorities, and emergency teams to you instantly. No phone numbers are exposed, ensuring absolute security.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 w-full"
              >
                <button onClick={onStart}
                  className="clay-btn-green w-full sm:w-auto px-8 py-3.5 text-xs flex items-center justify-center gap-2 font-bold tracking-wider"
                >
                  Get Your Free Tag <ArrowRight size={15} />
                </button>
                <a href="#how-it-works"
                  className="clay-btn-white w-full sm:w-auto px-8 py-3.5 text-xs flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 font-bold tracking-wider"
                >
                  How It Works
                </a>
              </motion.div>

              {/* Muted stats grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center justify-between max-w-md pt-6"
              >
                {[
                  { value: '10K+', label: 'Active Vehicles' },
                  { value: '2.3K', label: 'Emergency Alerts' },
                  { value: '99%', label: 'Delivery Success' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-4 sm:gap-6">
                    <div className="text-left">
                      <span className="font-serif font-light text-2xl tracking-tight text-white">{stat.value}</span>
                      <span className="font-sans text-[9px] font-bold block mt-0.5 uppercase tracking-wider text-white/50">{stat.label}</span>
                    </div>
                    {i < 2 && <div className="w-px h-8 bg-white/10" />}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Showcase Card */}
            <div className="lg:col-span-5 flex justify-center pt-6 lg:pt-0">
              <motion.div
                className="relative w-full max-w-[300px]"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <BeaconPulse />
                <div className="p-6 flex flex-col items-center relative overflow-hidden" style={{
                  background: colors.surfaceDarkCard,
                  border: `1px solid ${colors.hairlineDark}`,
                  borderRadius: '8px', // rounded-md
                }}>
                  <div className="absolute top-4 left-4 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-wider" style={{
                    background: colors.primary, color: colors.onDark, borderRadius: '9999px',
                  }}>
                    Live Sticker Tag
                  </div>
                  
                  {/* QR Core Render (High-Tech PlayStation Scanner) */}
                  <div className="w-36 h-36 mt-10 p-3 flex items-center justify-center relative overflow-hidden bg-white rounded-md border border-slate-100">
                    
                    {/* Scanner Corner Brackets */}
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#0070d1] rounded-tl-xs" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#0070d1] rounded-tr-xs" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#0070d1] rounded-bl-xs" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#0070d1] rounded-br-xs" />
                    
                    {/* QR Code */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/scan/QR-8A3F')}`} alt="Emergency QR Tag" className="w-[85%] h-[85%] object-contain opacity-90" />
                    
                    {/* Glowing Laser Scan Line */}
                    <motion.div 
                      className="absolute inset-x-2 h-[2px]" 
                      style={{ 
                        background: 'linear-gradient(90deg, transparent, #0070d1 20%, #53b1ff 50%, #0070d1 80%, transparent)',
                        boxShadow: '0 0 10px #0070d1, 0 0 20px #53b1ff'
                      }}
                      animate={{ top: ['8%', '88%', '8%'] }} 
                      transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }} 
                    />
                    
                    {/* Pulsating Scanning Grid overlay */}
                    <motion.div 
                      className="absolute inset-2 bg-[linear-gradient(rgba(0,112,209,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,112,209,0.03)_1px,transparent_1px)]"
                      style={{ backgroundSize: '8px 8px' }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3.0, ease: "easeInOut" }}
                    />
                  </div>
                  
                  <div className="mt-5 text-center">
                    <span className="font-serif font-light text-sm uppercase tracking-tight block text-white">Tesla Model 3</span>
                    <span className="font-sans text-[10px] block mt-1 text-white/50 uppercase tracking-wider">Plate: P-ELECTRIC</span>
                  </div>
                  
                  <div className="mt-5 w-full flex items-center justify-center gap-5 pt-4 border-t" style={{ borderColor: colors.hairlineDark }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0070d1' }} />
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-white/50">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={11} className="text-[#0070d1]" />
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-white/50">Private</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Notification Toast */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: [0, -6, 0], opacity: 1 }}
                  transition={{ y: { repeat: Infinity, duration: 5, ease: "easeInOut" }, opacity: { delay: 0.5, duration: 0.8 } }}
                  className="absolute -bottom-6 -right-4 w-40 p-4 flex flex-col items-center text-center"
                  style={{
                    background: colors.surfaceDarkElevated,
                    borderRadius: '8px', 
                    border: `1px solid ${colors.hairlineDark}`,
                    color: colors.onDark,
                  }}
                >
                  <div className="w-8 h-8 flex items-center justify-center mb-2 bg-white/5 rounded-full border border-white/10">
                    <BellRing size={14} className="text-[#0070d1]" />
                  </div>
                  <span className="font-sans text-[8px] tracking-wider font-bold uppercase text-[#0070d1]">Alert Sent</span>
                  <h5 className="text-[11px] font-medium mt-0.5 leading-tight">Owner reached</h5>
                  <button onClick={() => onSimulateScan('QR-8A3F')}
                    className="mt-3 w-full py-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer border border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full"
                  >
                    Simulate Scan
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ── How It Works (Light Canvas Chapter) ── */}
      <section id="how-it-works" className="relative z-10 py-24 border-b border-[#f3f3f3]" style={{ background: colors.canvasLight }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-16">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#0070d1] block mb-2">User Journey</span>
          <h2 className="ps-display-lg text-black uppercase">
            3 Seconds. <span className="text-[#0070d1]">3 Steps.</span>
          </h2>
          <p className="font-sans text-[14px] mt-3 max-w-lg mx-auto text-black/60">
            Secure and anonymous vehicle communication.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-8 bg-[#f5f7fa] border border-[#f3f3f3] rounded-md flex flex-col justify-between h-full transition-colors hover:border-[#0070d1]/30 hover:bg-[#f5f7fa]/80"
                >
                  <div className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-light text-2xl text-[#0070d1] block">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-md bg-white border border-[#f3f3f3] flex items-center justify-center shadow-xs">
                        <Icon size={20} className="text-[#0070d1]" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-serif font-light text-lg uppercase tracking-tight text-black">
                        {step.title}
                      </h3>
                      <p className="font-sans text-xs leading-relaxed text-black/60">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passerby info ribbon */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 pt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-5 rounded-md" style={{
            background: colors.surfaceCard,
            border: `1px solid ${colors.hairlineLight}`,
          }}>
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-black/50">Who scans it?</span>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
              {[
                { icon: Ambulance, label: 'First Responders' },
                { icon: GripHorizontal, label: 'Parking Authorities' },
                { icon: Phone, label: 'Bystanders' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {React.createElement(item.icon, { size: 12, className: "text-[#0070d1]" })}
                  <span className="font-sans text-xs font-medium text-black/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features (PlayStation Showcase Chapter) ── */}
      <section id="key-features" className="relative z-10 py-24" style={{ background: colors.canvasLight }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-16">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#0070d1] block mb-2">Technical Capabilities</span>
          <h2 className="ps-display-lg text-black uppercase">
            Console-Grade Security
          </h2>
          <p className="font-sans text-[14px] mt-3 max-w-lg mx-auto text-black/60">
            Built for vehicle protection and data encryption.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldAlert, title: 'Instant Alert Dispatch', desc: 'Emergency warnings and callback notifications bypass phone number checks and route instantly.' },
              { icon: Lock, title: 'Encrypted Registry', desc: 'Secure encryption guards your profile credentials and plate numbers from databases.' },
              { icon: Zap, title: 'High Density Printouts', desc: 'High-contrast tag renders print smoothly on typical printers for quick scan reads.' },
              { icon: Globe, title: 'Universal Scan Routing', desc: 'Works across standard mobile browsers with zero applications or registration required for bystanders.' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-6 bg-white border border-[#f3f3f3] rounded-md text-left flex flex-col justify-between hover:border-[#0070d1]/20">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-md bg-[#0070d1]/10 flex items-center justify-center">
                      <Icon size={18} className="text-[#0070d1]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-serif font-light text-sm uppercase tracking-wider text-black">{feature.title}</h4>
                      <p className="font-sans text-xs leading-normal text-black/60">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing (PlayStation Plus-Inspired Tier Section) ── */}
      <section id="pricing" className="py-24" style={{ background: colors.surfaceSoft }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#0070d1] block mb-2">Flexible Tiers</span>
            <h2 className="ps-display-lg text-black uppercase">Choose Your Tier</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            {/* Free Tier Card */}
            <div className="p-8 flex flex-col justify-between" style={{
              background: colors.canvasLight,
              borderRadius: '8px',
              border: `1px solid ${colors.hairlineLight}`,
            }}>
              <div>
                <h3 className="font-serif font-light text-xl uppercase tracking-tight text-black">NamoQR Basic</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-serif font-light tracking-tight text-black">$0</span>
                </div>
                <ul className="mt-8 space-y-4 text-xs border-t pt-6 text-black/70 font-sans text-left">
                  {['1 Active Vehicle', '1 Windshield QR Code', 'Standard Email Alerts', 'Basic Protection Status'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 text-[#0070d1]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={onStart} className="clay-button-primary w-full mt-8 py-3 text-[12px] uppercase tracking-wider font-bold">
                Get Free Tag
              </button>
            </div>

            {/* Premium Tier Card */}
            <div className="p-8 flex flex-col justify-between relative overflow-hidden" style={{
              background: colors.surfaceDarkElevated,
              borderRadius: '8px',
              border: `1px solid ${colors.hairlineDark}`,
              color: colors.onDark,
            }}>
              {/* PlayStation Plus Gold Gradient accent strip on top */}
              <div className="absolute top-0 inset-x-0 h-1" style={{
                background: `linear-gradient(90deg, ${colors.goldStart} 0%, ${colors.goldEnd} 100%)`
              }} />
              
              <div>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="font-serif font-light text-xl uppercase tracking-tight text-white">NamoQR Pro</h3>
                  <span className="px-2 py-0.5 font-sans text-[9px] font-bold uppercase rounded-full tracking-wider text-black"
                    style={{ background: `linear-gradient(90deg, ${colors.goldStart} 0%, ${colors.goldEnd} 100%)` }}>
                    PRO
                  </span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-serif font-light tracking-tight text-white">$5</span>
                  <span className="text-xs font-normal ml-1 text-white/50">/ month</span>
                </div>
                <ul className="mt-8 space-y-4 text-xs border-t pt-6 text-white/70 font-sans text-left" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {['Unlimited Vehicles', 'Unlimited QR Tag Generation', 'SMS + Email Instant Routing', 'Priority Emergency Dispatch', 'Custom Sticker Styles'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 text-amber-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={onStart} className="clay-btn-green w-full mt-8 py-3 text-[12px] uppercase tracking-wider font-bold" style={{ background: colors.commerce }}>
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA (Blue Band full bleed chapter) ── */}
      <section className="py-24 text-center text-white relative z-10" style={{ background: colors.primary }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl mx-auto">
            <h2 className="ps-display-md text-white uppercase">Be Ready When They Scan</h2>
            <p className="font-sans text-sm mt-3 text-white/80 leading-relaxed">
              Parking lockouts, flat tires, or vehicle hazards. Ensure emergency responders or bystanders can reach you instantly without ever sharing your phone number.
            </p>
            <button onClick={onStart}
              className="clay-btn-white mt-8 px-8 py-3.5 text-xs text-black bg-white border-none rounded-full flex items-center justify-center gap-2 mx-auto font-bold tracking-wider"
            >
              Create Your Tag <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center text-white relative z-10 border-t" style={{ background: colors.canvasDark, borderColor: colors.hairlineDark }}>
        <p className="font-serif font-light text-lg uppercase tracking-tight">
          NAMO<span className="font-bold text-[#0070d1]">QR</span>
        </p>
        <p className="font-sans text-[10px] mt-3 font-bold uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} NAMOQR &bull; ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
