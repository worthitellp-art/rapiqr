import React, { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, Lock } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import { AuthMode } from './hooks/useAuthForm';

const AUTH_IMAGES = [
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200',
];

const ROTATION_INTERVAL_MS = 4500;

interface AuthBrandingPanelProps {
  currentMode: AuthMode;
  isModalOpen: boolean;
}

export default function AuthBrandingPanel({ currentMode, isModalOpen }: AuthBrandingPanelProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((previousIndex) => (previousIndex + 1) % AUTH_IMAGES.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(slideTimer);
  }, [isModalOpen]);

  const handleDotNavigationClick = (index: number) => {
    setCurrentSlideIndex(index);
  };

  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 text-white relative overflow-hidden bg-slate-950">
      {AUTH_IMAGES.map((imageUrl, slideIndex) => {
        const isCurrentActiveSlide = slideIndex === currentSlideIndex;
        return (
          <div
            key={imageUrl}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              isCurrentActiveSlide
                ? 'opacity-100 scale-105 pointer-events-auto'
                : 'opacity-0 scale-100 pointer-events-none'
            }`}
            style={{
              transitionProperty: 'opacity, transform',
              transitionDuration: '1200ms',
              backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.92) 65%, rgba(15,23,42,0.98) 100%), url('${imageUrl}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          />
        );
      })}

      <div className="relative z-10">
        <div className="mb-16 flex items-center justify-between">
          <AppLogo variant="dark" className="h-10 sm:h-12 w-auto object-contain" />

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-sm">
            {AUTH_IMAGES.map((_, slideIndex) => (
              <button
                key={slideIndex}
                onClick={() => handleDotNavigationClick(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  slideIndex === currentSlideIndex
                    ? 'w-6 bg-amber-400 shadow-sm'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6 drop-shadow-md">
          {currentMode === 'login' ? 'Welcome back.' : 'One QR. Lifetime protection.'}
        </h1>

        <p className="text-base text-slate-300 leading-relaxed max-w-md drop-shadow-xs font-medium">
          {currentMode === 'login'
            ? 'Log in using your email address, phone number, or sticker activation code.'
            : 'Privacy-first smart QR safety for your vehicles, home, and family. No app required.'}
        </p>
      </div>

      <div className="relative z-10 border-t border-white/15 pt-6 space-y-3.5">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone size={16} />
          </div>
          <span>Instant Phone, Email & Code Sign In</span>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock size={16} />
          </div>
          <span>100% Anonymous phone & alert routing</span>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck size={16} />
          </div>
          <span>Lifetime protection with zero subscription fees</span>
        </div>
      </div>
    </div>
  );
}
