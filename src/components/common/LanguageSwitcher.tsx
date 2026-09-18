import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
  className?: string;
}

/** Navbar opt-in for switching the app's display language (English / Hindi / Gujarati). */
export default function LanguageSwitcher({ variant = 'light', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const activeLabel = LANGUAGES.find((l) => l.code === language)?.nativeLabel ?? 'English';
  const textColor = variant === 'dark' ? 'text-[#FFFFFF]/80 hover:text-[#FFFFFF]' : 'text-[#14120C]/70 hover:text-[#14120C]';

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Choose language"
        className={`flex cursor-pointer items-center gap-1.5 text-[13px] font-medium transition-colors ${textColor}`}
      >
        <Globe size={15} />
        <span>{activeLabel}</span>
        <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 w-40 pt-3">
          <div className="overflow-hidden rounded-2xl border border-[#14120C]/10 bg-[#FFFFFF] p-1.5 shadow-[0_20px_45px_-18px_rgba(0,0,0,0.25)]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#14120C]/5 ${
                  lang.code === language ? 'font-semibold text-[#14120C]' : 'font-light text-[#14120C]/70'
                }`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
