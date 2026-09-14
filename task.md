# Summary

A sophisticated developer-centric UI with a dark theme, utilizing square primary buttons, pill-shaped status indicators, and rigorous monospace typography for data integrity. The design emphasizes visibility of complex workflows through high-contrast table structures and subtle radial accent glows.

# Style

The style is defined by a 'Dark Tech' aesthetic: high-contrast text on black, monospace for metrics/IDs, and 'Inter Display' for editorial headlines. It features zero-radius 'brutalist' buttons contrasted with fully rounded status chips. Interaction is signaled through subtle border rings and radial background glows.

## Spec

Create a design with a deep #000 background. Use 'Inter Display' for headlines (font-weight: 500, letter-spacing: -1px to -3.36px) and 'Geist Mono' for all data/metrics (#999999). Primary CTAs are 'btn-square' with 0px border-radius, background #FFFFFF, and text #121212. All cards (#0a0a0a) must have a 1px ring border of rgba(255, 255, 255, 0.145). Status chips are pills (100px radius) with a #1f1f1f background and 12px text. Use a specific accent blue (#52a8ff) for active states and a success green (#62c073) for positive indicators. Implement a 'scrim' gradient for hero images using linear-gradient(to top, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0) 93.785%).

# Layout & Structure

A structured multi-section landing page with an immersive hero, bento-grid feature displays, and a detailed data-visualization 'Event Stream' section.

## Header

