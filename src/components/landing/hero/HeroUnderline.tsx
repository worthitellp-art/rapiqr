import { motion } from 'framer-motion';

// Subtle hand-drawn accent underneath "one scan" — drawn with SVG so it can
// animate its own stroke rather than relying on an image asset.
export default function HeroUnderline({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      viewBox="0 0 210 14"
      className="absolute left-0 -bottom-2 w-full"
      style={{ height: 12 }}
      fill="none"
      aria-hidden="true"
    >
      <motion.path
        d="M3,8.5 C40,2 90,1 108,6 C135,13 175,10 207,4"
        stroke="#F0A500"
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.9, ease: 'easeInOut' }}
      />
    </svg>
  );
}
