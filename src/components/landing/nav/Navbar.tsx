import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import AppLogo from '../../common/AppLogo';
import NavLinks from './NavLinks';
import ProfileMenu from './ProfileMenu';
import MobileMenu from './MobileMenu';
import { NAV_ITEMS } from './navData';

interface NavbarProps {
  isLoggedIn: boolean;
  fullName: string;
  email: string;
  onStart: () => void;
  onLogin: () => void;
  onSignOut: () => void;
}

export default function Navbar({ isLoggedIn, fullName, email, onStart, onLogin, onSignOut }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [navHeight, setNavHeight] = useState(64);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // Track the navbar's real rendered height so the mobile menu can sit
  // flush beneath it instead of relying on a guessed offset.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height;
      if (h) setNavHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Shrink + hide-on-scroll-down behaviour
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 80 && y > lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy — highlight the nav link for whichever section is crossing
  // the upper third of the viewport.
  useEffect(() => {
    const sections = NAV_ITEMS.map(item => document.getElementById(item.sectionId)).filter(
      (el): el is HTMLElement => !!el
    );
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Close the mobile menu automatically if the viewport grows past the
  // mobile breakpoint while it's open.
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: hidden ? '-100%' : 0 }}
        transition={{ opacity: { duration: 0.5 }, y: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
        className="fixed left-0 right-0 top-0 z-[200] w-full border-b bg-white/92 backdrop-blur-md"
        style={{
          borderColor: scrolled ? 'rgba(14,17,23,0.10)' : 'var(--border)',
          boxShadow: scrolled ? '0 4px 24px rgba(14,17,23,0.06)' : 'none',
        }}
      >
        <div
          className="namo-wrap relative flex items-center justify-between gap-6 transition-[padding] duration-200"
          style={{ paddingTop: scrolled ? 10 : 14, paddingBottom: scrolled ? 10 : 14 }}
        >
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-shrink-0 cursor-pointer items-center py-1"
            aria-label="RapiQR home"
          >
            <AppLogo variant="light" className="h-6.5 sm:h-8 w-auto object-contain max-h-8" />
          </motion.button>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
            <NavLinks activeSection={activeSection} />
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="hidden sm:block">
                <ProfileMenu name={fullName} email={email} onOpenDashboard={onStart} onSignOut={onSignOut} />
              </div>
            ) : (
              <button onClick={onLogin} className="nav-link hidden sm:block" style={{ fontSize: 13 }}>
                Log in
              </button>
            )}

            <motion.button
              onClick={onStart}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="nav-cta hidden sm:inline-flex"
            >
              {isLoggedIn ? (
                <>
                  <LayoutDashboard size={14} /> My Dashboard
                </>
              ) : (
                <>
                  Get My Sticker <ArrowRight size={14} />
                </>
              )}
            </motion.button>

            <button
              className="rounded-lg border border-neutral-200 bg-white p-2 md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLoggedIn={isLoggedIn}
        name={fullName}
        email={email}
        onOpenDashboard={onStart}
        onSignOut={onSignOut}
        onStart={onStart}
        top={navHeight}
      />
    </>
  );
}
