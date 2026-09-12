import React from 'react';
import { User, ChevronRight } from 'lucide-react';
import goldCoinsIllustration from '../../../assets/illustrations/gold-coins-payment.jpg';

interface ScanPaymentSummaryPanelProps {
  price?: string;
  userPhone?: string;
}

export default function ScanPaymentSummaryPanel({
  price = '₹299',
  userPhone = '+91 95747 13004',
}: ScanPaymentSummaryPanelProps) {
  return (
    <div className="relative w-full lg:w-[35%] bg-[#FFC700] p-6 sm:p-7 flex flex-col justify-between overflow-hidden select-none min-h-[520px]">
      {/* Top Details Section */}
      <div className="space-y-5 relative z-10">
        {/* Brand Header: Square R Tile + RapiQR Safety Protection */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400/50 border border-amber-500/40 flex items-center justify-center font-extrabold text-xl text-slate-950 shadow-xs">
            R
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-950 font-display">
            RapiQR Safety Protection
          </span>
        </div>

        {/* Price Summary Card */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-amber-200/50 text-left">
          <p className="text-xs sm:text-sm font-semibold text-slate-500">Price Summary</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-950 mt-1 font-display tracking-tight">
            {price}
          </p>
        </div>

        {/* User Identity Pill Card */}
        <div className="rounded-xl bg-white p-3.5 shadow-xs border border-amber-200/50 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 flex-shrink-0">
              <User size={13} />
            </div>
            <span className="truncate font-semibold text-slate-800">Using as {userPhone}</span>
          </div>
          <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
        </div>
      </div>

      {/* Bottom Section: Full-bleed 3D Gold Coins illustration without any box */}
      <div className="relative z-0 mt-auto -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 pt-4">
        {/* Full illustration without any container box, blending directly into yellow */}
        <div className="w-full relative overflow-hidden flex items-end">
          <img
            src={goldCoinsIllustration}
            alt="Gold coins and payment card"
            className="w-full h-48 sm:h-56 object-cover object-bottom"
          />

          {/* Secured by Razorpay badge placed directly at the bottom left corner */}
          <div className="absolute bottom-4 left-6 z-20 flex items-center gap-1.5 text-xs font-semibold text-slate-950 drop-shadow-xs">
            <span className="opacity-90">Secured by</span>
            <span className="font-extrabold italic tracking-tight flex items-center gap-1 text-slate-950">
              <svg className="w-3.5 h-3.5 inline fill-current text-blue-600" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Razorpay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
