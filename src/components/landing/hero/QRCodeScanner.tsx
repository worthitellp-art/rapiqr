import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { SCAN_DEMO_URL } from './heroData';

const cornerBase = 'absolute h-6 w-6 border-amber-400';

export default function QRCodeScanner({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative">
      <div className={`${cornerBase} left-0 top-0 rounded-tl-md border-l-2 border-t-2`} />
      <div className={`${cornerBase} right-0 top-0 rounded-tr-md border-r-2 border-t-2`} />
      <div className={`${cornerBase} bottom-0 left-0 rounded-bl-md border-b-2 border-l-2`} />
      <div className={`${cornerBase} bottom-0 right-0 rounded-br-md border-b-2 border-r-2`} />

      <div className="rounded-xl bg-white p-4">
        <QRCodeSVG value={SCAN_DEMO_URL} size={148} level="H" fgColor="#0E1117" bgColor="#ffffff" />
      </div>

      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1 right-1 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(240,165,0,0.9), transparent)',
            boxShadow: '0 0 8px rgba(240,165,0,0.6)',
          }}
          animate={{ top: ['4%', '92%', '4%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}
