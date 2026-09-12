import React from 'react';

export type PaymentMethod = 'cards' | 'netbanking' | 'wallet' | 'upi';

interface ScanPaymentMethodSelectorProps {
  activeMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export default function ScanPaymentMethodSelector({
  activeMethod,
  onSelectMethod,
}: ScanPaymentMethodSelectorProps) {
  return (
    <div className="w-full sm:w-[42%] lg:w-[40%] bg-[#FAF8F2] border-r border-slate-100 flex flex-col p-2.5 sm:p-3 space-y-1.5 text-left select-none">
      {/* Cards Option */}
      <button
        type="button"
        onClick={() => onSelectMethod('cards')}
        className={`w-full p-3.5 sm:p-4 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
          activeMethod === 'cards'
            ? 'border border-black bg-white shadow-xs text-slate-950 font-bold'
            : 'border border-transparent hover:bg-white/60 text-slate-700 font-semibold'
        }`}
      >
        <span className="text-sm">Cards</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#1A1F71] text-white">VISA</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#EB001B] text-white">MC</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#097939] text-white">RuPay</span>
        </div>
      </button>

      {/* Netbanking Option */}
      <button
        type="button"
        onClick={() => onSelectMethod('netbanking')}
        className={`w-full p-3.5 sm:p-4 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
          activeMethod === 'netbanking'
            ? 'border border-black bg-white shadow-xs text-slate-950 font-bold'
            : 'border border-transparent hover:bg-white/60 text-slate-700 font-semibold'
        }`}
      >
        <span className="text-sm">Netbanking</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">S</span>
          <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-black">H</span>
          <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[9px] font-black">I</span>
        </div>
      </button>

      {/* Wallet Option */}
      <button
        type="button"
        onClick={() => onSelectMethod('wallet')}
        className={`w-full p-3.5 sm:p-4 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
          activeMethod === 'wallet'
            ? 'border border-black bg-white shadow-xs text-slate-950 font-bold'
            : 'border border-transparent hover:bg-white/60 text-slate-700 font-semibold'
        }`}
      >
        <span className="text-sm">Wallet</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800">M</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800">A</span>
        </div>
      </button>

      {/* UPI Option */}
      <button
        type="button"
        onClick={() => onSelectMethod('upi')}
        className={`w-full p-3.5 sm:p-4 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
          activeMethod === 'upi'
            ? 'border border-black bg-white shadow-xs text-slate-950 font-bold'
            : 'border border-transparent hover:bg-white/60 text-slate-700 font-semibold'
        }`}
      >
        <span className="text-sm">UPI / QR</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">UPI</span>
        </div>
      </button>
    </div>
  );
}
