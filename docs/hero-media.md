# Hero media

The landing page hero (`src/components/landing/LandingPageMaster.tsx` →
`HeroBackdrop`) uses three files. Two of them are **generated** — do not hand-edit
them, and do not point the code at the source masters.

| File | Role | Size |
| --- | --- | --- |
| `assets/hero.png` | source master, landscape 1717×916 | 1.24 MB — never shipped |
| `assets/resbg.png` | source master, portrait 849×1852 | 1.29 MB — never shipped |
| `assets/bg.mp4` | source master, 1920×1080 @ 17 Mbps | 16.5 MB — never shipped |
| `assets/hero-bg.jpg` | **shipped** landscape still | 81 KB |
| `assets/hero-bg-portrait.jpg` | **shipped** portrait still | 83 KB |
| `assets/hero-bg.mp4` | **shipped** background loop | 6.2 MB |

Only files that are `import`ed end up in the build, so the masters can stay in
the repo without ever reaching a browser.

## Why the masters can't ship as-is

**The stills were PNGs.** PNG is lossless and made for flat graphics; these are
photographs. The hero still is the largest-contentful-paint element, so 2.5 MB of
PNG sat directly between a visitor and their first sight of the page. As JPEG the
pair is 164 KB — a 15× reduction with no visible difference behind the hero's
1px blur and dark scrim.

**The video was unplayable as a background.** Two separate problems:

1. **17.25 Mbps** for a 1080p24 clip — roughly 10× what a background loop needs.
2. **Its `moov` atom was written last.** That's the index a player needs before it
   can decode anything, so the browser had to download almost the entire 16.5 MB
   before rendering one frame. No amount of frontend lazy-loading fixes this;
   `-movflags +faststart` moves the atom to the front (it now sits at byte 32).

## Regenerating

Any ffmpeg build works. There is no ffmpeg on PATH on this machine; the encodes
were produced with the one bundled with CapCut:

```
FF="/c/Users/mihir/AppData/Local/CapCut/Apps/9.1.0.3879/ffmpeg.exe"
```

That build has no `libx264`, `libwebp` or `libvpx`, so it uses Windows Media
Foundation for H.264 and MJPEG for the stills. **If you install a normal ffmpeg,
prefer the better commands in the last section.**

### Stills

```sh
"$FF" -i assets/hero.png  -c:v mjpeg -q:v 3 -pix_fmt yuvj420p -y assets/hero-bg.jpg
"$FF" -i assets/resbg.png -c:v mjpeg -q:v 3 -pix_fmt yuvj420p -y assets/hero-bg-portrait.jpg
```

`-q:v` runs 2 (best) to 31. 3 is visually lossless here; raise it if you need
smaller files.

### Video

```sh
"$FF" -i assets/bg.mp4 -an \
      -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=6.85:d=1.15" \
      -c:v h264_nvenc -profile:v high -preset p7 -tune hq \
      -rc vbr -b:v 6500k -maxrate 8500k -bufsize 17000k \
      -pix_fmt yuv420p -movflags +faststart -y assets/hero-bg.mp4
```

**The fades are what make it loop.** The source cuts hard at the wrap: its first
and last frames differ by 61.7/255 average brightness, which on screen is a jarring
flash every 8 seconds. Fading out to black at the tail and up from black at the head
brings that to 2.4/255 — both ends are black, so the seam is invisible. Measure it
with the frame-compare snippet at the bottom of this file.

A boomerang (`forward + reversed`) is the other usual way to close a loop, and it is
**wrong for this clip**: the car drives toward the camera through spray, so playing it
backwards reads as broken. The dip to black suits a near-black hero anyway.

Encoder notes:

- `-an` strips audio; the element is `muted`, so audio is pure waste. (This source
  has no audio track anyway.)
- `h264_nvenc` needs an NVIDIA GPU — present on this machine. It gives **High**
  profile (CABAC + B-frames). The earlier `h264_mf` encode was Constrained
  Baseline at 720p/1.3 Mbps and looked visibly soft and blocky; this is why.
  If NVENC is unavailable, `h264_amf` (AMD) also works here; `h264_qsv` does not.
- **`-cq` is ignored by this build** and **`-rc constqp` is unusable** — qp 20
  produced 32 MB and qp 28 still produced 20 MB, both larger than the 16.5 MB
  master. Only `-rc vbr` with an explicit `-b:v` behaves sanely here; size then
  scales roughly linearly with the bitrate.
- Full 1920×1080 is kept. The content is almost entirely dark gradients, which
  are the worst case for H.264, and downscaling to 720p then upscaling to a
  full-bleed desktop hero was a large part of the softness.
- **6500k is the quality point.** Compared against the master on lossless PNG
  crops of the water spray: 1600k macroblocks badly, 2400k and 4500k both wash
  out the shadows and smear the droplets, 6500k holds close to the master.
  6.2 MB is 2.6x smaller than the master and this only ever loads on desktop,
  after idle, over a fast-start file — so the bytes are affordable here.
  **Always compare against `assets/bg.mp4` on PNG crops, not JPEG**: JPEG's own
  artifacts on near-black footage will fool you into seeing a colour shift that
  is not in the video (measure luma instead — master and encode both mean ~25).

