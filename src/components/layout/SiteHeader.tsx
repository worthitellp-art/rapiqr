import { ShieldCheck } from 'lucide-react';
import lightBgLogo from '../../../assets/logo for wh bg.png';
import { useLanguage } from '../../context/LanguageContext';
import { layoutTranslations } from '../../i18n/layoutTranslations';

interface SiteHeaderProps {
  /** In-app navigation back to the marketing home; falls back to a plain href. */
  onBack?: () => void;
}

/**
 * Real site header reused outside the marketing landing page — same logo and
 * brand bar, trimmed to what's relevant off the landing page (no scroll-to-
 * section nav, cart, or language switcher, since those only make sense there).
 */
export default function SiteHeader({ onBack }: SiteHeaderProps) {
  const { language } = useLanguage();
  const t = layoutTranslations[language].header;

  return (
    <header className="sticky top-0 z-40 border-b border-[#14120C]/8 bg-[#FEFDF9]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
        <a
          href="/"
          onClick={(e) => {
            if (onBack) {
              e.preventDefault();
              onBack();
            }
          }}
          className="flex items-center focus:outline-hidden"
          aria-label={t.homeAriaLabel}
        >
          <img src={lightBgLogo} alt="RepiQR" className="h-7 w-auto object-contain sm:h-8" />
        </a>

        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#14120C]/60">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span className="hidden sm:inline">{t.secureRegistration}</span>
        </div>
      </div>
    </header>
  );
}
