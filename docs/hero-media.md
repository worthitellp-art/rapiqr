# Hero media

The landing page hero (`src/components/landing/LandingPageMaster.tsx` →
`HeroBackdrop`) ships **no media asset at all** — no photo, no video. It's a
fine CSS dot-grid, vignette-masked, plus the `AuroraGlow` component defined
right after it (soft, slowly drifting gradient blobs). Both are pure CSS/SVG.

This is a deliberate progression, not the original design:

1. **Originally**: a photographic still + a looping background video
   (`hero-bg.jpg` / `hero-bg-portrait.jpg` / `hero-bg.mp4`).
2. **Then**: the video was dropped for `AuroraGlow` — same sense of living
   motion, none of the fetch/decode cost. The still stayed as the backdrop.
3. **Now**: the still is gone too. `HeroBackdrop` is a dot-grid; `AuroraGlow`
   supplies the color and motion.

## Why no image or video at all

The hero backdrop was the page's largest-contentful-paint element under every
prior version. It now costs zero bytes and zero decode time — text plus two
CSS layers. Nothing here can ever be the slow part of loading this page.

It also matches the pattern actual large product/AI-marketing sites lean on
for a hero backdrop today (Linear, Vercel, Stripe's fine engineering grid;
Google's Gemini/Antigravity and Meta AI's soft gradient "bloom" in place of
literal photography or video loops) — abstract, on-brand, fast, and it never
looks stale the way a specific stock photo eventually does.

## What's left in `HeroBackdrop`

```
radial-gradient(rgba(255,255,255,0.95) 1px, transparent 1px)  // the grid dot
background-size: 30px 30px                                     // grid pitch
mask-image: radial-gradient(ellipse 70% 65% at 50% 42%, black 45%, transparent 100%)
```

The mask is what keeps this from reading as a flat tiled wallpaper cut off
hard at the viewport edge — it's strongest in an oval behind the headline and
fades out toward the corners, the same "spotlit" treatment those sites use.
The whole layer still carries the scroll parallax (`parallaxY`/`parallaxScale`,
wired from `heroImageY`/`heroImageScale` in the main component) that the photo
used to.

`AuroraGlow`'s three blobs use amber only at low opacity (0.14–0.22) and only
screen-blended over the dark scrim — it reads as ambient light, not the flat
"yellow wash" panel the palette comment at the top of the file rules out.

## If a future redesign wants imagery back

The full photo + video workflow (source masters, ffmpeg encode commands,
loop-seam verification, orientation-based `<picture>` swap, idle-loaded video
with black-frame handover) is preserved in git history — `git log -p --
docs/hero-media.md` on a commit from before this rewrite has the complete
recipe. Don't re-derive the faststart/CRF tuning from scratch; it was
non-trivial to get right the first time.
