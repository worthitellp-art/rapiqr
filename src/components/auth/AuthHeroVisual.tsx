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
    title: '0.4s WhatsApp Alert',
    subtitle: 'Instant direct-to-phone notification',
  },
  {
    icon: ShieldAlert,
    title: 'Zero Spam Shield',
    subtitle: 'Automated bot & abuse protection',
  },
  {
    icon: Lock,
    title: '256-Bit SSL Encryption',
    subtitle: 'End-to-end secured communication',
  },
] as const;

export default function AuthHeroVisual() {
  return (
    <aside
      aria-label="RapiQR Platform Trust & Security Showcase"
      className="relative flex flex-col justify-between w-full h-full min-h-screen p-8 xl:p-12 overflow-hidden bg-[#0D0B07] text-white select-none border-r border-white/10"
    >
      {/* Background ambient lighting & subtle micro-grid */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-[#C9A227]/15 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 w-80 h-80 bg-[#D97706]/10 rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-96 h-96 bg-[#C9A227]/10 rounded-full blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* ── Top Header: Brand Wordmark & Live Telemetry Indicator ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo variant="dark" className="h-8 w-auto object-contain" />
          <span className="hidden xl:inline-block text-[10px] uppercase tracking-wider font-semibold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded-full border border-[#C9A227]/20">
            Safety Cloud
          </span>
        </div>

        {/* Live Network Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-white/80">Live Network Active</span>
          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">• 0.4s</span>
        </div>
      </div>

      {/* ── Center Showcase: Vehicle Safety & Privacy Simulation ── */}
      <div className="relative z-10 my-auto py-6 max-w-[440px] mx-auto w-full flex flex-col gap-4">
        {/* Main Simulation Card */}
        <div className="rounded-2xl border border-white/10 bg-[#16130D]/90 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top gold highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />

          {/* Vehicle & Tag Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                <Car size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white tracking-tight">MG ZS EV • Smart Tag</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                    PROTECTED
                  </span>
                </div>
                <p className="text-[10px] font-mono text-white/50">TAG ID: RQ-7829-IND</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#C9A227] font-semibold">256-Bit Masked</span>
            </div>
          </div>

          {/* Simulated Real-Time Scan Event Toast */}
          <div className="mt-3.5 space-y-2.5">
            {/* Alert Event Notification */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">Parking Scan Alert</p>
                  <span className="text-[9px] text-white/40">Just now</span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
                  Someone scanned your windshield tag in Parking Bay B-14.
                </p>
              </div>
            </div>

            {/* Simulated Encrypted Masked Call / WhatsApp Connect */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/25 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PhoneCall size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-emerald-300">Masked Audio Relay</p>
                  <p className="text-[9px] font-mono text-emerald-400/70">+91 9••••••812 (Private)</p>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Floating Verified Client Testimonial Card */}
        <div className="rounded-xl bg-[#19160F]/95 border border-white/10 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-[#C9A227]">
              {[...Array(5)].map((_, starIndex) => (
                <Star key={starIndex} size={11} className="fill-[#C9A227] text-[#C9A227]" />
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <CheckCircle2 size={11} /> Verified Owner
            </span>
          </div>

          <p className="text-[11px] text-white/80 leading-relaxed italic">
            &ldquo;Someone blocked my car in a tight mall parking. Within 20 seconds of scanning the
            sticker, I got a WhatsApp alert. My phone number was never shared!&rdquo;
          </p>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
            <span className="font-semibold text-white">Aditya Kulkarni</span>
            <span className="text-white/40 font-medium">Bengaluru • MG ZS EV</span>
          </div>
        </div>

        {/* 2x2 Enterprise Feature Security Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {SECURITY_PILL_LIST.map((pill) => {
            const IconComponent = pill.icon;
            return (
              <div
                key={pill.title}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-[#C9A227]/15 text-[#C9A227] flex-shrink-0 mt-0.5">
                  <IconComponent size={14} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">{pill.title}</p>
                  <p className="text-[10px] text-white/50 leading-tight mt-0.5">{pill.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Metrics Bar ── */}
      <div className="relative z-10 pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-left">
          {TRUST_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="text-base xl:text-lg font-extrabold text-white tracking-tight">
                {metric.value}
              </div>
              <div className="text-[11px] font-medium text-white/40 leading-snug">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
