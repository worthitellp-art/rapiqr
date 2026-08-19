import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-800 mb-6"
      style={{ border: '1px solid rgba(240,165,0,0.25)' }}
    >
      <ShieldCheck size={13} style={{ color: 'var(--accent-deep)' }} strokeWidth={2.25} />
      India's Smartest QR Safety
    </motion.div>
  );
}
