import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { NAV_ITEMS } from './navData';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  name: string;
  email: string;
  onOpenDashboard: () => void;
  onSignOut: () => void;
  onStart: () => void;
  top: number;
}

const panelVariants = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0 },
};

export default function MobileMenu({
  open,
  onClose,
  isLoggedIn,
  name,
  email,
  onOpenDashboard,
  onSignOut,
  onStart,
  top,
}: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 md:hidden"
            style={{ zIndex: 190, top }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={panelVariants}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-0 right-0 flex flex-col gap-1 border-t border-neutral-200 bg-white px-4 pb-5 pt-3 md:hidden"
            style={{ top, zIndex: 195, boxShadow: '0 16px 32px rgba(14,17,23,0.08)' }}
          >
            {NAV_ITEMS.map(item => (
              <motion.a
                key={item.sectionId}
                variants={itemVariants}
                href={item.href}
                onClick={onClose}
                className="nav-link"
              >
                {item.label}
              </motion.a>
            ))}

            {isLoggedIn ? (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-2 py-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: 'var(--brand)' }}
                  >
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-neutral-900">{name || 'User'}</p>
                    <p className="truncate text-xs text-neutral-500">{email || ''}</p>
                  </div>
                </motion.div>
                <motion.button
                  variants={itemVariants}
                  onClick={() => { onClose(); onOpenDashboard(); }}
                  className="btn-ghost mt-1 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={15} /> My Dashboard
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  onClick={() => { onClose(); onSignOut(); }}
                  className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={15} /> Log Out
                </motion.button>
              </>
            ) : (
              <motion.button
                variants={itemVariants}
                onClick={() => { onClose(); onStart(); }}
                className="nav-cta mt-2 justify-center"
              >
                Get My Sticker <ArrowRight size={14} />
              </motion.button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
