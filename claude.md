## File Reading Rules

* Always use the built-in `Read` tool when inspecting source files.
* Do NOT use Bash commands such as `cat`, `sed`, `head`, `tail`, or similar commands to read source files.
* Use `Read` with the appropriate line range when only part of a file is needed.
* Use `Grep` for searching for text or symbols.
* Use `Glob` for finding files.
* Use Bash only when a shell command is actually required for execution, testing, building, installing, or other terminal operations.
* Before modifying a file, use `Read` to inspect the relevant existing code.
* Prefer direct file tools over shell commands for file inspection.


Clean Up Strategy (Before & After)
Current UI Component	Proposed Clean Version
QR Code Fleet Management + Subtext paragraph	QR Fleet Management (No subtext description)
Orders + Track fulfillment description paragraph	Orders (Clean title heading)
Distributors & Partners + Review B2B franchise requests...	Distributors & Partners (No subtext description)
Message Manager + Every SMS & WhatsApp send attempted...	Message Log Manager (No subtext description)
Large Test OTP Widget (Live) box section	Moved to a separate tab or condensed into a single icon button




Act as an expert Senior UX/UI Engineer and Frontend Developer. I want to optimize and radically simplify the UI of my dashboard application ("RepiQR") to fix a problem where there is too much wordy, confusing, and unnecessary description text. 

I need you to refactor our dashboard code templates to maximize data density and make it clean. Please apply these 5 strict layout rules to our components:

1. REMOVE SUBTITLE PARAGRAPHS
Completely delete descriptive subtexts directly underneath page headers. For example:
- Remove: "Generate, print, and monitor scannable smart asset stickers across all categories."
- Remove: "Track fulfillment, manage records, and contact customers right from this list."
- Remove: "Review B2B franchise requests, verify partner credentials, and unlock Distributor Dashboards."
- Remove: "Every SMS & WhatsApp send attempted via Twilio—alerts, phone verification..."

2. CONDENSE UTILITY WIDGETS
In the Message Manager section, the "Test OTP Widget (Live)" takes up too much primary vertical space. Convert this testing form into a collapsible accordion panel (hidden by default) or encapsulate it inside a clean modal popup triggered by a "Test OTP" button.

3. OPTIMIZE CONTAINER BLOCKS
Ensure that when data tables or list grids are completely empty (e.g., "No orders yet" or "No messages logged yet"), the empty-state fallback illustrations are compact, taking up no more than 200px of height.

4. SIMPLIFY STATS CHIPS
Keep the primary analytics indicators (Active, Pending, Scans) strictly limited to their absolute values and a badge status, removing any micro-labels that repeat information present in the table headers.

5. PROVIDE THE REFACTORED COMPONENT CODE
Please output the updated structural code layout using [INSERT YOUR WEB FRAMEWORK, e.g., React with Tailwind CSS, Vue, or HTML/Bootstrap]. Ensure that all decorative paragraph tags (<p> or <span> subtitles) are deleted from the UI headers to give us a sleek, minimal, and professional enterprise administration look.




# DESIGN AGENT — Self-Improving Redesign Prompt
> Paste this whole file into any AI (Claude, ChatGPT, Gemini, Cursor, etc.).
> Then give it your design: screenshot, Figma link, HTML/code, or a description.
> It will research, redesign, review, compare, and update its own SKILLS section.

---

## 0. ROLE
You are a senior product designer + UX researcher.
You redesign what the user gives you so it looks better, works better, and says less.
You never stop at "good enough". You loop until the review score passes.

---

## 1. INPUT (ask only if missing — one question max)
- **Design**: screenshot / Figma / code / URL / description
- **Goal**: what should a user DO on this screen? (buy, sign up, call, scan…)
- **Audience**: who uses it, which country, which device (default: mobile-first)
- **Keep**: brand colors, logo, fonts, anything that must not change
- **Output**: code (HTML/React/Flutter), Figma steps, or design spec

If something is missing and not critical → assume it, write the assumption in one line, continue.

---

## 2. THE LOOP (run every step, in order)

### STEP 1 — AUDIT (current design)
Score the current design 1–10 on each row of the **Scorecard** (section 4).
List the top 5 problems only. One line each. Most harmful first.

### STEP 2 — RESEARCH ONLINE (if you have web/search access)
Search for:
1. Current UI/UX patterns for this exact type of screen (e.g. "pricing page UX 2026", "onboarding mobile best practice")
2. 3 competitor or best-in-class examples in the same industry
3. Accessibility rule that applies (WCAG contrast, tap size, etc.)

From research, extract **new skills** = short, reusable rules.
Format: `[SKILL] <rule in ≤15 words> — source: <site/brand>`
Only keep skills that are specific and actionable. Drop vague ones ("make it clean").

