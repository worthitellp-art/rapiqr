import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CarFront, Eye, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import stickerArt from '../../assets/template-sticker.jpeg';
import carCrashIcon from '../../assets/car-crash-3d.png';

/**
 * Hero visual: the real RepiQR sticker floating in the middle, with routed
 * connector lines (straight runs + rounded corners, never a diagonal "pointer")
 * out to three labelled callouts. Same idea as the "integration card" pattern —
 * a centre piece sitting ON TOP of thin grey lines, a short dark pulse travelling
 * along each one, and nodes that pop in one after another.
 *
 * The desktop stage is a fixed 720×560 coordinate space that is scaled down to
 * fit its column, so the routes always meet the sticker's edges in the same
 * places. Below `sm` the callouts become a plain list under the sticker.
 */

const STAGE_W = 720;
const STAGE_H = 560;

const STICKER = { cx: 392, cy: 282, w: 430 }; // h = w / 1.6
const STICKER_H = STICKER.w / 1.6;

const BRAND_YELLOW = '#FFD500';
const LINE_BASE = '#d3d0c9';
const LINE_PULSE = '#161616';

interface Callout {
  id: string;
  icon: LucideIcon;
  text: string;
  /**
   * Routed connector: H/V runs joined by quarter-circle corners (Q). It starts
   * at the callout and ends INSIDE the sticker's bounds — the sticker is drawn
   * above the lines, so each one appears to run into the card's edge.
   */
  path: string;
  /** Callout box centre + width on the stage. */
  box: { x: number; y: number; w: number };
  /** Optional icon chip centre. */
  chip?: { x: number; y: number };
  /** A 3D PNG shown on its own (no white tile) in place of the lucide icon. */
  image?: string;
  delay: number;
}

const CALLOUTS: Callout[] = [
  {
    // Rises out of the sticker's top edge, turns right, runs into the phone chip.
    id: 'scan',
    icon: Smartphone,
    text: 'Scan and connect directly from your smartphone.',
    path: 'M 506 210 V 118 Q 506 102 522 102 H 626',
    box: { x: 650, y: 184, w: 140 },
    chip: { x: 654, y: 102 },
    delay: 0.35,
  },
  {
    // Leaves the car chip, steps down in an S-curve, runs into the left edge.
    id: 'family',
    icon: CarFront,
    text: 'Keep family informed in an emergency.',
    path: 'M 100 254 H 136 Q 152 254 152 270 V 296 Q 152 312 168 312 H 240',
    box: { x: 96, y: 376, w: 184 },
    chip: { x: 72, y: 254 },
    image: carCrashIcon,
    delay: 0.5,
  },
  {
    // Straight vertical up into the sticker's bottom edge.
    id: 'report',
    icon: Eye,
    text: 'Report suspicious activity around the vehicle',
    path: 'M 292 490 V 360',
    box: { x: 218, y: 516, w: 252 },
    delay: 0.65,
  },
];

function ConnectorLine({ callout, animated }: { callout: Callout; animated: boolean }) {
  return (
    <>
      <path d={callout.path} stroke={LINE_BASE} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {animated && (
        <motion.path
          d={callout.path}
          stroke={LINE_PULSE}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ strokeDasharray: '38 420' }}
          initial={{ strokeDashoffset: 38 }}
          animate={{ strokeDashoffset: -420 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', delay: callout.delay + 0.5 }}
        />
      )}
    </>
  );
}

function StickerCard({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ perspective: 1400 }}>
      {/* Static 3D tilt; the float animation lives on the wrapper so the two never fight over `transform`. */}
      <div style={{ transform: 'rotateX(5deg) rotateY(-11deg) rotateZ(-4deg)', transformStyle: 'preserve-3d' }}>
        <img
          src={stickerArt}
          alt="RepiQR safety sticker: scan the QR in case of emergency"
          width={1536}
          height={960}
          decoding="async"
          fetchPriority="high"
          draggable={false}
          className="block w-full select-none rounded-[18px] shadow-[0_28px_50px_-18px_rgba(0,0,0,0.45),0_6px_14px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
        />
      </div>
    </div>
  );
}

