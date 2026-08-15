import { motion, useReducedMotion } from 'framer-motion';
import FeatureCallout from './FeatureCallout';
import { FEATURE_CALLOUTS } from './heroData';

export default function FeatureCallouts() {
  const reduceMotion = !!useReducedMotion();

  return (
    <div className="relative grid grid-cols-2 gap-x-4 gap-y-7 lg:flex lg:flex-col lg:gap-8 lg:pl-5">
      {/* Dotted connection line running down the feature column (desktop only) */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-3 left-0 top-3 hidden border-l-2 border-dotted lg:block"
        style={{ borderColor: 'rgba(240,165,0,0.45)' }}
        animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.4, 0.85, 0.4] }}
        transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {FEATURE_CALLOUTS.map((f, i) => (
        <FeatureCallout key={f.title} {...f} index={i} />
      ))}
    </div>
  );
}
