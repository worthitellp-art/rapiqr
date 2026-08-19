import { motion } from 'framer-motion';
import { BOTTOM_FEATURES } from './heroData';

export default function HeroFeatureBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="mt-16 rounded-3xl bg-white sm:mt-20"
      style={{ border: '1px solid #eeeeee', boxShadow: '0 12px 32px rgba(14,17,23,0.04)' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {BOTTOM_FEATURES.map((f, i) => (
          <div key={f.title} className="px-6 py-6">
            <div
              className={`flex w-full items-center gap-3.5 ${
                i !== 0 ? 'lg:border-l lg:pl-6' : ''
              } ${i % 2 === 1 ? 'sm:border-l sm:pl-6' : ''}`}
              style={{ borderColor: '#eeeeee' }}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-light)' }}>
                <f.icon size={19} style={{ color: 'var(--accent-deep)' }} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-neutral-900">{f.title}</div>
                <div className="text-[12px] leading-snug text-neutral-500">{f.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
