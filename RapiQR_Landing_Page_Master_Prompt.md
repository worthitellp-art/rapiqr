# RapiQR Landing Page — Master Build Prompt

## Goal

Delete the existing multi-page/old landing page and replace it with **one premium, single-page RapiQR landing page**.

The design should be inspired by the supplied Sparkline references:
- Minimal
- Premium SaaS/startup aesthetic
- Large bold typography
- Huge whitespace
- Soft rounded cards
- Very clean layouts
- Strong visual hierarchy
- Subtle motion
- Product-focused sections
- High-quality realistic UI/product mockups

Do **not** copy Sparkline branding, wording, logo, colors, or proprietary assets. Use the visual language only as inspiration.

---

## Brand Direction

Brand: **RapiQR**

Theme:
- Light theme
- Yellow as the main brand accent
- Black/dark charcoal typography
- Warm off-white background
- White cards
- Very subtle gray borders
- Small amount of soft gray/yellow shadow

Suggested palette:

```css
--yellow: #FFC928;
--yellow-dark: #E5AA00;
--ink: #111111;
--muted: #66645F;
--line: #E9E7E1;
--paper: #FCFCFA;
--cream: #F6F4EE;
--dark: #101010;
--danger: #EF3D3D;
```

The page should feel:
**premium + trustworthy + modern + safety-focused + privacy-first.**

Avoid:
- Excessive gradients
- Glassmorphism everywhere
- Neon colors
- Generic AI-looking designs
- Excessive rounded floating elements
- Huge unnecessary illustrations
- Random decorative text
- Over-designed UI
- Excessive animations

---

## Technology

Build the page with:

- HTML5
- Tailwind CSS
- Custom CSS
- Vanilla JavaScript
- Google Font: Inter
- Responsive desktop/tablet/mobile layout

Tailwind can be loaded through CDN for the standalone HTML version.

Use semantic HTML and clean class names.

The final output should contain:

```text
index.html
landing.css
```

No React is required for this version.

---

# Page Structure

Create ONE landing page containing the following sections.

## 1. Sticky Navigation

Create a premium floating navigation bar.

Left:
- RapiQR logo/wordmark

Center:
- Products
- How it works
- Features
- Pricing
- Partners

Right:
- Search icon
- Log in
- Get a tag button

Design:
- White background
- Thin border
- Rounded pill/container
- Subtle shadow
- Sticky at the top
- Mobile navigation should collapse cleanly

Primary CTA:
**Get a tag ↗**

---

# 2. Hero Section

Create a large two-column hero.

Left side:

Small eyebrow:

**Privacy-first QR safety**

Main heading:

```text
Your safety.
Your QR.
Your control.
```

Highlight **QR.** with yellow background.

Supporting text:

```text
Smart QR tags that let anyone reach you, report an issue or share a location —
without exposing your phone number.
```

Buttons:

Primary:
**Shop safety tags →**

Secondary:
**See how it works ↗**

Small trust statement:

**Privacy by design · No app required to scan**

Right side should contain a realistic premium product composition:

- Physical RapiQR safety tag
- Real QR code
- Floating smartphone UI
- GPS/location indicator
- Secure notification
- Soft yellow glow
- Floating status badges

Example status badges:

```text
Scan detected · 0.4s
Number stays private
```

The QR must be a real generated QR code, not a fake square.

---

# 3. Trust / Use-Case Strip

Add a narrow horizontal section immediately below the hero.

Label:

**ONE TAG. MANY MOMENTS.**

Use four categories:

```text
01 Vehicle
02 Home
03 Family
04 Travel
```

Keep this section extremely clean.

---

# 4. Platform Introduction

Heading:

```text
One small QR.
Real-world help.
```

Supporting text:

```text
Put a RapiQR tag where people need to contact you.
A camera opens a secure page, so a finder can call,
message, share GPS or raise an emergency alert —
without an app.
```

On the right create a visual QR ecosystem:

Center:
- Real QR code

Around it:
- GPS
- Private call
- Instant alert

Use subtle orbit/ring effects.

---

# 5. Products Section

Heading:

```text
Choose what
you want to protect.
```

Highlight **protect.** in yellow.

Supporting text:

```text
Buy once. Stick it. Done.
Lifetime platform access included.
```

Create premium product cards for:

### Automobile Safety Tag

Price:
**₹349**

Old price:
₹499

Features:
- Wrong-parking alerts
- Masked call routing
- Crash SOS
- Weatherproof 3+ years

