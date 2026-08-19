import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function VerificationCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}
      className="mt-5 flex items-center gap-3 rounded-2xl bg-[#161821] px-4 py-3.5"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(240,165,0,0.15)' }}>
        <ShieldCheck size={17} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
          Tag Verified
          <CheckCircle2 size={12} className="text-emerald-400" />
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-white/45">KA-01-MJ-9921</div>
        <div className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>Help is ready</div>
      </div>
    </motion.div>
  );
}
