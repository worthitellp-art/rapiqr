/**
 * ScanShowcaseSection — a hero-style section pairing a bold two-line headline
 * and a soft lavender copy panel with a realistic phone mockup of the actual
 * scan result screen (see CategoryScanView), so the pitch ("one scan reaches
 * you, your number never shows") is demonstrated rather than just described.
 *
 * Visual language (background wash, rounded card-in-card layout, bold/italic
 * headline pairing, pill CTA + trust badges beside a tilted device mockup) is
 * adapted from a travel-app landing reference; copy and the phone's screen
 * content are RapiQR's own.
 *
 * Standalone and self-contained — not wired into any page yet. Drop it into
 * a section wrapper wherever the page composition calls for it.
 */
import type { ReactNode } from 'react';
import {
  Camera,
  ShieldCheck,
  ArrowUpRight,
  Signal,
  Wifi,
  BatteryFull,
  Car,
  Phone,
  Shield,
  Truck,
  Cross,
  CircleParking,
  Fuel,
  MessageCircle,
  Send,
  QrCode,
} from 'lucide-react';

export interface ScanShowcaseSectionProps {
  onTryDemo?: () => void;
  onOrderTag?: () => void;
}

const QUICK_ACTIONS: { label: string; icon: typeof Shield; tint: string; iconTint: string }[] = [
  { label: 'Police', icon: Shield, tint: 'bg-blue-50 border-blue-100', iconTint: 'text-blue-600' },
  { label: 'Towing', icon: Truck, tint: 'bg-amber-50 border-amber-100', iconTint: 'text-amber-700' },
  { label: 'Medical', icon: Cross, tint: 'bg-rose-50 border-rose-100', iconTint: 'text-rose-600' },
  { label: 'Parking', icon: CircleParking, tint: 'bg-violet-50 border-violet-100', iconTint: 'text-violet-600' },
  { label: 'Fuel Out', icon: Fuel, tint: 'bg-orange-50 border-orange-100', iconTint: 'text-orange-600' },
  { label: 'Chat', icon: MessageCircle, tint: 'bg-emerald-50 border-emerald-100', iconTint: 'text-emerald-600' },
];

/** A single realistic phone frame with a live status bar and home indicator. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px] rotate-[3deg] select-none">
      {/* Bezel */}
      <div className="rounded-[46px] bg-[#111111] p-[10px] shadow-[0_40px_80px_-30px_rgba(17,17,17,0.55)]">
        <div className="relative overflow-hidden rounded-[38px] bg-white">
          {/* Status bar */}
          <div className="relative flex items-center justify-between px-6 pt-3.5 pb-1 text-[11px] font-bold text-[#111111]">
            <span>9:41</span>
            <div className="absolute left-1/2 top-1.5 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#111111]" />
            <div className="flex items-center gap-1">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={12} strokeWidth={2.5} />
              <BatteryFull size={14} strokeWidth={2} />
            </div>
          </div>

          {/* Screen content */}
          <div className="max-h-[560px] overflow-hidden px-2.5 pb-5 pt-1.5">{children}</div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2 pt-1">
            <div className="h-1 w-28 rounded-full bg-[#111111]/80" />
          </div>
        </div>
      </div>
      {/* Side buttons */}
      <div className="absolute -left-[2px] top-24 h-6 w-[3px] rounded-l-full bg-[#111111]" />
      <div className="absolute -left-[2px] top-36 h-10 w-[3px] rounded-l-full bg-[#111111]" />
      <div className="absolute -left-[2px] top-48 h-10 w-[3px] rounded-l-full bg-[#111111]" />
      <div className="absolute -right-[2px] top-32 h-14 w-[3px] rounded-r-full bg-[#111111]" />
    </div>
  );
}

