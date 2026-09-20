import React from 'react';
import { X, Smartphone, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';
import { isIOS } from '../../lib/pwaInstall';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  if (!isOpen) return null;

  const ios = isIOS();
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 relative border border-slate-200 text-left animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Download size={22} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              Download RapiQR App
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Install for instant emergency alerts &amp; offline access
            </p>
          </div>
        </div>

        {/* Instructions based on platform */}
        <div className="space-y-3.5 my-5 bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/70 text-sm">
          {ios ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  1
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Tap the <strong className="text-black font-semibold inline-flex items-center gap-1"><Share size={13} /> Share button</strong> in Safari's bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  2
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Scroll down and tap <strong className="text-black font-semibold inline-flex items-center gap-1"><PlusSquare size={13} /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  3
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Tap <strong className="text-black font-semibold">Add</strong> in the top-right corner to finish.
                </p>
              </div>
            </>
          ) : isMobile ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  1
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Tap the browser menu <strong className="text-black font-semibold inline-flex items-center gap-1"><MoreVertical size={13} /> (three dots)</strong> in the top right.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  2
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Tap <strong className="text-black font-semibold inline-flex items-center gap-1"><Smartphone size={13} /> Install app</strong> or <strong className="text-black font-semibold">Add to Home screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  3
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Confirm the installation prompt to add RapiQR to your home screen.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  1
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Click the <strong className="text-black font-semibold inline-flex items-center gap-1"><Download size={13} /> Install icon</strong> on the right side of your address bar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 text-black shadow-xs">
                  2
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Or open your browser menu <strong className="text-black font-semibold inline-flex items-center gap-1"><MoreVertical size={13} /></strong> and choose <strong className="text-black font-semibold">"Install RapiQR"</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-lg bg-white hover:bg-gray-50 active:scale-[0.99] text-black border border-gray-300 hover:border-black font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
