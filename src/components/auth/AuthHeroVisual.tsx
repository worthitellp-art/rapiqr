import React from 'react';
import { ShieldCheck } from 'lucide-react';
import authHeroImage from '../../assets/illustrations/auth-hero.jpg';

export default function AuthHeroVisual() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-full h-full min-h-[640px] p-8 xl:p-12 overflow-hidden bg-[#FFC700] select-none border-r border-amber-300/40">
      {/* Top Brand & Badge matching sccanpagedesign.png */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white font-black text-base flex items-center justify-center font-display shadow-sm">
            R
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-950 font-display">
            RapiQR Safety Protection
          </span>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/10 text-slate-950 text-xs font-bold">
          #1 Safety Network
        </span>
      </div>

      {/* Full Modern Vector Illustration (No Box / No Cards) */}
      <div className="relative z-10 my-auto flex items-center justify-center w-full py-4">
        <img
          src={authHeroImage}
          alt="Smart Vehicle Safety QR"
          className="w-full max-h-[520px] object-contain select-none"
        />
      </div>

      {/* Exactly 1 to 2 Text Lines + Security Assurance */}
      <div className="relative z-10 max-w-md space-y-1.5">
        <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-slate-950 font-display">
          Smart Vehicle Safety QR
        </h2>
        <p className="text-slate-900/80 text-sm xl:text-base font-medium leading-relaxed">
          Instant emergency alerts and anonymous driver contact.
        </p>

        <div className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-950">
          <ShieldCheck size={16} className="text-slate-950" />
          <span>Secured by RapiQR Safety Protection</span>
        </div>
      </div>
    </div>
  );
}
