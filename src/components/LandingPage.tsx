/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { QrCode, ShieldCheck, Mail, Smartphone, ArrowRight, UserCheck, AlertTriangle, MessageSquare, Car, Sparkles, Navigation } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onSimulateScan: (qrId: string) => void;
}

export default function LandingPage({ onStart, onLogin, onSimulateScan }: LandingPageProps) {
  // Stagger animation helpers
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div id="landing-container" className="bg-[#f0f4f8] text-slate-800 font-sans min-h-screen selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Dynamic Nav-Rail */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/45 bg-white/40 backdrop-blur-xl px-6 sm:px-12 h-16 flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-3 items-center">
          {/* Left side: secure status indicator */}
          <div className="flex items-center justify-start select-none">
           
          </div>

          {/* Center: About, QR Logo, Services */}
          <div className="flex items-center justify-center gap-8">
            <a href="#how-namoqr-works" className="hidden sm:inline-block text-slate-605 hover:text-indigo-600 font-bold text-sm transition-all">About</a>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-2xl tracking-tighter drop-shadow-xs shrink-0 select-none">
              <QrCode size={22} className="text-indigo-650 shrink-0" />
              <span>NAMO<span className="font-medium text-slate-700">QR</span></span>
            </div>
            <a href="#interactive-demo-hub" className="hidden sm:inline-block text-slate-655 hover:text-indigo-600 font-bold text-sm transition-all">Services</a>
          </div>

          {/* Right side: getstarted btn only */}
          <div className="flex items-center justify-end">
            <button
              id="nav-start-btn"
              onClick={onStart}
              className="px-5 py-2.5 clay-morph-indigo-btn text-sm cursor-pointer shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section — Claymorphism */}
      <header className="relative pt-20 pb-28 md:pt-28 md:pb-32 overflow-hidden z-10">
        {/* Puffy clay background spheres */}
        <div className="absolute top-10 -left-20 w-72 h-72 clay-ball-purple rounded-full opacity-70 animate-float-slow pointer-events-none" />
        <div className="absolute top-40 -right-16 w-56 h-56 clay-ball-blue rounded-full opacity-60 animate-float-reverse pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-40 h-40 clay-ball-pink rounded-full opacity-50 animate-float-slow pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-center lg:text-left">
            {/* Left side */}
            <div className="lg:col-span-7 space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-[#1C398E] leading-[1.1] tracking-tight uppercase"
                style={{ textShadow: '4px 4px 0 rgba(59,130,246,0.15), 8px 8px 0 rgba(59,130,246,0.05)' }}
              >
                Secure Your Car. <br />
                <span className="text-[#3B82F6]" style={{ fontWeight: 300, textShadow: '2px 2px 0 rgba(59,130,246,0.1)' }}>Contact Privately.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-sans text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
                style={{ color: '#1C398E' }}
              >
                Windshield QR tags let bystanders alert you about parking or emergencies instantly. No phone numbers shared, total privacy.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <button
                  id="hero-dashboard-btn"
                  onClick={onStart}
                  className="w-full sm:w-auto px-8 py-4 font-sans text-sm font-bold flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  style={{
                    background: '#3B82F6',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    boxShadow: 'inset 3px 3px 8px rgba(255,255,255,0.35), inset -3px -3px 8px rgba(0,0,0,0.15), 0 8px 20px rgba(59,130,246,0.3)',
                  }}
                >
                  Get Started Free <ArrowRight size={16} />
                </button>
                <a
                  href="#interactive-demo-hub"
                  className="w-full sm:w-auto px-8 py-4 font-sans text-sm font-bold flex items-center justify-center uppercase tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    color: '#1C398E',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: '16px',
                    boxShadow: 'inset 3px 3px 8px rgba(255,255,255,0.95), inset -3px -3px 8px rgba(59,130,246,0.08), 0 4px 12px rgba(59,130,246,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Try Scanned Demo
                </a>
              </motion.div>
            </div>

            {/* Right side: 3D Clay QR Card */}
            <div className="lg:col-span-5 flex justify-center pt-8 lg:pt-0">
              <motion.div 
                className="relative w-full max-w-xs md:max-w-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                {/* Puffy clay QR card */}
                <div
                  className="p-6 flex flex-col items-center relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: '24px',
                    boxShadow: 'inset 6px 6px 12px rgba(255,255,255,0.95), inset -6px -6px 12px rgba(59,130,246,0.08), 0 20px 40px -8px rgba(59,130,246,0.12)',
                  }}
                >
                  <div
                    className="absolute top-3 left-3 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: '#3B82F6',
                      color: '#fff',
                      borderRadius: '20px',
                      boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    Windshield Tag
                  </div>

                  {/* Clay QR frame */}
                  <div
                    className="w-28 h-28 mt-6 p-2 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: '#fff',
                      borderRadius: '20px',
                      boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.04), inset -4px -4px 8px rgba(255,255,255,0.8), 0 4px 12px rgba(59,130,246,0.06)',
                    }}
                  >
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
                  <div className="mt-4 text-center">
                    <span
                      className="font-display font-black text-xs uppercase tracking-tight block"
                      style={{ color: '#1C398E' }}
                    >
                      Tesla Model 3
                    </span>
                    <span className="font-mono text-[10px] font-bold block mt-0.5" style={{ color: '#1C398E', opacity: 0.6 }}>
                      Plate: P-ELECTRIC
                    </span>
                  </div>
                </div>

                {/* Floating clay notification pill */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: [0, -12, 0], opacity: 1 }}
                  transition={{ 
                    y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
                    opacity: { delay: 0.5, duration: 0.8 }
                  }}
                  className="absolute -bottom-8 -right-4 md:-right-8 w-44 p-4 flex flex-col items-center text-center"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.2), inset -4px -4px 10px rgba(0,0,0,0.15), 0 12px 28px -4px rgba(79,70,229,0.3)',
                    color: '#fff',
                  }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center mb-2"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      borderRadius: '50%',
                      border: '1px solid rgba(16,185,129,0.3)',
                      boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <QrCode size={16} className="animate-pulse" style={{ color: '#34d399' }} />
                  </div>
                  <span className="font-mono text-[10px] tracking-widest font-bold uppercase" style={{ color: '#a5b4fc' }}>Scan Detected</span>
                  <h5 className="text-[11px] font-bold text-white mt-1 leading-tight">Instant Notification</h5>
                  <p className="text-[10px] mt-1 max-w-[120px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Passerby can now contact the driver securely.
                  </p>
                  <button 
                    onClick={() => onSimulateScan('QR-8A3F')}
                    className="mt-3 w-full py-1.5 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all"
                    style={{
                      background: '#fff',
                      color: '#4f46e5',
                      borderRadius: '12px',
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

      {/* Interactive Bystander Scanner Sandbox cockpit */}
      <section id="interactive-demo-hub" className="py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="clay-morph-white p-8 sm:p-10 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-md">
                <span className="text-xs bg-indigo-600 text-white font-mono px-3 py-1 rounded-full font-black tracking-widest uppercase inline-block mb-3 shadow-xs">
                  Interactive Demo Area
                </span>
                <h3 className="font-display text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Simulate QR Scanner
                </h3>
                <p className="text-xs text-slate-650 mt-1.5 leading-relaxed font-medium">
                  Experience how it works for a passerby immediately without needing a smartphone scanner! Select a preset registered tag to view its action form, or write customizable mock scenarios.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <button
                  onClick={() => onSimulateScan('QR-8A3F')}
                  className="p-4 clay-morph-white border border-indigo-105 hover:border-indigo-300 text-center group transition-all text-slate-800 cursor-pointer flex flex-col items-center justify-center"
                >
                  <Car size={20} className="text-indigo-650 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-xs font-bold block text-slate-400">Tesla Model 3</span>
                  <span className="font-display text-xs font-black block text-indigo-700 group-hover:underline uppercase mt-0.5">Scan QR-8A3F</span>
                </button>
                <button
                  onClick={() => onSimulateScan('QR-9K2L')}
                  className="p-4 clay-morph-white border border-indigo-105 hover:border-indigo-300 text-center group transition-all text-slate-800 cursor-pointer flex flex-col items-center justify-center"
                >
                  <Car size={20} className="text-slate-850 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-xs font-bold block text-slate-400">BMW M4 Coupe</span>
                  <span className="font-display text-xs font-black block text-slate-900 group-hover:underline uppercase mt-0.5">Scan QR-9K2L</span>
                </button>
                <button
                  onClick={() => onSimulateScan('QR-5T7S')}
                  className="p-4 clay-morph-white border border-indigo-105 hover:border-indigo-300 text-center group transition-all text-slate-800 cursor-pointer flex flex-col items-center justify-center"
                >
                  <Car size={20} className="text-blue-650 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-xs font-bold block text-slate-400">Toyota RAV4</span>
                  <span className="font-display text-xs font-black block text-blue-700 group-hover:underline uppercase mt-0.5">Scan QR-5T7S</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-namoqr-works" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight uppercase">
              How NamoQR Works
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Four steps from registration to secure real-world protection. No complex setups needed.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          >
            {/* Step 1 */}
            <motion.div variants={itemVariants} className="clay-morph-white p-6 space-y-4 border border-white/80">
              <div className="w-12 h-12 clay-morph-indigo flex items-center justify-center font-display text-base font-black text-white shadow-md">
                01
              </div>
              <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-tight">Add Vehicle</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Add your vehicle details like make, color, model, and license plate into your secure personal dashboard.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={itemVariants} className="clay-morph-white p-6 space-y-4 border border-white/85">
              <div className="w-12 h-12 clay-morph-indigo flex items-center justify-center font-display text-base font-black text-white shadow-md">
                02
              </div>
              <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-tight">Generate QR</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Unlock or generate a heavy-duty customized QR code tag mapped directly to your specific vehicle ID.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={itemVariants} className="clay-morph-white p-6 space-y-4 border border-white/85">
              <div className="w-12 h-12 clay-morph-indigo flex items-center justify-center font-display text-base font-black text-white shadow-md">
                03
              </div>
              <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-tight">Stick Tag</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Print your dynamic window tag, or download it right to your lock screen. Ideal for dashboard placement.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={itemVariants} className="clay-morph-white p-6 space-y-4 border border-white/85">
              <div className="w-12 h-12 clay-morph-indigo flex items-center justify-center font-display text-base font-black text-white shadow-md">
                04
              </div>
              <h3 className="font-display font-black text-slate-900 text-lg uppercase tracking-tight">Get Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Bystanders scan to report blocking or hazards. We alert you instantly while preserving absolute contact privacy.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight uppercase">
              Transparent, simple pricing
            </h2>
            <p className="text-sm text-slate-550 mt-2 font-medium">
              Start protecting your vehicle for free, or upgrade anytime for full coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="clay-morph-white p-8 flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/80">
              <div>
                <span className="text-xs font-mono tracking-wider font-extrabold uppercase text-slate-400">
                  Basic Protection
                </span>
                <h3 className="font-display text-2xl font-black text-slate-900 mt-1.5 uppercase tracking-tight">Free Tier</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-950">$0</span>
                  <span className="text-slate-400 text-sm font-semibold ml-1">forever</span>
                </div>
                <p className="text-xs text-slate-550 leading-relaxed mt-4 font-medium">
                  Essential tools for individual owners who want a straightforward, privacy-focused security channel.
                </p>

                <ul className="mt-8 space-y-4 text-xs text-slate-650 border-t border-indigo-50/50 pt-6 font-semibold">
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-slate-400" size={16} />
                    <span>1 Registered Vehicle</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-slate-400" size={16} />
                    <span>1 Standard Printable QR Code</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-slate-400" size={16} />
                    <span>Real-time Email Alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-slate-400" size={16} />
                    <span>Location Tagging (Accuracy 15m)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="mt-8 w-full py-3.5 clay-morph-indigo-btn text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="clay-morph-indigo p-8 flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/20">
              <div className="absolute top-4 right-4 px-2.5 py-1 text-xs font-mono font-bold uppercase bg-white text-indigo-650 rounded-full tracking-wider shadow-xs">
                Recommended
              </div>

              <div>
                <span className="text-xs font-mono tracking-wider font-extrabold uppercase text-indigo-200">
                  Total Shield
                </span>
                <h3 className="font-display text-2xl font-black text-white mt-1.5 uppercase tracking-tight">Pro premium</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-display font-black tracking-tight text-white">$5</span>
                  <span className="text-indigo-200 text-sm font-semibold ml-1">/ month</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed mt-4 font-medium">
                  Advanced alert channels, SMS callbacks, priority notification support, and custom printable styles.
                </p>

                <ul className="mt-8 space-y-4 text-xs text-indigo-50 border-t border-indigo-450/30 pt-6 font-bold">
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-white" size={16} />
                    <span className="text-white">Unlimited Vehicles Registered</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-white" size={16} />
                    <span className="text-white">Unlimited QR Tag Codes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-white" size={16} />
                    <span className="text-white">Instant SMS Callback Alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="text-white animate-pulse" size={16} />
                    <span>Custom vector SVG download</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="mt-8 w-full py-3.5 clay-morph-white-btn text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Get Pro Shield Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section (Spacious card) */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="clay-morph-indigo p-10 sm:p-14 text-center relative overflow-hidden border border-white/20">
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tighter uppercase text-white">
                Secure your vehicle today
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-3 leading-relaxed font-semibold">
                No phone number disclosure, no complicated tracking, full integration. Join thousands of drivers avoiding municipal towing fees and disputes.
              </p>
              <button
                id="cta-enroll-btn"
                onClick={onStart}
                className="mt-8 px-8 py-4 clay-morph-white-btn text-xs tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                Access Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/20 backdrop-blur-md py-12 text-center text-slate-450 relative z-10">
        <p className="font-display font-black text-slate-900 uppercase tracking-tighter text-lg">NAMO<span className="text-slate-500 font-medium">QR</span></p>
        <p className="text-[11px] font-mono mt-2">&copy; {new Date().getFullYear()} NAMOQR, Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
