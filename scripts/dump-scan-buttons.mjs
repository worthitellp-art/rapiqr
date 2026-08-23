import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const SRC = 'E:/Rapiqr/src/components/scan/categoryVariants.ts';
const OUT = 'E:/Rapiqr/SCAN_BUTTONS_ALL_CATEGORIES.md';

const ts = fs.readFileSync(SRC, 'utf8');
const js = esbuild.transformSync(ts, { loader: 'ts', format: 'esm' }).code;
const tmp = path.join(process.env.TEMP || '.', 'categoryVariants.gen.mjs');
fs.writeFileSync(tmp, js, 'utf8');

const mod = await import('file://' + tmp.replace(/\\/g, '/'));
const V = mod.CATEGORY_VARIANTS;
const BESPOKE = new Set(mod.BESPOKE_CATEGORIES);

/** Human-readable description of a VariantAction. */
function describe(a) {
  switch (a.kind) {
    case 'call':
      return `**call** → dials \`${a.number}\` (${a.who}) · via \`${a.via}\``;
    case 'notify':
      return a.text
        ? `**notify** → SMS + RepiChat to owner: "${a.text}"`
        : `**notify** → SMS + RepiChat to owner: *(uses the category default alert)*`;
    case 'maps':
      return `**maps** → Google Maps search: \`${a.query}\``;
    case 'pin':
      return `**pin** → shares live GPS with owner + emergency contacts`;
    case 'write':
      return `**write** → focuses the free-text composer`;
    case 'ask':
      return `**ask** → opens the RepiQR assistant`;
    default:
      return `**${a.kind}**`;
  }
}

const STYLE_NOTE = {
  primary: 'red',
  wa: 'green',
  blue: 'blue',
  ghost: 'white/outline',
};

let out = '';
const push = (s = '') => { out += s + '\n'; };

const keys = Object.keys(V);

push('# RepiQR — Every scan-page button, by sticker category');
push();
push('Generated from `src/components/scan/categoryVariants.ts` (the single source of truth for');
push('the data-driven scan pages) plus a hand-extracted appendix for the bespoke car/bike screen.');
push('Regenerate with `node scripts/dump-scan-buttons.mjs` — do not hand-edit sections 1-17.');
push();
push(`**${keys.length} categories** · each has 1 hero CTA + 3 mini buttons + 6 tiles × 3 buttons + 1 composer + 1 assistant button.`);
push();
push('## Action kinds');
push();
push('| kind | what the button actually does (`ScanPage.runVariantAction`) |');
push('| --- | --- |');
push('| `call` | `via: public` dials the number straight from the handset. `via: partner` / `via: support` ignore the printed number and resolve the admin-configured provider for that service (Communication page); if none is configured the button shows a "not configured yet" banner. |');
push('| `notify` | Posts a backend alert → SMS fan-out to the owner **and** their emergency contacts, and drops the same text into the visitor\'s RepiChat thread. |');
push('| `maps` | Opens a Google Maps search around the visitor\'s current pin. |');
push('| `pin` | Shares live GPS: opens Maps **and** dispatches an `emergency` alert to owner + emergency contacts. |');
push('| `write` | Scrolls to / focuses the free-text composer on the same screen. |');
push('| `ask` | Opens the AI assistant sheet. |');
push();
push('## Button styles');
push();
push('| style | colour |');
push('| --- | --- |');
for (const [k, v] of Object.entries(STYLE_NOTE)) push(`| \`${k}\` | ${v} |`);
push();

/* ---- Index ---- */
push('## Index');
push();
push('| # | Category key | Label | Module | Tone | Renderer |');
push('| --- | --- | --- | --- | --- | --- |');
keys.forEach((k, i) => {
  const v = V[k];
  push(`| ${i + 1} | \`${k}\` | ${v.label} | ${v.module} | ${v.tone} | ${BESPOKE.has(k) ? '**bespoke screen in ScanPage.tsx** (this data is unused)' : 'CategoryScanView' } |`);
});
push();
push('---');
push();