No web access? → Use your own knowledge, mark skills as `source: internal`.

### STEP 3 — UPDATE SKILLS (self-update)
- Add new skills to **Section 6: SKILLS MEMORY**.
- Remove any skill that conflicts with a newer, better-sourced one.
- Max 30 skills. If over, merge similar ones.
- Print the full updated Section 6 at the end so the user can paste it back into this file.

### STEP 4 — PLAN (before designing)
Write a compact plan:
- **Color**: 4–6 hex values with names and roles
- **Type**: 1–2 typefaces + size scale
- **Layout**: ASCII wireframe of the new screen
- **One bold idea**: the single memorable element. Everything else stays quiet.

Then self-check: *"Would I produce this same plan for any similar app?"*
If yes → change it to fit THIS brand and audience. Say what you changed in one line.

### STEP 5 — BUILD
Make the redesign in the requested output format.
Follow every rule in Sections 3, 5 and 6.

### STEP 6 — REVIEW & COMPARE
Score the new design on the same Scorecard. Show a **Before vs After** table:

| Area | Before | After | What changed (≤10 words) |
|---|---|---|---|

Then walk the main user task step by step (tap by tap). Count steps and words before vs after.

### STEP 7 — DECIDE
- Average After score **≥ 8.5** and no row below 7 → finish.
- Otherwise → fix the weakest 2 rows and repeat Steps 5–6.
- Max 3 rounds. After round 3, deliver the best version and list what's still weak.

---

## 3. LESS-TEXT RULES (strict)
- Headline ≤ 8 words. Subtext ≤ 18 words. Button ≤ 3 words.
- One idea per section. If a section needs a paragraph, use an icon, image, or number instead.
- Cut every word that doesn't help the user act or understand. Then cut once more.
- Buttons say what happens: "Get my sticker", not "Submit".
- Same action = same word everywhere (button "Activate" → toast "Activated").
- Plain words, sentence case, active voice. No hype ("revolutionary", "seamless", "next-gen").
- Your own explanations to the user: short bullets, no essays.

---

## 4. SCORECARD (1–10 each)
| Area | What 10 looks like |
|---|---|
| Clarity | User knows what this is and what to do in 3 seconds |
| Visual hierarchy | Eye goes: headline → key visual → main button |
| Text load | Minimum words, nothing repeated |
| Task flow | Main goal done in fewest taps, no dead ends |
| Mobile | Thumb-reachable buttons ≥ 44px, readable at 360px width |
| Accessibility | Contrast ≥ 4.5:1, focus states, alt text, not color-only meaning |
| Brand fit | Feels like THIS brand, not a template |
| Trust | Proof, safety, price, contact visible where doubt appears |
| Consistency | Same spacing, radius, colors, words throughout |
| Delight | One memorable moment, not ten noisy ones |

---

## 5. DESIGN RULES (always)
- Mobile-first. Then tablet, then desktop.
- Spacing on an 8px grid. Line length < 80 characters.
- Max 2 typefaces. Clear size scale.
- Spend boldness in one place. Remove one decoration before finishing.
- Motion only to show a change the user caused, or one intro moment. No fade-in on every section.
- Avoid template tells: ALL-CAPS labels over every heading, one coloured word in every headline, identical rounded cards with the same grey shadow, fake "01 / 02 / 03" numbers on non-steps, gradient blobs as decoration.
- Empty and error states tell the user what to do next. Errors are specific, never vague.
- Never break what the user said to keep.

---

## 6. SKILLS MEMORY (auto-updated — paste the newest version here)
<!-- The AI adds/edits skills here after each run. Newest wins on conflict. -->
- [SKILL] Primary button must be visible without scrolling on mobile — source: internal
- [SKILL] Show price or "free" near the main CTA to remove doubt — source: internal
- [SKILL] Use real product photos over illustrations when trust matters — source: internal
- [SKILL] Social proof (count, reviews, logos) sits right above the main CTA — source: internal
- [SKILL] Forms: ask only fields needed now; ask the rest later — source: internal

---

## 7. FINAL OUTPUT FORMAT
1. **Assumptions** (if any) — 1–3 lines
2. **Top 5 problems** — before
3. **Research skills found** — list
4. **Plan** — color, type, wireframe, bold idea
5. **Redesign** — code / spec / Figma steps
6. **Before vs After table** + task-step & word count
7. **Still weak** (if any)
8. **Updated Section 6** — ready to paste back



# CLAUDE.md — RepiQR Client Dashboard Redesign

## Mission
Restyle the existing RepiQR **client dashboard** (React.js, Cloudflare Workers) to match the reference design in `docs/design/repiqr-dashboard.html`, wire every menu item to a working route, then **commit and push**. Keep existing data, API calls and auth logic. Change only layout, styling and navigation.

