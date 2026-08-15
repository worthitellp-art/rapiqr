import { motion } from 'framer-motion';
import { NAV_ITEMS } from './navData';

const NAV_OFFSET = 96;

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export default function NavLinks({ activeSection }: { activeSection: string | null }) {
  return (
    <div className="hidden items-center gap-1 md:flex">
      {NAV_ITEMS.map(item => {
        const isActive = activeSection === item.sectionId;
        return (
          <a
            key={item.sectionId}
            href={item.href}
            aria-current={isActive ? 'true' : undefined}
            onClick={e => {
              e.preventDefault();
              scrollToSection(item.sectionId);
            }}
            className="nav-link relative"
            style={{ color: isActive ? 'var(--ink)' : undefined }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: 'var(--paper)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
