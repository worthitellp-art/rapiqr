import React from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Car, 
  Menu, 
  X, 
  BellRing, 
  Phone, 
  Ambulance, 
  GripHorizontal, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Lock, 
  Bike, 
  Home, 
  Luggage, 
  Key, 
  Backpack, 
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import TiltCard from './ui/TiltCard';
import MagneticBtn from './ui/MagneticBtn';

const colors = {
  primary: '#f97316', // Orange
  primaryPressed: '#ea580c',
  commerce: '#ea580c', 
  canvasDark: '#050508',
  canvasLight: '#0b0b0f',
  surfaceDarkElevated: '#121216',
  surfaceDarkCard: '#18181b',
  surfaceCard: '#111111',
  surfaceSoft: '#07070a',
  ink: '#ffffff',
  bodyLight: 'rgba(255,255,255,0.85)',
  bodyDark: 'rgba(255,255,255,0.85)',
  onDark: '#ffffff',
  hairlineLight: '#27272a',
  hairlineDark: 'rgba(255,255,255,0.08)',
  goldStart: '#f59e0b',
  goldEnd: '#d97706',
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
          style={{ borderColor: 'rgba(249,115,22,0.3)', width: 80, height: 80 }}
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
  
  const categories = [
    {
      icon: Car,
      title: 'NamoQR Car Sticker',
      tagline: 'Emergency Accident & Parking Shield',
      desc: 'Wrong parking notifications, vehicle blocking alerts, ownership transfer, emergency contact access, and automated AI crash assistance.',
      benefits: ['Register Multiple Cars', 'Accident Crash Assist', 'Scan History Timeline']
    },
    {
      icon: Bike,
      title: 'NamoQR Bike Sticker',
      tagline: 'Two-Wheeler Smart Shield',
      desc: 'Instant emergency identification, accident response notifications, theft alert reporting, and automated service reminders.',
      benefits: ['Insurance Expiry Alert', 'Service Logs', 'Speed Scan Recovery']
    },
    {
      icon: Home,
      title: 'NamoQR Home Gate Sticker',
      tagline: 'Resident Emergency Portal',
      desc: 'Bystanders and couriers alert you during leaks, fire hazards, package arrival, society updates, and medical emergencies.',
      benefits: ['Emergency Instructions', 'Availability Status', 'Family SOS Contacts']
    },
    {
      icon: Luggage,
      title: 'NamoQR Luggage Sticker',
      tagline: 'Lost & Found Travel Companion',
      desc: 'Recovery support, traveler check-ins, airport loss assistance, and secure, anonymous text routing with scan location history.',
      benefits: ['Travel Mode Toggle', 'Location Logs', 'International Support']
    },
    {
      icon: Key,
      title: 'NamoQR Keychain',
      tagline: 'SOS Medical & Key Finder',
      desc: 'Instant health profile access including blood group, chronic conditions, allergy notes, live location tracking, and key recovery details.',
      benefits: ['Blood Group Stamp', 'Live Location Share', 'Lost Key Alerts']
    },
    {
      icon: Backpack,
      title: 'Child Bag Bag Sticker & Keychain',
      tagline: 'School Outing Safety Shield',
      desc: 'Secure pickup verification code, bus tracking alerts, parent emergency calls, school registration logs, and safe location notifications.',
      benefits: ['Safe Location Alerts', 'Pickup Verification', 'Bus Route Logs']
    }
  ];

  const steps = [
    { num: '01', icon: QrCode, title: 'Register & Link Tag', desc: 'Scan the NamoQR sticker or keychain, verify authenticity, choose your product category, and enter safety settings.' },
    { num: '02', icon: ShieldCheck, title: 'Apply the Safety Tag', desc: 'Place the durable, weatherproof sticker on your car windshield, bike, home gate, luggage, school bag, or keychain.' },
    { num: '03', icon: BellRing, title: 'Connect Anonymously', desc: 'When scanned in emergencies, finders alert you instantly. All text and location routing is encrypted. Your contact info stays private.' },
  ];

  return (
    <div className="font-sans min-h-screen relative overflow-hidden bg-[#050508] text-[#ffffff]">
      
      {/* ── PlayStation Primary Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full px-5 sm:px-8 border-b" style={{
        background: colors.canvasDark,
        borderColor: colors.hairlineDark
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5 font-serif font-light text-lg tracking-tight shrink-0 select-none text-white">
            <QrCode size={20} className="text-[#f97316]" />
            <span className="tracking-wide font-sans font-bold">NAMO<span className="text-[#f97316]">QR</span></span>
          </div>

          <div className="hidden sm:flex items-center gap-8 h-full">
            {['Ecosystem', 'How It Works', 'Key Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="font-sans text-[11px] font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white relative h-full flex items-center after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#f97316] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
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
            {['Ecosystem', 'How It Works', 'Key Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMenuOpen(false)}
                className="font-sans text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-md transition-all text-white/80 hover:bg-[#111111]/10"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* ── Hero Section ── */}
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
                Unified Safety QR Ecosystem
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="ps-display-xl text-white leading-[1.1] text-left uppercase font-bold"
              >
                Physical products.<br />digital protection.<br />
                <span className="font-light text-[#f97316]">Connected safety.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-sans text-[16px] leading-relaxed max-w-lg mx-auto lg:mx-0 text-left"
                style={{ color: colors.bodyDark }}
              >
                One digital platform linking cars, bikes, gates, keys, luggage, and kids. Protect your family, verify pick-ups, recovery, and alerts securely with fully encrypted anonymous message routing.
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
                  Activate Your First Tag <ArrowRight size={15} />
                </button>
                <a href="#ecosystem"
                  className="clay-btn-white w-full sm:w-auto px-8 py-3.5 text-xs flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-[#111111]/10 font-bold tracking-wider"
                >
                  Explore Products
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
                  { value: '50K+', label: 'Connected Assets' },
                  { value: '12K', label: 'Safety Reports' },
                  { value: '99.9%', label: 'Uptime Shield' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-4 sm:gap-6">
                    <div className="text-left">
                      <span className="font-serif font-light text-2xl tracking-tight text-white">{stat.value}</span>
                      <span className="font-sans text-[9px] font-bold block mt-0.5 uppercase tracking-wider text-white/50">{stat.label}</span>
                    </div>
                    {i < 2 && <div className="w-px h-8 bg-[#111111]/10" />}
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
                  borderRadius: '8px',
                }}>
                  <div className="absolute top-4 left-4 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-wider" style={{
                    background: colors.primary, color: colors.onDark, borderRadius: '9999px',
                  }}>
                    Ecosystem Live
                  </div>
                  
                  {/* QR Core Render */}
                  <div className="w-36 h-36 mt-10 p-3 flex items-center justify-center relative overflow-hidden bg-[#111111] rounded-md border border-[#27272a]">
                    
                    {/* Scanner Corner Brackets */}
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#f97316] rounded-tl-xs" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#f97316] rounded-tr-xs" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#f97316] rounded-bl-xs" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#f97316] rounded-br-xs" />
                    
                    {/* QR Code */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/scan/QR-8A3F')}`} alt="Emergency QR Tag" className="w-[85%] h-[85%] object-contain opacity-90" />
                    
                    {/* Glowing Laser Scan Line */}
                    <motion.div 
                      className="absolute inset-x-2 h-[2px]" 
                      style={{ 
                        background: 'linear-gradient(90deg, transparent, #f97316 20%, #53b1ff 50%, #f97316 80%, transparent)',
                        boxShadow: '0 0 10px #f97316, 0 0 20px #53b1ff'
                      }}
                      animate={{ top: ['8%', '88%', '8%'] }} 
                      transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }} 
                      className="absolute inset-x-2 h-[2px]"
                    />
                  </div>
                  
                  <div className="mt-5 text-center">
                    <span className="font-serif font-light text-sm uppercase tracking-tight block text-white">Car Sticker: Tesla</span>
                    <span className="font-sans text-[10px] block mt-1 text-white/50 uppercase tracking-wider">ID: QR-8A3F</span>
                  </div>
                  
                  <div className="mt-5 w-full flex items-center justify-center gap-5 pt-4 border-t" style={{ borderColor: colors.hairlineDark }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-white/50">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={11} className="text-[#f97316]" />
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-white/50">Secure</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Notification Toast */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: [0, -6, 0], opacity: 1 }}
                  transition={{ y: { repeat: Infinity, duration: 5, ease: "easeInOut" }, opacity: { delay: 0.5, duration: 0.8 } }}
                  className="absolute -bottom-6 -right-4 w-44 p-4 flex flex-col items-center text-center"
                  style={{
                    background: colors.surfaceDarkElevated,
                    borderRadius: '8px', 
                    border: `1px solid ${colors.hairlineDark}`,
                    color: colors.onDark,
                  }}
                >
                  <div className="w-8 h-8 flex items-center justify-center mb-2 bg-[#111111] rounded-full border border-white/10">
                    <Backpack size={14} className="text-[#f97316]" />
                  </div>
                  <span className="font-sans text-[8px] tracking-wider font-bold uppercase text-[#f97316]">Aarav (Son)</span>
                  <h5 className="text-[11px] font-medium mt-0.5 leading-tight">School Bus Arrival</h5>
                  <button onClick={() => onSimulateScan('QR-7C3Y')}
                    className="mt-3 w-full py-1.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer border border-white/20 bg-[#111111] text-white hover:bg-slate-900 rounded-full"
                  >
                    Simulate Scan
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Ecosystem Product Grid ── */}
      <section id="ecosystem" className="relative z-10 py-24 border-b border-[#27272a]" style={{ background: colors.canvasLight }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-16">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#f97316] block mb-2">Connected Products</span>
          <h2 className="ps-display-lg text-white uppercase font-bold">
            The NamoQR <span className="text-[#f97316]">Safety Suite</span>
          </h2>
          <p className="font-sans text-[14px] mt-3 max-w-lg mx-auto text-white/60">
            A range of custom tags to keep all aspects of your life safe and reachable.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 bg-[#121216] border border-[#27272a] rounded-lg text-left flex flex-col justify-between hover:border-[#f97316]/50 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-[#f97316] group-hover:scale-110 transition-transform duration-300">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-base text-white uppercase tracking-tight">{cat.title}</h4>
                      <span className="text-[10px] text-[#f97316] font-semibold uppercase tracking-wider block mt-0.5">{cat.tagline}</span>
                    </div>
                    <p className="font-sans text-xs text-white/60 leading-relaxed">{cat.desc}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                    {cat.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-[10px] text-white/70 font-semibold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 py-24 border-b border-[#27272a]" style={{ background: colors.canvasDark }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-16">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#f97316] block mb-2">Platform Flow</span>
          <h2 className="ps-display-lg text-white uppercase font-bold">
            How it works
          </h2>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-8 bg-[#121216] border border-[#27272a] rounded-lg flex flex-col justify-between h-full hover:border-[#f97316]/30 transition-all duration-300"
                >
                  <div className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-bold text-2xl text-[#f97316] block">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-md bg-black border border-[#27272a] flex items-center justify-center">
                        <Icon size={20} className="text-[#f97316]" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white">
                        {step.title}
                      </h3>
                      <p className="font-sans text-xs leading-relaxed text-white/60">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section id="key-features" className="relative z-10 py-24" style={{ background: colors.canvasLight }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-16">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#f97316] block mb-2">Technical Capabilities</span>
          <h2 className="ps-display-lg text-white uppercase font-bold">
            Enterprise Security
          </h2>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldAlert, title: 'Instant Alert Dispatch', desc: 'Emergency warnings and callback notifications route instantly via SMS, Email, and Push Notifications.' },
              { icon: Lock, title: 'Encrypted Directory', desc: 'Secure database architecture locks your personal contacts, plate numbers, and profiles away from public queries.' },
              { icon: Zap, title: 'High Density Printouts', desc: 'High-contrast tag generation templates optimized for scanning distance, print sharpness, and device angles.' },
              { icon: Globe, title: 'Zero App Scanning', desc: 'Works across standard iOS & Android mobile browsers. Bystanders need zero apps to report safety concerns.' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-6 bg-[#121216] border border-[#27272a] rounded-lg text-left flex flex-col justify-between hover:border-[#f97316]/30 transition-all duration-300">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-md bg-[#f97316]/10 flex items-center justify-center">
                      <Icon size={18} className="text-[#f97316]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">{feature.title}</h4>
                      <p className="font-sans text-xs leading-relaxed text-white/60">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Future Products ── */}
      <section id="expansion" className="py-24 border-t border-[#27272a]" style={{ background: colors.canvasDark }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#f97316] block mb-2">Expansion</span>
            <h2 className="ps-display-lg text-white uppercase font-bold">Future Modules</h2>
            <p className="text-xs text-white/60 mt-2">NamoQR is designed to expand organically. Future modular hardware includes:</p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {[
              'Pet Tag', 'Wallet Card', 'Employee ID Badge', 'Senior Citizen Band', 
              'Smart Helmet Tag', 'Bicycle Sticker', 'Office Door Sticker', 
              'Apartment Sticker', 'Smart NFC Safety Card', 'Travel Tag', 'Emergency Wristband'
            ].map((tag) => (
              <span 
                key={tag}
                className="px-4 py-2 bg-[#121216] border border-[#27272a] text-xs font-semibold text-white/80 rounded-full flex items-center gap-1.5 uppercase tracking-wider hover:border-[#f97316]/40 hover:text-white transition-all cursor-default"
              >
                <Sparkles size={11} className="text-[#f97316]" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 border-t border-[#27272a]" style={{ background: colors.surfaceSoft }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#f97316] block mb-2">Subscription Plans</span>
            <h2 className="ps-display-lg text-white uppercase font-bold">Choose Your Tier</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            {/* Free Tier Card */}
            <div className="p-8 flex flex-col justify-between" style={{
              background: colors.canvasLight,
              borderRadius: '8px',
              border: `1px solid ${colors.hairlineLight}`,
            }}>
              <div>
                <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-white">NamoQR Free</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-serif font-light tracking-tight text-white">$0</span>
                </div>
                <ul className="mt-8 space-y-4 text-xs border-t pt-6 text-white/70 font-sans text-left" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {['1 Active Tag', 'Standard Email Alerts', 'Emergency Contact Access', 'Basic Dashboard'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 text-[#f97316]" />
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
                  <h3 className="font-sans font-bold text-lg uppercase tracking-tight text-white">NamoQR Pro</h3>
                  <span className="px-2 py-0.5 font-sans text-[9px] font-bold uppercase rounded-full tracking-wider text-white"
                    style={{ background: `linear-gradient(90deg, ${colors.goldStart} 0%, ${colors.goldEnd} 100%)` }}>
                    PRO
                  </span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-serif font-light tracking-tight text-white">$5</span>
                  <span className="text-xs font-normal ml-1 text-white/50">/ month</span>
                </div>
                <ul className="mt-8 space-y-4 text-xs border-t pt-6 text-white/70 font-sans text-left" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {['Unlimited Active Tags', 'Ecosystem Multi-Product Support', 'Instant SMS + Push Alerts', 'Live Location SOS Sharing', 'Priority Recovery Support'].map((f) => (
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

      {/* ── CTA ── */}
      <section className="py-24 text-center text-white relative z-10" style={{ background: colors.primary }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl mx-auto">
            <h2 className="ps-display-md text-white font-bold uppercase">Be Ready When They Scan</h2>
            <p className="font-sans text-sm mt-3 text-white/80 leading-relaxed">
              Ensure emergency responders, neighbors, couriers, or finders can reach you instantly without ever sharing your phone number or exposing your personal contact list.
            </p>
            <button onClick={onStart}
              className="clay-btn-white mt-8 px-8 py-3.5 text-xs text-white bg-[#111111] border-none rounded-full flex items-center justify-center gap-2 mx-auto font-bold tracking-wider"
            >
              Get Your Security Code <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center text-white relative z-10 border-t" style={{ background: colors.canvasDark, borderColor: colors.hairlineDark }}>
        <p className="font-sans font-bold text-lg uppercase tracking-tight">
          NAMO<span className="text-[#f97316]">QR</span>
        </p>
        <p className="font-sans text-[10px] mt-3 font-bold uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} NAMOQR &bull; ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