## Execution rules (do not stop)
- Work autonomously until every item in the Checklist is done and pushed. Do not pause for confirmation or ask questions; make the most sensible decision and note it in the final summary.
- Stop only for a hard blocker (missing secret, failing external service). Report it plainly, then continue with everything unblocked.
- Never leave the build broken. After each step run build, lint and tests (whatever `package.json` defines) and fix failures before moving on.
- Do not touch `.env*`, secrets, `wrangler.toml` bindings or backend/API code.
- Do not add new colors, fonts or UI libraries beyond what is specified here.

## Git workflow
1. `git pull --rebase`, then `git checkout -b feat/dashboard-redesign`.
2. Commit after each checklist step: `feat(dashboard): <what changed>`.
3. `git push -u origin feat/dashboard-redesign` after every 2–3 commits and at the end.
4. Never force-push. Never push to `main`/`master` directly. Open a PR if `gh` is available.

## Design source of truth
Open `docs/design/repiqr-dashboard.html` (copy it into the repo first if missing). Match it pixel-for-pixel for layout, spacing and behavior. It runs full screen.

### Palette (do not change)
| Token | Value | Use |
|---|---|---|
| `--shell` | `#111111` | sidebar / outer shell |
| `--bg` | `#dfe2f0` | page background (mobile gutters) |
| `--panel` | `#ffffff` | main white panel |
| `--side` | `#f7f8fc` | right column |
| `--ink` | `#1b1e2e` | primary text |
| `--mute` | `#a0a5b8` | secondary text |
| `--line` | `#eef0f6` | dividers |
| `--chip` | `#f3f5fa` | chips, inputs |
| `--blue` | `#1a6bff` | active bar, links, badges |
| `--blue-soft` | `#cfe0fb` | inactive bars, icon tiles |
| `--green` | `#2ebd8e` | progress bars |
| Buttons | `#111111` bg, white text | primary CTA |
| Alert dot | `#e53935` | notification badge, logout |

Font: Inter (400–800). Light theme only; no dark mode, no orange.

### Layout
- Full viewport: `width:100%; height:100vh`, no outer padding or floating card.
- Grid: sidebar `280px` + main. Main is a white panel with `24px` radius and `14px` margin (top/right/bottom), containing center content (padding `40px 48px`) and a `340px` right column on **Home only**; other pages are single column.
- Sidebar: logo + CLIENT badge, user block (initial avatar with red unread badge, name, phone), menu text `17px / 600`, inactive `#5f6371`, active `#fff`, no section headings. Footer: Back to site, Log out (red).
- Mobile (≤900px): sidebar becomes a top bar with horizontally scrollable menu pills; right column stacks below content.

## Menu → routes (all must work, active state highlighted)
| Item | Route | Content |
|---|---|---|
| Home Overview | `/dashboard` | Welcome header, 14-day scan bars (last bar blue), Recent Scans, right column: My Safety Stickers, Latest chat, Add Emergency Responders card |
| Live Visitor Chat | `/dashboard/chat` | Existing chat inbox in the new style |
| Setup Guide | `/dashboard/setup` | Checklist with progress |
| Products | `/dashboard/products` | Sticker cards + Get free |
| Emergency Contacts | `/dashboard/contacts` | Add / remove list (use existing API) |
| Alert History | `/dashboard/alerts` | Scan and alert log, empty state |
| Account Settings | `/dashboard/account` | Name / phone form |
| Support & Help | `/dashboard/support` | FAQ accordion |

Top bar of every page: balance chip (`₹`), language selector, **Get Free Sticker** button, bell (links to Alert History).
Use the existing router; keep current route paths if they differ and map the menu to them.

## Checklist
- [ ] Add CSS variables/tokens above in the global stylesheet (or Tailwind theme)
- [ ] Build `DashboardShell` (sidebar + panel + conditional right column)
- [ ] Build `Sidebar` with active-route highlighting and mobile pill layout
- [ ] Rebuild Home: scan bars, Recent Scans, right column cards
- [ ] Restyle Chat, Setup, Products, Contacts, Alerts, Account, Support pages
- [ ] Connect real data (stickers, scans, contacts, balance) instead of placeholders
- [ ] Empty, loading and error states for every page
- [ ] Responsive check at 1440, 1024, 768 and 390 px widths
- [ ] Keyboard focus styles and `aria-label`s on icon-only buttons
- [ ] Build + lint + tests pass
- [ ] Push branch, open PR, post a short summary (what changed, decisions made, anything unfinished)

## Definition of done
Dashboard matches the reference visually at all breakpoints, every menu item routes correctly with real data, build is green, and the branch is pushed.