/* ---- Per category ---- */
keys.forEach((k, i) => {
  const v = V[k];
  push(`## ${i + 1}. \`${k}\` — ${v.label}`);
  push();
  if (BESPOKE.has(k)) {
    push(`> ⚠️ \`${k}\` is listed in \`BESPOKE_CATEGORIES\`, so ScanPage renders its own hard-coded screen`);
    push('> for it instead of `CategoryScanView`. The buttons below are the declared data, which is');
    push('> currently **not** what a visitor sees for this category.');
    push();
  }
  push('| | |');
  push('| --- | --- |');
  push(`| Module | ${v.module} |`);
  push(`| Tone | \`${v.tone}\` (${v.tone === 'red' ? 'red emergency hero' : 'amber calm hero'}) |`);
  push(`| Hero icon / beacon | \`${v.heroIcon}\` / \`${v.beacon}\` |`);
  push(`| Title | ${v.title} |`);
  push(`| Subtitle | ${v.sub} |`);
  push(`| Sample tagline | ${v.tagline} |`);
  push(`| Default owner alert | "${v.alert}" |`);
  push();

  push(`### Hero CTA (1 button)`);
  push();
  push('| Button | Action |');
  push('| --- | --- |');
  push(`| **${v.cta}** | ${describe({ kind: 'notify', text: v.alert })} |`);
  push();

  push(`### Mini stat buttons (${v.mini.length})`);
  push();
  push('| # | Button | Icon | Action |');
  push('| --- | --- | --- | --- |');
  v.mini.forEach((m, j) => {
    push(`| ${j + 1} | **${m.line1} ${m.line2}** | \`${m.icon}\` | ${describe(m.action)} |`);
  });
  push();

  push(`### Quick-action tiles (${v.tiles.length}) and their buttons`);
  push();
  v.tiles.forEach((t, j) => {
    push(`#### ${i + 1}.${j + 1} Tile — ${t.title} *(${t.sub})*`);
    push();
    push(`Icon \`${t.icon}\` · tint \`${t.tint}\``);
    push();
    push(`*${t.lead}*`);
    push();
    t.bullets.forEach((b) => push(`- ${b}`));
    push();
    push('| # | Button label | Style | Action |');
    push('| --- | --- | --- | --- |');
    t.actions.forEach((a, n) => {
      push(`| ${n + 1} | **${a.label}** | \`${a.style}\` | ${describe(a.action)} |`);
    });
    push();
  });

  push(`### Message-the-owner card`);
  push();
  push('| | |');
  push('| --- | --- |');
  push(`| Heading | ${v.owner} |`);
  push(`| Sub-heading | ${v.ownerSub} |`);
  push(`| Input placeholder | ${v.placeholder} |`);
  push(`| Send button | posts the typed text as a \`contact_owner\` alert (SMS to owner) and opens RepiChat |`);
  push();

  push(`### Assistant button`);
  push();
  push('| Button | Greeting |');
  push('| --- | --- |');
  push(`| **Ask the RepiQR Assistant** | ${v.aiHello} |`);
  push();
  push('Suggested questions inside the assistant:');
  push();
  v.ai.forEach(([q]) => push(`- ${q}`));
  push();
  push('---');
  push();
});

/* ---- Roll-up: every distinct button label across every category ---- */
push('## Appendix A — every distinct button label, alphabetical');
push();
const seen = new Map();
keys.forEach((k) => {
  const v = V[k];
  const add = (label, action, where) => {
    if (!seen.has(label)) seen.set(label, { action, where: [] });
    seen.get(label).where.push(`${k}/${where}`);
  };
  add(v.cta, { kind: 'notify', text: v.alert }, 'hero');
  v.mini.forEach((m) => add(`${m.line1} ${m.line2}`, m.action, 'mini'));
  v.tiles.forEach((t) => t.actions.forEach((a) => add(a.label, a.action, t.title)));
});
push(`${seen.size} distinct labels.`);
push();
push('| Button label | Kind | Used in |');
push('| --- | --- | --- |');
[...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([label, info]) => {
  push(`| ${label} | \`${info.action.kind}\` | ${info.where.join(', ')} |`);
});
push();

/* ---- Roll-up: every phone number referenced ---- */
push('## Appendix B — every phone number referenced');
push();
const nums = new Map();
keys.forEach((k) => {
  const v = V[k];
  const visit = (a, where) => {
    if (a.kind !== 'call') return;
    const key = `${a.number}|${a.who}|${a.via}`;
    if (!nums.has(key)) nums.set(key, { ...a, where: [] });
    nums.get(key).where.push(`${k}/${where}`);
  };
  v.mini.forEach((m) => visit(m.action, 'mini'));
  v.tiles.forEach((t) => t.actions.forEach((a) => visit(a.action, t.title)));
});
push('| Number | Who | via | Real? | Used in |');
push('| --- | --- | --- | --- | --- |');
[...nums.values()]
  .sort((a, b) => (a.via + a.number).localeCompare(b.via + b.number))
  .forEach((n) => {
    const real = n.via === 'public'
      ? 'yes — dialled as printed'
      : 'no — placeholder, replaced by the admin-configured provider at runtime';
    push(`| \`${n.number}\` | ${n.who} | \`${n.via}\` | ${real} | ${n.where.join(', ')} |`);
  });