Rating:
**★ 4.9**

### Residential Gate Tag

Price:
**₹349**

Old price:
₹499

Features:
- Courier alerts
- Visitor check-in
- Neighbour contact
- Privacy-first contact

### Pediatric School Bag Tag

Price:
**₹249**

Old price:
₹349

Features:
- Guardian contact
- Medical information
- Emergency support
- Private communication

### Smart Luggage Tag

Price:
**₹349**

Old price:
₹499

Features:
- Lost luggage alerts
- Scan notifications
- GPS sharing
- Owner contact

### Senior Medical Keychain

Price:
**₹299**

Features:
- Medical profile
- Emergency contact
- Secure information
- Family notification

Every product card should have:
- Realistic visual
- QR tag
- Product name
- Rating
- Description
- Price
- CTA
- Hover interaction

Do not use generic emoji-only product illustrations.

Use CSS-built mockups, realistic product compositions, or clean product-style placeholders that look like actual products.

---

# 6. How It Works

Section heading:

```text
Five steps.
Nothing complicated.
```

Create an interactive 5-step flow:

```text
01 Order your tag
02 Stick it where it matters
03 Someone scans
04 You get notified
05 Take action
```

Show a visual preview beside the steps.

When the user clicks a step:
- Update the preview
- Update title
- Update description
- Update step number

Make the interaction smooth.

---

# 7. Features

Heading:

```text
Designed for the
real world.
```

Create a premium feature grid.

Include:

### Zero number exposure
Your phone number stays private.

### Live GPS sharing
Share scan/location information securely.

### Multi-channel alerts
Support push/SMS-style notifications.

### No app for scanners
A normal phone camera is enough.

### 13 emergency types
Support different emergency scenarios.

### Encrypted & access-controlled
Protect sensitive information.

### Opt-in medical profile
Only expose medical information when configured.

### Instant sticker restore
Allow the user to restore/reconnect a lost or damaged tag.

Use a clean grid with one larger featured card.

---

# 8. Interactive Scanner Demo

Heading:

```text
See what a
scanner sees.
```

Create a realistic mobile phone mockup.

Show a real RapiQR scan interface.

Create interactive tabs/actions:

```text
SCAN
CALL
LOCATION
EMERGENCY
```

Interaction flow:

### Scan

Show:

```text
RapiQR Safe
Secure contact available
```

### Call

Show:

```text
Calling owner
Connected via private proxy number

Owner notified
Push + SMS delivered securely
```

### Location

Show a realistic map-style UI:

```text
Location shared
Owner has been notified of the scan location
GPS PIN SENT TO OWNER
```

### Emergency

Show:

```text
Emergency alert
Select the type of emergency

Accident / Collision
Medical emergency
Fire / Gas leak
```

This section must feel like a real product demo rather than static text.

---

# 9. Use Cases

Heading:

```text
One QR.
Every situation.
```

Create tabs:

```text
Vehicles
Home
Family
Travel
```

When a tab changes:
- Change heading
- Change bullet points
- Change visual
- Change tag/product representation

Vehicle example:

```text
Visible to strangers.
Your number doesn't have to be.

Parking alerts
Private calls
Crash SOS
GPS notifications
```

Home:

```text
Help visitors reach you.
Without exposing your number.

Courier alerts
Visitor contact
Neighbour communication
Emergency alerts
```

Family:

```text
A safer way to stay connected.

Guardian contact
Medical profile
Emergency support
Private communication
```

Travel:

```text
Lost doesn't have to mean unreachable.

Bag recovery
Scan notifications
GPS sharing
Secure owner contact
```

---

# 10. Pricing

Use a light warm-gray background.

Heading:

```text
Start small.
Protect more.
```

Pricing cards:

### One Tag

₹349

Include:
- 1 physical QR tag
- Lifetime platform access
- Private contact
- Scan notifications
- GPS sharing

### Family Bundle

₹899

Make this the highlighted/popular card.

Include:
- 3 QR tags
- Lifetime platform access
- Family management
- Emergency alerts
- GPS sharing

Badge:

**MOST POPULAR**

### Custom

Text:

**Let's talk**

For:
- Schools
- Housing societies
- Fleets
- Businesses
- Distributors

---

# 11. Distributor / Partner Section

Use a dark section for contrast.

Heading:

```text
Build a business
around safer streets.
```

Supporting copy should target:

- Distributors
- Dealers
- Schools
- Housing societies
- Fleet operators
- Business partners