/** Static mock of the real scan-result screen (see CategoryScanView) — a car tag scan. */
export function ScanScreenMock() {
  return (
    <div className="space-y-2.5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#D91C1C] via-[#C01515] to-[#800C0C] p-3.5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <Car size={16} className="text-white" />
            </span>
            <h4 className="text-[15px] font-black leading-tight">Car Found</h4>
            <p className="mt-0.5 text-[10.5px] font-medium text-white/80">Protected by RapiQR</p>
            <span className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider">
              MH 12 AB 1234
            </span>
          </div>
        </div>

        <button
          type="button"
          className="relative z-10 mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-black text-[#C01515] shadow-md"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C01515]">
            <Phone size={12} className="fill-white text-white" />
          </span>
          <span className="text-[12.5px] font-black tracking-wide">CALL OWNER</span>
        </button>
      </div>

      {/* Quick actions */}
      <div className="rounded-[26px] border border-gray-100 bg-white p-3 shadow-sm">
        <p className="mb-2 text-[11px] font-bold text-gray-900">Quick Actions</p>
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_ACTIONS.map((tile) => (
            <div
              key={tile.label}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-center ${tile.tint}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80">
                <tile.icon size={14} className={tile.iconTint} />
              </span>
              <span className="text-[8.5px] font-bold leading-tight text-gray-900">{tile.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Message owner bar */}
      <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3.5 py-2.5">
        <MessageCircle size={13} className="flex-shrink-0 text-gray-400" />
        <span className="flex-1 truncate text-[10.5px] font-medium text-gray-400">Message the owner…</span>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9A1F] to-[#F0562A]">
          <Send size={11} className="text-white" />
        </span>
      </div>
    </div>
  );
}

/** The squiggle that trails behind the phone in both the white and lavender zones — one path, constant stroke. */
function BackgroundSquiggle({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      width="480"
      height="620"
      viewBox="0 0 480 620"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 120c120-60 220 10 180 90s-140 60-120 150 180 90 300 20"
        stroke="#111111"
        strokeOpacity="0.1"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ScanShowcaseSection({ onTryDemo, onOrderTag }: ScanShowcaseSectionProps) {
  return (
    <section className="bg-[#D9E3EA] px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[36px] border border-black/5 bg-[#F6F6F4] shadow-[0_1px_0_rgba(17,17,17,0.03)] sm:rounded-[44px]">
        {/* Nav row */}
        <div className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-12">
          <span className="flex items-center gap-2 font-display text-lg font-black tracking-tight text-[#111111]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] text-white">
              <QrCode size={15} />
            </span>
            RAPIQR
          </span>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#111111]/70 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#111111]">How It Works</a>
            <a href="#pricing" className="transition-colors hover:text-[#111111]">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-[#111111]">FAQ</a>
          </nav>

          <button
            type="button"
            onClick={onOrderTag}
            className="rounded-full border border-[#111111]/15 px-5 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-white"
          >
            Order Tag
          </button>
        </div>

        {/* Content zone: headline (white area) + full-width lavender band, with the phone overlapping both */}
        <div className="relative px-6 pb-6 sm:px-10 sm:pb-10 lg:px-12 lg:pb-12">
          <BackgroundSquiggle className="right-16 top-4 hidden opacity-60 lg:block" />

          <h2 className="font-display max-w-2xl text-[13vw] uppercase leading-[0.94] tracking-[-0.01em] text-[#111111] sm:text-[7vw] lg:text-[4.6rem]">
            <span className="block font-black">Every Scan</span>
            <span className="block italic">Reaches You</span>
          </h2>

          {/* Phone mockup: normal flow on mobile, overlapping the white/lavender boundary on desktop */}
          <div className="my-8 flex justify-center lg:absolute lg:right-10 lg:top-2 lg:my-0 xl:right-16">
            <PhoneFrame>
              <ScanScreenMock />
            </PhoneFrame>
          </div>

          <div className="relative overflow-hidden rounded-[28px] bg-[#E7E3F8] p-6 sm:p-8 lg:mt-10">
            <BackgroundSquiggle className="-left-10 -top-10 opacity-70" />
            <div className="relative max-w-md">
              <p className="font-body text-[15px] leading-relaxed text-[#211922]">
                Whoever finds your tag scans it with their own camera — no app, no login. They land on
                exactly this: a call button that rings you without ever sharing your number, quick
                actions for towing, police or medical, and a live location share for real emergencies.
              </p>

              <button
                type="button"
                onClick={onTryDemo}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFCB56] px-6 py-3 font-bold text-[#111111] transition-colors hover:bg-[#F0B93A]"
              >
                <span className="text-sm">Try The Scan Page</span>
                <ArrowUpRight size={16} />
              </button>

              <div className="mt-10 flex items-center gap-3">
                <div className="text-xs font-semibold leading-tight text-[#4B4763]">
                  No app needed —<br />works instantly
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#111111]/15 bg-white">
                  <Camera size={17} className="text-[#111111]" />
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#111111]/15 bg-white">
                  <ShieldCheck size={17} className="text-[#111111]" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
