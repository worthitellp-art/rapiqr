import { motion } from 'framer-motion';
import type { FeatureCalloutData } from './heroData';

export default function FeatureCallout({ icon: Icon, title, body, index }: FeatureCalloutData & { index: number; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.12 }}
      className="relative flex items-center gap-3"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(14,17,23,0.08)]">
        <Icon size={17} style={{ color: 'var(--accent-deep)' }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold leading-tight text-neutral-900">{title}</div>
        <div className="text-[12px] leading-snug text-neutral-500">{body}</div>
      </div>
    </motion.div>
  );
}
