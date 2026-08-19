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
        whileHover={{ y: -3 }}
        whileTap={{ y: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="group hero-btn-primary"
        style={{ height: 58 }}
      >
        Get Your RapiQR
        <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
      </motion.button>

      <motion.a
        href="#how-it-works"
        whileHover={{ y: -3 }}
        whileTap={{ y: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="group hero-btn-secondary"
        style={{ height: 58 }}
      >
        See How It Works
        <PlayCircle size={17} />
      </motion.a>
    </motion.div>
  );
}
