import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut } from 'lucide-react';

interface ProfileMenuProps {
  name: string;
  email: string;
  onOpenDashboard: () => void;
  onSignOut: () => void;
}

export default function ProfileMenu({ name, email, onOpenDashboard, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition-transform duration-150 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--brand), var(--brand-mid))',
          boxShadow: '0 0 0 2px #fff, 0 0 0 3.5px rgba(240,165,0,0.55)',
        }}
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 250 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{ transformOrigin: 'top right', zIndex: 260 }}
              className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-neutral-900">{name || 'User'}</p>
                <p className="truncate text-xs text-neutral-500">{email || ''}</p>
              </div>
              <button
                onClick={() => { setOpen(false); onOpenDashboard(); }}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <LayoutDashboard size={15} />
                My Dashboard
              </button>
              <button
                onClick={() => { setOpen(false); onSignOut(); }}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