Show four stat cards:

```text
B2B
Schools
Fleets
Distributors
```

Yellow should be used as the accent against the dark background.

CTA:

**Become a partner →**

---

# 12. Testimonials

Heading:

```text
Useful when
it matters.
```

Create three clean testimonial cards.

Each card should contain:
- 5-star rating
- Short real-world experience
- User initials/avatar
- Name
- Role/location

Keep testimonials believable and concise.

Do not make them look like fake marketing blocks.

---

# 13. FAQ

Heading:

```text
Quick answers.
```

Create an accordion using native `<details>` / `<summary>` or JavaScript.

Questions should cover:

- How does RapiQR work?
- Does the scanner need an app?
- Can someone see my phone number?
- How does private calling work?
- Can I share GPS?
- What happens during an emergency?
- Can I use one account for multiple tags?
- Is platform access included?

Use minimal accordion styling.

---

# 14. Final CTA

Use a dark premium section.

Main heading:

```text
Protect what matters.
Keep your number private.
```

Supporting text:

```text
One QR can make everyday situations safer.
```

CTA:

**Get your RapiQR →**

Add subtle yellow pattern/details in the background.

---

# 15. Footer

Footer should contain:

RapiQR logo.

Columns:

### Product
- Safety Tags
- How It Works
- Features
- Pricing

### Company
- About
- Partners
- Contact
- FAQ

### Legal
- Privacy
- Terms
- Refund Policy

Bottom:

```text
© 2026 RapiQR. All rights reserved.
Made in India 🇮🇳 · Privacy-first by design
```

---

# Visual Design Rules

Typography:

Use **Inter**.

Headings:
- Extra bold / 800–900
- Tight letter spacing
- Large responsive sizes
- 0.90–1.0 line-height

Body:
- Small
- Clean
- Gray
- High readability

Yellow highlighting:

Use yellow rectangular highlights behind selected words.

Example:

```html
<mark>QR.</mark>
```

Do not highlight every heading.

---

# Card Design

Cards should use:

```css
background: #fff;
border: 1px solid #e9e7e1;
border-radius: 22px;
```

Use very soft shadows.

Hover:
- Slight upward movement
- Slight shadow increase
- No exaggerated scaling

---

# Real QR Code Requirement

Use a real QR-code generator.

Example:

```html
<div class="real-qr" data-qr="https://rapiqr.example/s/KA01MJ9921"></div>
```

JavaScript should convert the value into an actual QR image/canvas.

Use realistic example URLs only.

Every QR shown in:
- Hero
- Product cards
- Platform visual
- Demo
- Use-case section

should be visually/scannably valid.

---

# Animation Rules

Use subtle animations only:

- Reveal-on-scroll
- Small hover translation
- Soft floating product animation
- QR ecosystem orbit
- Button hover
- Phone demo transitions

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Do not create distracting animations.

---

# Responsive Requirements

Desktop:
- Large two-column layouts
- Maximum content width around 1180px
- Large typography
- Premium whitespace

Tablet:
- Convert major grids to two columns
- Maintain visual hierarchy

Mobile:
- Single-column layout
- Compact navigation
- Hide secondary navigation links
- Product cards stack
- Pricing cards stack
- Phone mockup scales down
- Typography remains strong but fits viewport
- No horizontal scrolling

---

# UX Requirements

The landing page should immediately communicate:

1. What RapiQR is
2. Why it is useful
3. Why privacy matters
4. What products are available
5. How the QR system works
6. What happens after scanning
7. Pricing
8. Trust
9. How to purchase

Primary conversion action:

**Get a tag**

Secondary conversion action:

**See how it works**

---

# Quality Bar

The result must look like a real production SaaS/product website, not an AI-generated template.

Prioritize:
- Excellent spacing
- Consistent typography
- Strong visual hierarchy
- Realistic product mockups
- Real QR codes
- Clean interactions
- Responsive behavior
- Accessible buttons/links
- Semantic HTML
- Fast loading
- Minimal unnecessary code

Do NOT add:
- Fake logos
- Random partner logos
- Stock-photo-heavy sections
- Excessive emojis
- Random decorative text
- Unrelated features
- Fake AI features
- Unnecessary gradients
- Overly complex 3D effects

The final visual direction should feel like:

**Premium modern product website + safety technology + privacy-first brand + yellow/black identity + extremely clean light UI.**

The entire website must remain a **single landing page**.
