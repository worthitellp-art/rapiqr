import React from 'react';
import { ShieldCheck, Zap, Lock, ShieldAlert, Star, CheckCircle2 } from 'lucide-react';
import authHeroImage from '../../assets/illustrations/auth-hero.jpg';

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
      className="relative hidden lg:flex flex-col justify-between w-full h-full min-h-[600px] p-6 xl:p-8 overflow-hidden bg-[#0A0B0E] text-white select-none border-r border-zinc-800"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />

      {/* Top Header: Brand Symbol & Live Status Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black text-base flex items-center justify-center font-display shadow-md shadow-amber-500/20">
            R
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white font-display block leading-none">
              RapiQR Safety Network
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Vehicle Privacy Cloud</span>
          </div>
        </div>

        {/* Live Network Status Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold text-zinc-300">Live Network Active</span>
        </div>
      </div>

      {/* Center Showcase: Visual Asset with Floating Testimonial */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center">
        {/* Visual Illustration Card */}
        <div className="relative w-full max-w-[380px] rounded-2xl overflow-hidden border border-amber-500/20 bg-amber-500/5 shadow-2xl shadow-black/60">
          <img
            src={authHeroImage}
            alt="Smart Vehicle Safety QR system connected to vehicle"
            className="w-full h-44 xl:h-52 object-cover object-center select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-transparent to-transparent" />
        </div>

        {/* Floating Verified Client Testimonial Card */}
        <div className="w-full max-w-[380px] -mt-6 relative z-20 rounded-xl bg-zinc-900/95 border border-zinc-800 p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[...Array(5)].map((_, starIndex) => (
                <Star key={starIndex} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <CheckCircle2 size={11} /> Verified Owner
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed italic">
            &ldquo;Someone blocked my car in a tight mall parking. Within 20 seconds of scanning the
            sticker, I got a WhatsApp alert. My phone number was never shared!&rdquo;
          </p>

          <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-zinc-800/80 text-[10px]">
            <span className="font-semibold text-white">Aditya Kulkarni</span>
            <span className="text-zinc-500">Bengaluru • MG ZS EV</span>
          </div>
        </div>

        {/* 2x2 Enterprise Feature Security Grid */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-[380px] mt-3">
          {SECURITY_PILL_LIST.map((pill) => {
            const IconComponent = pill.icon;
            return (
              <div
                key={pill.title}
                className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/70"
              >
                <div className="p-1 rounded-md bg-amber-400/10 text-amber-400 flex-shrink-0 mt-0.5">
                  <IconComponent size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-white leading-tight">{pill.title}</p>
                  <p className="text-[9px] text-zinc-400 leading-snug mt-0.5">{pill.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="relative z-10 pt-3 border-t border-zinc-800/80">
        <div className="grid grid-cols-3 gap-2 text-left">
          {TRUST_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="text-sm xl:text-base font-black text-amber-400 tracking-tight">
                {metric.value}
              </div>
              <div className="text-[10px] font-medium text-zinc-400">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

