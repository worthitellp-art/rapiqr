import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import QRCodeScanner from './QRCodeScanner';
import VerificationCard from './VerificationCard';
import PhonePedestal from './PhonePedestal';

export default function PhoneMockup() {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = !!prefersReducedMotion;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : [0, -8, 0],
        rotate: reduceMotion ? 0 : [-1, 1, -1],
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.3 },
        scale: { duration: 0.6, delay: 0.3 },
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 },
        rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 },
      }}
      className="relative mx-auto"
      style={{ width: 296 }}
    >
      {/* Metallic edge / frame */}
      <div
        className="relative rounded-[52px] p-[11px]"
        style={{
          background: 'linear-gradient(155deg, #3a3a3d 0%, #131316 32%, #0a0a0b 68%, #2c2c2f 100%)',
          boxShadow:
            '0 30px 60px -12px rgba(14,17,23,0.35), 0 12px 24px -6px rgba(14,17,23,0.25)',
        }}
      >
        {/* Side buttons */}
        <span className="absolute -left-[2px] top-[92px] h-6 w-[3px] rounded-l-sm bg-[#232326]" />
        <span className="absolute -left-[2px] top-[128px] h-11 w-[3px] rounded-l-sm bg-[#232326]" />
        <span className="absolute -left-[2px] top-[180px] h-11 w-[3px] rounded-l-sm bg-[#232326]" />
        <span className="absolute -right-[2px] top-[140px] h-16 w-[3px] rounded-r-sm bg-[#232326]" />

        {/* Screen */}
        <div
          className="relative overflow-hidden rounded-[40px] bg-gradient-to-b from-[#15161b] to-[#0a0a0c]"
          style={{ width: 274, aspectRatio: '9 / 19.3' }}
        >
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-20 h-6 w-[92px] -translate-x-1/2 rounded-full bg-black" />

          <div className="flex h-full flex-col items-center px-5 pb-5 pt-11">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-white">
                <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                Ready to Help
              </div>
              <p className="mt-1 text-[10.5px] text-white/45">Scan this tag in an emergency</p>
            </motion.div>

            {/* QR */}
            <div className="flex flex-1 items-center justify-center">
              <QRCodeScanner reduceMotion={reduceMotion} />
            </div>

            <VerificationCard />
          </div>
        </div>
      </div>

      <PhonePedestal reduceMotion={reduceMotion} />
    </motion.div>
  );
}
