import { useState, useRef, useEffect } from "react";
import { Bell, Plus, Tag, UserPlus, Menu } from "lucide-react";
import { FxSearchInput, FxIconButton } from "../shared/FxTopBar";
import { useLanguage } from "../../../context/LanguageContext";
import { dashboardTranslations } from "../../../i18n/dashboardTranslations";
import LanguageSwitcher from "../../common/LanguageSwitcher";

export default function TopBar({
  admin,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  activeCount = 18,
  onOpenSidebar,
}: {
  admin: { name: string; email?: string; role?: string };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: string;
  setPage: (p: string) => void;
  activeCount?: number;
  onOpenSidebar?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = dashboardTranslations[language].admin;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fx-shell h-[64px] flex-shrink-0 bg-[var(--fx-surface)] border-b border-[var(--fx-border)] flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 z-20">
      {/* ── Left: mobile menu toggle + search ────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="md:hidden flex-shrink-0 w-8 h-8 rounded-full bg-[var(--fx-surface)] border border-[var(--fx-border)] flex items-center justify-center text-[var(--fx-ink)] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </button>

        <FxSearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t.quickSearch} className="max-w-[240px]" />
      </div>

      {/* ── Right Action Cluster ──────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <LanguageSwitcher />

        {/* Status Badge */}
        <div className="hidden lg:inline-flex items-center gap-2 text-[12px] text-[var(--fx-ink-2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fx-green)]" />
          <span className="font-bold text-[var(--fx-ink)]">{activeCount}</span> {t.tagsActive}
        </div>

        {/* Notifications Button */}
        <FxIconButton icon={<Bell size={16} />} onClick={() => setPage("alerts")} title={t.alertsAndNotifications} badge />

        {/* "+ New" Action Button Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-[8px] rounded-full bg-[var(--fx-accent)] text-white font-semibold text-[13px] hover:bg-[var(--fx-accent-ink)] transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{t.new}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--fx-surface)] border border-[var(--fx-border)] rounded-2xl shadow-lg p-1.5 z-50">
              <button
                onClick={() => { setPage("qr"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] font-medium transition-colors text-left"
              >
                <Tag size={15} className="text-[var(--fx-accent)]" />
                <span>{t.generateTag}</span>
              </button>

              <button
                onClick={() => { setPage("users"); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] font-medium transition-colors text-left"
              >
                <UserPlus size={15} className="text-[var(--fx-green)]" />
                <span>{t.addUserAccount}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
