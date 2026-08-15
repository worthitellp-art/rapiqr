import { motion } from 'framer-motion';

export default function PhonePedestal({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative mx-auto mt-[-14px] flex justify-center" style={{ width: '78%' }}>
      <div
        className="h-6 w-full rounded-[50%] bg-gradient-to-b from-[#1a1a1c] to-black"
        style={{ boxShadow: '0 18px 34px rgba(14,17,23,0.28)' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-[3px] w-[92%] rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #F0A500 30%, #F0A500 70%, transparent)',
          filter: 'blur(1.5px)',
        }}
        animate={reduceMotion ? { opacity: 0.85 } : { opacity: [0.7, 1, 0.7] }}
        transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