push();

/* ---- Roll-up: counts ---- */
push('## Appendix C — counts per category');
push();
push('| Category | Buttons total | call/public | call/partner+support | notify | maps | pin | write | ask |');
push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
let grand = null;
keys.forEach((k) => {
  const v = V[k];
  const c = { total: 0, pub: 0, part: 0, notify: 0, maps: 0, pin: 0, write: 0, ask: 0 };
  const visit = (a) => {
    c.total++;
    if (a.kind === 'call') (a.via === 'public' ? c.pub++ : c.part++);
    else if (a.kind === 'notify') c.notify++;
    else if (a.kind === 'maps') c.maps++;
    else if (a.kind === 'pin') c.pin++;
    else if (a.kind === 'write') c.write++;
    else if (a.kind === 'ask') c.ask++;
  };
  visit({ kind: 'notify', text: v.alert });          // hero CTA
  v.mini.forEach((m) => visit(m.action));
  v.tiles.forEach((t) => t.actions.forEach((a) => visit(a.action)));
  visit({ kind: 'ask' });                             // assistant card
  push(`| \`${k}\` | ${c.total} | ${c.pub} | ${c.part} | ${c.notify} | ${c.maps} | ${c.pin} | ${c.write} | ${c.ask} |`);
  if (!grand) grand = { ...c };
  else Object.keys(c).forEach((x) => { grand[x] += c[x]; });
});
push(`| **all** | **${grand.total}** | ${grand.pub} | ${grand.part} | ${grand.notify} | ${grand.maps} | ${grand.pin} | ${grand.write} | ${grand.ask} |`);
push();

