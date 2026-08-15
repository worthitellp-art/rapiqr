// Purely decorative, extremely low-opacity backdrop behind the phone —
// radial glow, thin rings, a dot grid and a faint skyline. Never competes
// with the product mockup in front of it.
export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Warm radial glow, right side */}
      <div
        className="absolute right-[-10%] top-[8%] h-[560px] w-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(240,165,0,0.14) 0%, rgba(240,165,0,0.05) 45%, transparent 70%)',
        }}
      />

      {/* Thin concentric rings */}
      <div className="absolute right-[6%] top-[18%] h-[420px] w-[420px] rounded-full border border-amber-200/40" />
      <div className="absolute right-[13%] top-[24%] h-[300px] w-[300px] rounded-full border border-amber-200/30" />

      {/* Dot grid, upper-right */}
      <div
        className="absolute right-[4%] top-[4%] h-[220px] w-[220px] opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(14,17,23,0.18) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Faint city silhouette along the base */}
      <svg
        className="absolute bottom-0 right-0 w-[70%] opacity-[0.05]"
        viewBox="0 0 600 140"
        fill="none"
        preserveAspectRatio="xMaxYMax slice"
      >
        <rect x="20" y="60" width="46" height="80" fill="#0E1117" />
        <rect x="76" y="30" width="34" height="110" fill="#0E1117" />
        <rect x="120" y="76" width="40" height="64" fill="#0E1117" />
        <rect x="172" y="14" width="30" height="126" fill="#0E1117" />
        <rect x="214" y="52" width="50" height="88" fill="#0E1117" />
        <rect x="276" y="40" width="28" height="100" fill="#0E1117" />
        <rect x="316" y="68" width="44" height="72" fill="#0E1117" />
        <rect x="372" y="24" width="32" height="116" fill="#0E1117" />
        <rect x="416" y="58" width="46" height="82" fill="#0E1117" />
        <rect x="474" y="44" width="30" height="96" fill="#0E1117" />
        <rect x="516" y="72" width="52" height="68" fill="#0E1117" />
      </svg>
    </div>
  );
}
