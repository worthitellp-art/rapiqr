import { motion } from 'framer-motion';

const AVATARS = [
  { initials: 'RM', bg: '#F0A500', fg: '#0E1117' },
  { initials: 'PS', bg: '#059669', fg: '#fff' },
  { initials: 'AT', bg: '#0284C7', fg: '#fff' },
];

export default function SocialProof() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.85 }}
      className="mt-9 flex items-center gap-3"
    >
      <div className="flex -space-x-2">
        {AVATARS.map((a, i) => (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold"
            style={{ background: a.bg, color: a.fg }}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <span
        className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
        style={{ background: 'var(--accent-light)', color: 'var(--accent-deep)' }}
      >
        10K+
      </span>
      <span className="text-sm font-medium text-neutral-600">
        Trusted by 10,000+ families across India
      </span>
    </motion.div>
  );
}
