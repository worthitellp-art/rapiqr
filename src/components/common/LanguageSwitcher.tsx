import { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from '../ui/morphing-popover';

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
    <MorphingPopover open={isOpen} onOpenChange={setIsOpen} className={className}>
      <MorphingPopoverTrigger asChild>
        <button
          aria-label="Choose language"
          className={`flex cursor-pointer items-center gap-1.5 text-[13px] font-medium transition-colors ${textColor}`}
        >
          <Globe size={15} />
          <motion.span layoutId="language-label" layout="position">
            {activeLabel}
          </motion.span>
          <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </MorphingPopoverTrigger>

      <MorphingPopoverContent className="right-0 top-full mt-2 w-44 p-1.5 text-[#14120C]">
        <p className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#14120C]/45">
          <Globe size={11} />
          <motion.span layoutId="language-label" layout="position">
            Language
          </motion.span>
        </p>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setIsOpen(false);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#14120C]/5 ${
              lang.code === language ? 'font-semibold text-[#14120C]' : 'font-light text-[#14120C]/70'
            }`}
          >
            {lang.nativeLabel}
            {lang.code === language && <Check size={14} />}
          </button>
        ))}
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}