/* ---- Appendix D: the bespoke car/bike screen, hand-extracted from ScanPage.tsx ---- */
push(`## Appendix D — the bespoke \`car\` / \`bike\` screen (ScanPage.tsx)

\`car\` and \`bike\` are in \`BESPOKE_CATEGORIES\`, so their entries in sections 1 and 2
above are **dead data**. What a visitor actually sees is hard-coded JSX in
\`src/components/scan/ScanPage.tsx\` (lines ~1718–2730). Both categories share one screen —
there is no bike-specific copy. Extracted by hand; re-check against the source if it moves.

### D.1 Main menu (\`activeSubMenu === "none"\`)

Red hero card — title "This is Emergency or an accident", sub "We've detected an emergency or accident".

| Element | Type | Action |
| --- | --- | --- |
| **Share Live / Location** | ⚠️ static \`<div>\`, **not a button** | none — in \`CategoryScanView\` the same three are real buttons |
| **Notify / Contacts** | ⚠️ static \`<div>\`, **not a button** | none |
| **Request / Ambulance** | ⚠️ static \`<div>\`, **not a button** | none |
| **Get Help** | button (white pill) | opens the \`emergency-main\` sub-menu — ⚠️ does **not** send an alert, unlike the \`CategoryScanView\` hero CTA |

Quick Actions grid — 6 tiles, each only opens a sub-menu (no alert fires on the tile itself):

| # | Tile | Sub-label | Opens |
| --- | --- | --- | --- |
| 1 | **Tow Truck** | Roadside recovery | \`towing\` |
| 2 | **Mechanic** | On-site repair | \`mechanical\` |
| 3 | **Parking Issue** | first admin *Parking* helpline label, else "Blocking path" | \`parking\` |
| 4 | **Flat Tyre** | Tyre assistance | \`flat-tire\` |
| 5 | **Theft Alert** | first admin *Theft* helpline label, else "Report and alert" | \`theft\` |
| 6 | **Headlights** | first admin *Headlights* helpline label, else "are on" | \`headlights\` |

Below the grid:

| Button | Action |
| --- | --- |
| **RapiQR AI Assistant** (CHAT) | opens the assistant sheet |
| **Message Owner** | \`openChatWithMessage("Hi, I scanned your vehicle's RapiQR code and need to contact you.")\` — opens RepiChat and sends that line. **No SMS fan-out**, despite the card copy saying "The owner receives an SMS alert automatically" (the owner is SMS'd by the chat backend on first message instead). |
| *You're Protected / 24/7 Support strip* | ⚠️ static, not buttons |

Plus a floating FAB **Ask Assistant** (bottom-right, present for every category on the emergency phase).

### D.2 \`emergency-main\` — "Emergency Options"

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| **Request Ambulance** (one row per admin *Ambulance* helpline) | ⚠️ **disabled — "Soon"**. Empty state: "No ambulance provider configured". |
| **Call Family Members** | opens the \`family\` sub-menu (only rendered when family contacts exist) |
| **Share Location** | \`handleShareLocation()\` — opens Maps **and** posts an \`emergency\` alert to owner + emergency contacts |

### D.3 \`family\` — "Family Contacts"

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| **Share My Live Location** | \`handleShareLocation()\` |
| Owner's emergency-contact rows | number hidden, ⚠️ **disabled — "Soon"** |
| Admin *Family* helpline rows | label + phone shown, ⚠️ **disabled — "Soon"** |

### D.4 Service sub-menus — all six share one shape

Each is: Back · a tinted card with one RepiChat button · a masked "Vehicle Owner Call" row (disabled, "Soon") · the admin helplines for that category (label + phone, disabled, "Soon").

| Sub-menu | Card heading | Button label | \`sendQuickIssueAlert\` type | Message sent |
| --- | --- | --- | --- | --- |
| \`towing\` | Towing / Breakdown Recovery? | **Alert Owner via RepiChat** | \`Towing Service Needed\` | "Roadside breakdown / towing assistance requested for your vehicle." |
| \`mechanical\` | Need Mechanic Assistance? | **Alert Owner via RepiChat** | \`Mechanic Needed\` | "Vehicle mechanical issue reported. Mechanic assistance requested." |
| \`parking\` | Vehicle Blocking Path? | **Alert Owner via RepiChat** | \`Parking Issue\` | "Hi, your vehicle is blocking a path/driveway. Please move it as soon as possible." |
| \`flat-tire\` | Flat Tyre Detected? | **Alert Owner via RepiChat** | \`Flat Tyre\` | "Hi, noticed a flat tyre on your vehicle. Please check it." |
| \`theft\` | Suspicious Activity / Tampering? | **Send Emergency RepiChat Alert** | \`Theft Alert\` | "EMERGENCY: Someone reported suspicious activity or potential theft regarding your vehicle." |
| \`headlights\` | Headlights Left On? | **Alert Owner via RepiChat** | \`Headlights On\` | "Hi, your vehicle's headlights are left turned on. Please check them." |

Admin helpline category read by each: \`towing\`→Towing, \`mechanical\`→Mechanic, \`parking\`→Parking,
\`flat-tire\`→**Flat Tire** (note the US spelling in the admin list vs. "Tyre" in the UI copy),
\`theft\`→Theft, \`headlights\`→Headlights.

\`sendQuickIssueAlert\` posts a backend alert (SMS fan-out to owner + emergency contacts,
prefixed \`RapiQR Alert: <type>\` with the vehicle and a Maps pin) **and** opens RepiChat.

\`flat-tire\` has two extra buttons: **Take Photo** and **Upload Picture** (then **Change Photo**).
⚠️ The photo is only held in component state for preview — it is never attached to the alert or uploaded.

### D.5 \`medical\` — "Medical Options" (⚠️ dead code)

The block exists but **nothing sets \`activeSubMenu\` to \`"medical"\`**, so it is unreachable.

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| Admin *Ambulance* helpline rows | ⚠️ disabled — "Soon" |
| **First Aid Guide** | \`alert()\` popup with static first-aid text |
| **Nearby Hospital** | Google Maps search for hospitals around the visitor |

### D.6 Gaps vs. \`CategoryScanView\`

1. The three hero mini-stats are inert here, real buttons everywhere else.
2. **Get Help** only navigates; the variant hero CTA sends the owner alert.
3. Every call button on this screen is **disabled ("Soon")** — the Cloudshope masked-call bridge is wired up in \`openMaskedCall\`/\`fetchMaskedCallNumber\` but nothing on the car screen calls it.
4. Admin helpline numbers are printed in plain text here; \`CategoryScanView\` never shows a partner number, it only dials the resolved one.
5. The flat-tyre photo is captured but discarded.

### D.7 Admin helpline categories (Communication page)

\`Ambulance\` · \`Towing\` · \`Mechanic\` · \`Flat Tire\` · \`Battery\` · \`Fuel\` · \`Parking\` · \`Police\` · \`Theft\` · \`Headlights\` · \`Family\`

⚠️ \`Battery\`, \`Fuel\` and \`Police\` can be configured by the admin but no scan screen currently reads them.
`);

fs.writeFileSync(OUT, out, 'utf8');
console.log('wrote', OUT, out.length, 'chars,', out.split('\n').length, 'lines');
console.log('categories:', keys.length, '| distinct labels:', seen.size, '| total buttons:', grand.total);
