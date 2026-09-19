import React from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  ShieldAlert,
  Star,
  CheckCircle2,
  PhoneCall,
  Car,
  Bell,
  Sparkles,
  QrCode,
} from 'lucide-react';
import AppLogo from '../common/AppLogo';

const TRUST_METRICS = [
  { label: 'Protected Vehicles', value: '10,000+' },
  { label: 'Customer Rating', value: '4.9 / 5.0' },
  { label: 'Phone Leaks', value: 'Zero (100% Private)' },
] as const;

const SECURITY_PILL_LIST = [
  {
    icon: ShieldCheck,
    title: '100% Number Masking',
    subtitle: 'Callers never see your phone number',
  },
  {
    icon: Zap,
    title: '0.4s Instant Alert',
    subtitle: 'WhatsApp & SMS relay in under 1s',
  },
  {
    icon: ShieldAlert,
    title: 'Zero Spam Shield',
    subtitle: 'Automated bot & abuse prevention',
  },
  {
    icon: Lock,
    title: '256-Bit SSL Encryption',
    subtitle: 'End-to-end secured proxy channels',
  },
] as const;

export default function AuthHeroVisual() {
  return (
    <aside
      aria-label="RepiQR Platform Trust & Security Showcase"
      className="relative flex flex-col justify-between w-full h-full min-h-screen p-8 xl:p-12 overflow-hidden bg-[#0D0B07] text-white select-none border-r border-white/10"
    >
      {/* Background ambient lighting & subtle micro-grid */}
      <div className="pointer-events-none absolute -top-28 -left-28 w-96 h-96 bg-[#FFCB56]/15 rounded-full blur-[110px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 w-80 h-80 bg-[#C9A227]/12 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-96 h-96 bg-[#FFCB56]/10 rounded-full blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Top Header: Brand Wordmark & Live Telemetry Indicator ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo variant="dark" className="h-8 w-auto object-contain" />
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-[#FFCB56] bg-[#FFCB56]/10 px-2.5 py-1 rounded-full border border-[#FFCB56]/20">
            <Sparkles size={11} className="text-[#FFCB56]" />
            Privacy Cloud
          </span>
        </div>

        {/* Live Network Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-white/90">Safety Engine Active</span>
          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">• 0.4s</span>
        </div>
      </div>

      {/* ── Center Showcase: Physical Tag + Privacy Simulation ── */}
      <div className="relative z-10 my-auto py-6 max-w-[460px] mx-auto w-full flex flex-col gap-4">
        {/* Main Simulation Card */}
        <div className="rounded-3xl border border-white/12 bg-[#16130D]/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top gold highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFCB56]/60 to-transparent" />

          {/* Vehicle & Tag Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFCB56]/15 border border-[#FFCB56]/30 flex items-center justify-center text-[#FFCB56] shadow-inner">
                <Car size={19} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">MG ZS EV • Windshield Tag</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                    PROTECTED
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/50 mt-0.5">TAG ID: RQ-9082-IND • ACTIVE</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-[#FFCB56] bg-[#FFCB56]/10 px-2 py-1 rounded-full border border-[#FFCB56]/20">
                256-Bit Masked
              </span>
            </div>
          </div>

          {/* Simulated Real-Time Scan Event Toast */}
          <div className="mt-4 space-y-3">
            {/* Alert Event Notification */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 flex items-start gap-3 hover:bg-white/[0.06] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">Parking Scan Alert</p>
                  <span className="text-[10px] text-white/40">Just now</span>
                </div>
                <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
                  Windshield sticker scanned in Parking Bay B-14. Proxy relay initialized.
                </p>
              </div>
            </div>

            {/* Simulated Encrypted Masked Call / WhatsApp Connect */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300">Encrypted Audio Relay</p>
                  <p className="text-[10px] font-mono text-emerald-400/80 mt-0.5">+91 9••••••812 (Hidden & Private)</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Verified Client Testimonial Card */}
        <div className="rounded-2xl bg-[#19160F]/95 border border-white/10 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-[#FFCB56]">
              {[...Array(5)].map((_, starIndex) => (
                <Star key={starIndex} size={12} className="fill-[#FFCB56] text-[#FFCB56]" />
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={11} /> Verified Car Owner
            </span>
          </div>

          <p className="text-[12px] text-white/80 leading-relaxed italic">
            &ldquo;Someone blocked my car in a tight mall parking. Within 20 seconds of scanning the
            sticker, I got a WhatsApp alert. My phone number was never exposed!&rdquo;
          </p>

          <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px]">
            <span className="font-bold text-white">Aditya Kulkarni</span>
            <span className="text-white/40 font-medium">Bengaluru • MG ZS EV</span>
          </div>
        </div>

        {/* 2x2 Enterprise Feature Security Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {SECURITY_PILL_LIST.map((pill) => {
            const IconComponent = pill.icon;
            return (
              <div
                key={pill.title}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <div className="p-2 rounded-xl bg-[#FFCB56]/15 text-[#FFCB56] flex-shrink-0 mt-0.5">
                  <IconComponent size={15} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">{pill.title}</p>
                  <p className="text-[10px] text-white/50 leading-tight mt-1">{pill.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Metrics Bar ── */}
      <div className="relative z-10 pt-5 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-left">
          {TRUST_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="text-base xl:text-lg font-black text-white tracking-tight">
                {metric.value}
              </div>
              <div className="text-[11px] font-medium text-white/40 leading-snug mt-0.5">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