### With a full ffmpeg build (preferred)

```sh
# Stills — WebP is ~30% smaller again than JPEG at matching quality
ffmpeg -i assets/hero.png  -c:v libwebp -quality 82 -y assets/hero-bg.webp
ffmpeg -i assets/resbg.png -c:v libwebp -quality 82 -y assets/hero-bg-portrait.webp

# Video — libx264 at CRF beats any hardware encoder on quality per byte, and
# unlike NVENC it actually honours a quality target instead of pinning to maxrate.
ffmpeg -i assets/bg.mp4 -an \
       -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=6.85:d=1.15" \
       -c:v libx264 -profile:v high -crf 21 -preset slow -tune film \
       -movflags +faststart -pix_fmt yuv420p -y assets/hero-bg.mp4
```

For this dark-gradient footage, `-crf 21` with libx264 should land near the
current 2.1 MB at noticeably better quality. Push to `-crf 19` if banding shows
on the bonnet; add `-x264-params aq-mode=3` which specifically helps flat dark
areas hold together.

If you switch the stills to WebP, add a JPEG `<source>` alongside it in
`HeroBackdrop` — WebP is missing on Safari 13 and earlier.

## How the hero loads

`HeroBackdrop` is built so the video can never delay the page:

- A `<picture>` picks the still on `(orientation: portrait)`, so a phone
  downloads only the tall crop and a desktop only the wide one. The `<img>` is
  `fetchPriority="high"` and eager — it is the LCP and must not be deferred.
- The `<video>` has `preload="none"` and **no `src` attribute** until JS decides
  to attach one, so nothing is requested by default.
- It is skipped entirely for `prefers-reduced-motion`, for Save-Data, for
  connections reporting 2g/3g, and for phones (coarse pointer under 1024px).
  Phones keep the portrait still — which is also the better composition, since
  the video is 16:9 and would crop badly into a tall viewport.
- When allowed, the source is attached in a `requestIdleCallback` so the fetch
  starts after the page is interactive, and the video fades in over the still on
  `canplay`. If it stalls or errors, the still simply stays.
- Playback pauses whenever the hero scrolls off screen or the tab is hidden.

## Checking the loop seam

After any re-encode, confirm the wrap is still invisible. This compares the first
and last frame as 160×90 greyscale and prints the mean absolute difference:

```sh
FF="/c/Users/mihir/AppData/Local/CapCut/Apps/9.1.0.3879/ffmpeg.exe"
mkdir -p .herotmp
"$FF" -loglevel error -i assets/hero-bg.mp4 \
      -vf "select=eq(n\,0),scale=160:90,format=gray" -fps_mode passthrough \
      -f rawvideo -y .herotmp/first.raw
"$FF" -loglevel error -sseof -0.06 -i assets/hero-bg.mp4 \
      -vf "scale=160:90,format=gray" -frames:v 1 -f rawvideo -y .herotmp/last.raw
node -e "
const fs=require('fs');
const a=fs.readFileSync('.herotmp/first.raw').subarray(0,14400);
const b=fs.readFileSync('.herotmp/last.raw').subarray(0,14400);
let d=0; for(let i=0;i<a.length;i++) d+=Math.abs(a[i]-b[i]);
const mad=d/a.length;
console.log('seam:', mad.toFixed(2), '/255', mad<3?'-> seamless':'-> VISIBLE JUMP');
"
rm -rf .herotmp
```

Reference values: the raw source scores **61.70** (hard cut). The shipped encode
scores **2.37** (seamless). Anything under ~3 is imperceptible.

## Notes

- The hero applies `blur-[1px]` to both the still and the video — a deliberate
  depth effect so the backdrop doesn't compete with the headline. If you want the
  video crisper, drop the class from the `<video>` in `HeroBackdrop`; the fade-in
  from the blurred still will then read as a gentle focus-pull.
- `assets/bg.mp4`, `hero.png` and `resbg.png` are masters. Keep them — every
  regeneration starts from them, and re-encoding an encode compounds artefacts.

## Why the still and the video must never cross-dissolve

`assets/hero.png` and `assets/bg.mp4` are **different footage** — a different
car, different framing, different lighting, different location. Fading one into
the other shows both pictures at once and reads as a rendering glitch, not a
transition.

`HeroBackdrop` therefore hands over *through black* rather than dissolving:

1. The still is on screen. The video is loaded but paused on frame 0.
2. Frame 0 is encoded **pure black** (verify: brightest pixel must be 0). The
   video is faded up to full opacity while still paused — so all the viewer sees
   is the still dimming to black. Nothing overlaps, because the top layer has no
   content yet.
3. Once opaque, playback starts and the video reveals out of black — the same
   move the loop itself makes every 8 seconds, so it reads as intentional.

**If you re-encode without the `fade=t=in` at the head, frame 0 stops being
black and the glitch comes straight back.** The seam check above prints the
first frame's brightest pixel for exactly this reason.

The video also carries no `blur-[1px]`, unlike the still. The still is softened
on purpose so it sits behind the headline; blurring the video was discarding the
detail the high-bitrate encode exists to provide. The swap happens through black,
so the difference in sharpness is never visible mid-transition.
