import { motion, useReducedMotion } from 'framer-motion';
import HeroUnderline from './HeroUnderline';

const lineVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0 },
};

export default function HeroContent() {
  const reduceMotion = !!useReducedMotion();
  return (
    <div>
      <motion.h1
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12 }}
        className="font-extrabold tracking-tight text-neutral-950"
        style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.75rem)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
        }}
      >
        <motion.span
          variants={lineVariants}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="block"
        >
          India's smartest
        </motion.span>
        <motion.span
          variants={lineVariants}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="block"
        >
          <span className="relative inline-block" style={{ color: 'var(--accent-deep)' }}>
            QR safety
            <HeroUnderline reduceMotion={reduceMotion} />
          </span>{' '}
          network.
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-6 text-base sm:text-lg leading-relaxed"
        style={{ color: '#667085', maxWidth: 560 }}
      >
        RapiQR connects you with help when it matters most.
        <br className="hidden sm:block" />
        No app. No signup. Just scan and stay safe.
      </motion.p>
    </div>
  );
}
