import React from 'react';
import { X } from 'lucide-react';
import exitDoorImage from '../../../assets/illustrations/exit-door.jpg';

interface ScanExitConfirmModalProps {
  isOpen: boolean;
  onContinuePayment: () => void;
  onConfirmExit: () => void;
  onViewTag?: () => void;
}

export default function ScanExitConfirmModal({
  isOpen,
  onContinuePayment,
  onConfirmExit,
  onViewTag,
}: ScanExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onContinuePayment}
    >
      <div
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-6 sm:p-8 relative border border-slate-100 text-center animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X Button in top right */}
        <button
          type="button"
          onClick={onContinuePayment}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* 3D Exit Door Graphic in Soft Cream Box */}
        <div className="w-full flex justify-center mb-5">
          <div className="w-48 h-36 rounded-2xl bg-[#FFFDF4] border border-[#F7EED8] flex items-center justify-center p-3 overflow-hidden shadow-inner">
            <img
              src={exitDoorImage}
              alt="Exit confirmation"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 font-display">
            Are you sure you want to exit?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            You can access the smart sticker tag directly or return to RapiQR home.
          </p>
        </div>

        {/* Stacked Action Buttons */}
        <div className="space-y-2.5">
          {onViewTag && (
            <button
              type="button"
              onClick={onViewTag}
              className="w-full py-3.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.99] text-black font-semibold text-sm transition-colors cursor-pointer"
            >
              Access Sticker Directly →
            </button>
          )}

          <button
            type="button"
            onClick={onContinuePayment}
            className="w-full py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-900 font-bold text-sm transition-colors cursor-pointer"
          >
            Continue to payment
          </button>

          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full py-3.5 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Yes, exit
          </button>
        </div>
      </div>
    </div>
  );
}
