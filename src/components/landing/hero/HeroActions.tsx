import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';

export default function HeroActions({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="mt-8 flex flex-wrap items-center gap-3"
    >
      <motion.button
        onClick={onStart}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 font-semibold text-white"
        style={{ height: 58, boxShadow: '0 8px 20px rgba(14,17,23,0.18)' }}
      >
        Get Your RapiQR
        <ArrowRight
          size={17}
          className="text-amber-400 transition-transform duration-200 group-hover:translate-x-1"
        />
      </motion.button>

      <motion.a
        href="#how-it-works"
        whileHover={{ y: -2 }}
        whileTap={{ y: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-neutral-900 hover:bg-neutral-50"
        style={{ height: 58, border: '1px solid #e5e5e5' }}
      >
        See How It Works
        <PlayCircle size={17} className="text-neutral-500" />
      </motion.a>
    </motion.div>
  );
}