An absolute-positioned header at the top (top: 38px) with horizontal padding of 56px. Left side contains a logo with a geometric SVG and brand name in Inter Medium (20px). Center contains a hidden-on-mobile nav with links (16px, white). Right side has a 'btn-square' CTA 'Book a demo' (background: #fff, text: #121212, padding: 8px 12px) featuring a diagonal arrow icon.

## Hero Section

Full-height (100svh) canvas frame. Background is a high-quality object-fit: cover image with a heavy black scrim overlay on the bottom 40-70%. Headline uses 'headline-fluid' class (32px to 60px size) in Inter Display, white, with a max-width of 752px. Subtext is font-size 16px, color #e7e7e7. Large CTA is btn-square, font-size 20px, with a 12px diagonal arrow icon.

## Event Stream Table

A card-based table layout. Header contains a trace ID and duration chips. Split view: left sidebar (240px) shows a scrollable list of event IDs with status dots. Right side is a table with columns: SPAN, START, and DURATION. The START column uses a progress-bar visualization (1.5h relative background) where an absolute-positioned div represents the duration and offset of that specific span using rgba(255, 255, 255, 0.18) or #52a8ff for focus.

## Bento Feature Grid

A 3-column grid of cards (#0a0a0a). Card 1 (Regression): shows a vertical list of status rows with PASS/FAIL chips and percentage changes. Card 2 (Failure Clustering): shows stacked horizontal bar charts for error metrics. Card 3 (Version Replay): shows a code-diff view with green/blue side-borders for added/modified lines.

## Metrics Grid

A 4-column border-connected grid. Each cell contains a large numerical value in Geist (56px, tracking -3.36px) with a smaller monospace unit label (e.g., 'ms', 'M', '%') and a descriptive subline in #999999.

# Special Components

## Status Chip (v-chip)

A standardized pill indicator used for status reporting.

Create an inline-flex element: background #1f1f1f, border-radius 100px, padding 4px 10px, gap 6px. Inside, a 6px x 6px circle with a status-dependent background color (#62c073 for PASS, #999999 for WARN, #ededed for ERROR/FAIL) followed by uppercase text in Geist Mono, font-size 12px, color #999999.

## Timeline Progress Bar

Visual representation of event timing in a table.

Container: w-full, h-1.5, bg-transparent. Inner bar: absolute, height 100%, rounded-sm (2px). The inner bar's left position and width should be controlled via percentage to represent start time and duration respectively. Default color: rgba(255,255,255,0.18), Active color: #52a8ff.

# Special Notes

MUST use 0px border-radius for buttons and 100px for chips to maintain the brutalist/tech contrast. MUST NOT use any brand colors outside the defined hex codes (#52a8ff, #62c073, #ededed). ALL data rows must use monospace fonts. Header nav must transition to a full-screen mobile menu on small screens.





# Summary

A cinematic, luxury editorial layout featuring deep navy and ink backgrounds, off-white 'Paper' typography, and high-contrast display serif headings. 

# Style

The style is defined by a high-contrast relationship between deep backgrounds and a soft-white (#F8F6F3) palette. Typography uses a pairing of 'Instrument Serif' (400 weight) for an editorial feel and 'Inter' (300-600 weight) for technical details. Key visual markers include large radius corners (80px), glass-style nav pills, and tight, specific vertical rhythms for technical data rows.

## Spec

Build a single landing page for Encore One, a pair of wireless over-ear headphones.
Produce it as one static index.html file with an embedded <style> block and inline SVG —
no build step, no framework, no CSS library. (If you need React + Tailwind instead, keep
every value below identical and use arbitrary-value classes such as text-[96px].)

This is a reproduction of an approved design, not a design exercise. Every number below is
a measured value. Do not redesign, restyle, simplify, round numbers, add sections, add a
footer, or "improve" anything.

## Canvas
Fixed 1440px wide, 2749px tall total. Not responsive — no media queries, no breakpoints.
Three stacked sections: hero 1030px, feature 913px, closing CTA 806px.

## Fonts
Load from Google Fonts, nothing else:
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
- Instrument Serif 400 — every display element (headlines, the price, the wordmark)
- Inter 300/400/500/600 — everything else
No third family. Set -webkit-font-smoothing:antialiased and font-synthesis:none on body.

## Colour
--hero-ground  #0D1330   hero frame fill, behind the photograph
--ink          #07070A   feature section ground
--cta-ground   #05070F   closing section ground, behind the photograph
--card         #202023   raised card surface
--dark         #0E0F12   type on a light ground
--paper        #F8F6F3   type on a dark ground

Everything else is one of those two neutrals at an alpha step, written as 8-digit hex:
#F8F6F3D9 (nav links, hero lede) · #F8F6F3D1 (nav price) · #F8F6F3A8 (card body) ·
#F8F6F385 (spec labels) · #F8F6F36B and #F5F2EE6B (ghost/nav borders) ·
#F8F6F338 (quiet button border) · #F8F6F31A (spec rules) · #F5F2EE52 (nav divider) ·
#0E0F12B8 (CTA lede) · #0A0E1438 and #0A0E143D (translucent fills) ·
#080C1414 (the one shadow).

No third hue. Never use #FFFFFF or `white` — the light neutral is always #F8F6F3.
The only gradient in the design is the hero scrim.

## Images
Use these exact URLs. They are public and require no auth. Do not substitute stock,
illustration or AI-generated imagery, and do not crop them differently.

Hero background — background-size:cover; background-position:50%
https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/7d063711-6e4f-4d0c-bed8-33a2d8f2ccb0/external-assets/0147fd01-798c-42e3-a222-1c89c3ac7559-hero-photo.png

Feature card square — background-size:cover; background-position:50%
https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/7d063711-6e4f-4d0c-bed8-33a2d8f2ccb0/external-assets/fb019c6e-c8d1-4f8e-a353-b0a1f88a4dee-card-photo.png

Closing CTA background — background-size:cover; background-position:50% 78.713%
https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/7d063711-6e4f-4d0c-bed8-33a2d8f2ccb0/external-assets/e4a52ad3-289c-4bf3-aef6-fc395c4afaf3-cta-photo.png

That 78.713% is not a typo and not roundable — it is what places the horizon low and the
headphones centre-bottom.

## Section 1 — Hero (1030px)
Frame: 1440×1030, fill #0D1330, border-radius: 0 0 80px 80px with overflow:clip,
position:relative, flex column, centred. The bottom radius is what curves the photograph
away from the black section below — it is easy to miss and very visible.

Three stacked layers:
1. Photograph — position:absolute; inset:0, 1440×1030, cover, position 50%.
2. Scrim — position:absolute; top:0, 1440×700 only (not full height, so it fades out above
   the fold):
   linear-gradient(180deg, rgba(6,10,20,.62) 0%, rgba(6,10,20,.34) 46%, rgba(6,10,20,.10) 78%, rgba(6,10,20,0) 100%)
3. Nav — position:absolute; top:0; left:0, 1440×88, padding-inline:64px,
   justify-content:space-between, align-items:center, z-index:3. Not sticky, not fixed.
   - Wordmark: 10px gap — a 7×7 circle, #F5F2EE at opacity:.85, then ENCORE in Instrument
     Serif 21px/26px, letter-spacing:.06em, #F8F6F3. Text, not an image.
   - Menu: 38px gap — Home, Sound, Fit, Journal, Support. Inter 400 13px/16px,
     letter-spacing:.1em, #F8F6F3D9, sentence case (not uppercase).
   - Buy pill: fill #0A0E1438, 1px #F5F2EE6B border, radius 100px, padding 11px 22px,
     10px gap — BUY (Inter 500 12px/16px, .1em, #F8F6F3), a 1×12px #F5F2EE52 divider,
     then $349 (Inter 400 12px/16px, .1em, #F8F6F3D1).

Copy block — position:relative, width 1440, padding-top:158px, flex column, centred:
- <h1> Close your eyes. Go anywhere. — Instrument Serif 96px/104px, letter-spacing:-.015em,
  #F8F6F3, centred. One single line. Add white-space:nowrap. Do not insert a <br>; it must
  not wrap.
- Lede wrapper 620px wide, padding-top:12px. Text: Inter 300 15px/27px, #F8F6F3D9, centred —
  "Wireless over-ear headphones tuned for long listening. Adaptive silence, sixty hours of
  play, and a fit light enough to forget."
- Button row, padding-top:48px, 16px gap: filled "Shop Encore One" + ghost "Book a listen".

## Section 2 — Feature (913px)
Background #07070A, padding: 80px 0 100px, flex column, centred.
- <h2> So everything else can wait. — Instrument Serif 72px/78px, -.015em, #F8F6F3, centred.
- Row: width 1240px, padding-top:48px, display:flex, gap:26px. Two 607×607 blocks, both
  border-radius:36px, both flex-shrink:0.

Left block — fill #202023, padding:56px, flex column, align-items:flex-start:
- $399 — Instrument Serif 104px/104px, -.015em, #F8F6F3.
- Body wrapper 430px wide, padding-top:22px. Inter 300 15px/27px, #F8F6F3A8 — "Memory foam
  and lambskin on a spring-steel frame. Most people forget they're wearing them by the
  second song."
- Spec list — 495px wide, padding-top:75px, flex column. Four rows, each: 495px wide,
  justify-content:space-between, align-items:center, padding-block:12px, and a 1px #F8F6F31A
  top border (top only; the group has no bottom rule).
  - Label: fixed width:300px, flex-shrink:0, Inter 400 13px/16px, #F8F6F385. The fixed lane
    is what lands every value on the same right-hand rule.
  - Value: Inter 500 13px/16px, #F8F6F3, right-aligned.
  - Rows: Clamping force / 4.2 N · Earpads / Lambskin memory foam ·
    Headband / Spring steel · Playtime / 60 hours
  - Each row must compute to exactly 30px tall (12 + 16 + 12). Set line-height:16px
    explicitly on both label and value — inherited leading makes them 33px and throws the
    card's internal rhythm off.
- Button, padding-top:28px: quiet "Explore the Encore One".

Right block — the feature photograph, cover, 50%, no padding.

## Section 3 — Closing CTA (806px)
1440×806, fill #05070F, overflow:clip, padding-top:48px, position:relative, flex column,
centred. Photograph absolute, cover, 50% 78.713%. No scrim — the image is light enough that
the type flips dark instead.

Copy column position:relative, 640px wide, flex column, centred:
- <h2> Press play — Instrument Serif 72px/78px, -.015em, #0E0F12, centred.
- Lede wrapper 530px, padding-top:28px. Inter 300 15px/27px, #0E0F12B8, centred — "Order
  today with free two-day shipping and sixty days to live with them. If the quiet isn't
  everything you hoped for, send them back and we'll cover the return."
- Button wrapper padding-top:16px: filled "Shop Encore One".

## Buttons
All three: border-radius:100px, labels uppercase, letter-spacing:.1em, 13px/16px,
display:flex, align-items:center.

                Filled                    Ghost                  Quiet
Fill            #F8F6F3                   #0A0E143D              none
Border          none                      1px #F8F6F36B          1px #F8F6F338
Label           #0E0F12, Inter 600        #F8F6F3, Inter 500     #F8F6F3, Inter 500
Padding         19px 30px 19px 36px       18px 32px              15px 24px 15px 30px
Gap             16px                      —                      14px
Arrow           yes, 1.5 stroke #0E0F12   no arrow               yes, 1.4 stroke #F8F6F3
Shadow          0 18px 46px #080C1414     none                   none

The filled button's horizontal padding is deliberately asymmetric (36 left / 30 right) so
the arrow doesn't sit too near the edge.

Arrow glyph — 17×10, viewBox="0 0 17 10", fill="none", two stroked paths with round caps
and joins:
<svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true">
  <path d="M11.6 1 L15.8 5 L11.6 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.4 5 H0.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>

## Elevation
0 18px 46px #080C1414 on the filled button is the only shadow in the entire design.
The cards have none. Do not add any.

## Acceptance checks
Before you call it done, verify each of these:
1. Rendered page height is exactly 2749px at a 1440px viewport.
2. The hero headline sits on one line.
3. The string #FFFFFF / white appears nowhere in the CSS.
4. Each spec row measures exactly 30px tall.
5. The hero's two bottom corners are rounded 80px; the top corners are square.
6. All three images load (HTTP 200) and are positioned as specified.
7. Exactly one box-shadow declaration exists in the stylesheet.

# Layout & Structure

The layout follows a 1440px fixed-width container with a structured vertical flow: a cinematic hero section with bottom corner radii, followed by feature sections featuring bento-style cards and technical spec lists.

## Header and Navigation

Fixed 1440px width, 88px height. Left-aligned logo with a 7px dot (#F5F2EE, 85% opacity) followed by 'ENCORE' in 21px Instrument Serif. Center navigation links in 13px Inter, 0.1em tracking. Right-aligned 'Buy' pill: 40px height, glass background (#0A0E1438), border (#F5F2EE6B), containing price and action label separated by a vertical divider.

## Hero Section

1030px height, background #0D1330 with a top-down gradient scrim (rgba(6,10,20,0.62) to transparent). Bottom corners feature an 80px radius. Headline: 'Close your eyes. Go anywhere.' in 96px/104px Instrument Serif, forced to one line. Subtext: 620px wide container, 15px Inter, light weight, 27px leading. Primary CTA: Rounded white (#F8F6F3) button with 54px height, black text, and an arrow icon.

## Feature Specification Section

Background #07070A. Large display h2 (72px). Two-column grid (1240px wide). Left Card: 607px square, #202023 background, 36px corner radius, 56px padding. Includes a 104px Serif price/stat, a brief description, and a 4-row technical spec list. Right Card: Matching 607px square containing a full-bleed cinematic image.

## Closing CTA

806px height, background #05070F with a central focal-point image. Headline: 72px/78px Instrument Serif. Centered text block (530px wide). Call-to-action button (54px height) centered below the text.

# Special Components

## Technical Spec Rows

Precision-aligned data rows for technical specifications.

Construct rows within a definition list (dl). Each row: height 30px, border-top 1px solid #F8F6F31A. Labels (dt): 13px Inter, color #F8F6F385. Values (dd): 13px Inter, font-weight 500, color #F8F6F3. Vertical padding: 12px top and bottom; Line-height: 16px.

## Glass Buy Pill

A compact, high-contrast commerce trigger.

Height: 40px. Background: #0A0E1438. Border: 1px solid #F5F2EE6B. Border-radius: 9999px. Padding: 0 22px. Content: Left-side bold label ('BUY'), 1px vertical divider (#F5F2EE52), right-side price in 12px Inter.

# Special Notes

MUST NOT use #FFFFFF; always use #F8F6F3 for primary highlights. HERO HEADLINE must stay on a single line regardless of screen size within the 1440px container. All SPEC ROWS must be precisely 30px tall (targeting 12px padding top/bottom with 16px line-height) and separated by 1px #F8F6F31A borders. Ensure font smoothing is set to antialiased for ultra-thin Inter weights.