export default function HeroStickerShowcase() {
  const reduceMotion = useReducedMotion();
  const animated = !reduceMotion;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / STAGE_W));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Desktop / tablet: sticker + routed, animated connector lines ── */}
      <div
        ref={wrapRef}
        className="relative mx-auto hidden w-full max-w-[720px] sm:block"
        style={{ height: STAGE_H * scale }}
      >
        <div
          className="absolute left-0 top-0"
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* Floor shadow that breathes with the float */}
          <motion.div
            className="pointer-events-none absolute rounded-[50%] bg-black/25 blur-xl"
            style={{ left: STICKER.cx - 170, top: STICKER.cy + STICKER_H / 2 + 44, width: 340, height: 26 }}
            animate={animated ? { scaleX: [1, 0.86, 1], opacity: [0.9, 0.55, 0.9] } : undefined}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Connector lines — BEFORE the sticker in the DOM, so the sticker covers their inner ends */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            fill="none"
            aria-hidden="true"
          >
            {CALLOUTS.map((c) => (
              <motion.g
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: c.delay, duration: 0.5 }}
              >
                <ConnectorLine callout={c} animated={animated} />
              </motion.g>
            ))}
          </svg>

          {/* Sticker */}
          <motion.div
            className="absolute"
            style={{ left: STICKER.cx - STICKER.w / 2, top: STICKER.cy - STICKER_H / 2, width: STICKER.w }}
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={animated ? { y: [0, -10, 0] } : undefined}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <StickerCard />
            </motion.div>
          </motion.div>

          {/* Callout chips + text boxes */}
          {CALLOUTS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.id}>
                {c.chip && c.image && (
                  // Standalone 3D icon: pops in, then bobs gently like the sticker.
                  <motion.div
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: c.chip.x, top: c.chip.y }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: c.delay, type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <motion.img
                      src={c.image}
                      alt=""
                      width={384}
                      height={368}
                      decoding="async"
                      draggable={false}
                      className="block w-[96px] select-none drop-shadow-[0_10px_12px_rgba(0,0,0,0.22)]"
                      animate={animated ? { y: [0, -5, 0] } : undefined}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
                    />
                  </motion.div>
                )}
                {c.chip && !c.image && (
                  <motion.div
                    className="absolute z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-neutral-900/10 bg-white text-neutral-950 shadow-lg shadow-black/10"
                    style={{ left: c.chip.x, top: c.chip.y }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: c.delay, type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white" style={{ background: BRAND_YELLOW }} />
                  </motion.div>
                )}
                <motion.p
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 border border-neutral-950 bg-white px-3 py-2 text-center font-mono text-[13px] font-bold leading-[1.35] text-neutral-950"
                  style={{ left: c.box.x, top: c.box.y, width: c.box.w }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: c.delay + 0.1, duration: 0.45 }}
                >
                  {c.text}
                </motion.p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Phones: sticker with the callouts as a simple list ─────────── */}
      <div className="sm:hidden">
        <motion.div
          className="mx-auto w-full max-w-[420px] px-2"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={animated ? { y: [0, -6, 0] } : undefined}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <StickerCard />
          </motion.div>
        </motion.div>

        <ul className="mx-auto mt-8 max-w-[420px] space-y-3">
          {CALLOUTS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.li
                key={c.id}
                className="flex items-center gap-3 border border-neutral-950 bg-white p-3"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                {c.image ? (
                  <img src={c.image} alt="" width={384} height={368} decoding="async" className="h-11 w-11 shrink-0 object-contain" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-white">
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                )}
                <span className="font-mono text-[12.5px] font-bold leading-snug text-neutral-950">{c.text}</span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
