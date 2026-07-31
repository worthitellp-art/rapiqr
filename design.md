For a **consistent design system** across your entire dashboard (Dashboard, QR Codes, Alerts, Team, Settings, Activation Pages), use the same radius, spacing, and colour palette everywhere.

# 🎨 Brand Colors

| Purpose        | Color     |
| -------------- | --------- |
| Primary Yellow | `#FBBF24` |
| Primary Hover  | `#F59E0B` |
| Light Yellow   | `#FEF3C7` |
| Background     | `#F8FAFC` |
| White Card     | `#FFFFFF` |
| Border         | `#E5E7EB` |
| Heading        | `#111827` |
| Body Text      | `#475569` |
| Placeholder    | `#94A3B8` |

---

# 🔘 Border Radius

| Component       | Radius               |
| --------------- | -------------------- |
| Main Cards      | `rounded-3xl (24px)` |
| Small Cards     | `rounded-2xl (20px)` |
| Buttons         | `rounded-xl (16px)`  |
| Inputs          | `rounded-xl (16px)`  |
| Badges          | `rounded-full`       |
| Avatars         | `rounded-full`       |
| Icons Container | `rounded-2xl`        |
| Modal           | `rounded-3xl`        |

---

# 🟨 Primary Button

```
Background
#FBBF24

Hover
#F59E0B

Text
#111827

Radius
16px

Height
56px

Font
600

Shadow
shadow-md
```

Tailwind

```css
bg-yellow-400
hover:bg-amber-500
rounded-xl
h-14
font-semibold
shadow-md
```

---

# ⚪ Secondary Button

```
Background
White

Border
#E5E7EB

Text
#374151

Radius
16px

Hover
#F8FAFC
```

Tailwind

```css
bg-white
border
border-slate-200
rounded-xl
hover:bg-slate-50
```

---

# 🔴 Danger Button

```
Background
#FEF2F2

Text
#DC2626

Border
#FECACA

Radius
16px
```

---

# 🟢 Success Button

```
Background
#DCFCE7

Text
#15803D

Radius
16px
```

---

# 📝 Inputs

```
Height
56px

Radius
16px

Border
#E5E7EB

Focus
Yellow Border
Yellow Ring

Background
White
```

Tailwind

```css
h-14
rounded-xl
border
border-slate-200
focus:border-yellow-400
focus:ring-4
focus:ring-yellow-100
```

---

# 📦 Cards

```
Radius
24px

Background
White

Border
#E5E7EB

Shadow
shadow-sm
```

Tailwind

```css
rounded-3xl
bg-white
border
border-slate-200
shadow-sm
```

---

# 🏷 Status Badges

### Active

```
Background
#DCFCE7

Text
#15803D

Radius
999px
```

### Pending

```
Background
#FEF3C7

Text
#B45309

Radius
999px
```

### Inactive

```
Background
#F3F4F6

Text
#6B7280

Radius
999px
```

### Error

```
Background
#FEE2E2

Text
#DC2626
```

---

# ⭕ Icon Buttons

```
Size
40×40

Radius
12px

Background
White

Border
#E5E7EB

Hover
Yellow 50
```

Tailwind

```css
w-10
h-10
rounded-xl
border
border-slate-200
hover:bg-yellow-50
```

---

# 📏 Spacing Scale

| Item              | Value  |
| ----------------- | ------ |
| Card Padding      | `24px` |
| Section Gap       | `32px` |
| Input Gap         | `16px` |
| Button Gap        | `12px` |
| Table Row Padding | `20px` |

---

# ✨ Shadows

Small

```css
shadow-sm
```

Medium

```css
shadow-md
```

Large (Modals)

```css
shadow-xl
```

Avoid heavy shadows throughout the app.

---

# 📊 Typography

| Element         | Size | Weight |
| --------------- | ---- | ------ |
| Page Title      | 30px | 700    |
| Card Title      | 20px | 600    |
| Section Heading | 18px | 600    |
| Body            | 16px | 400    |
| Label           | 14px | 600    |
| Small Text      | 13px | 400    |
| Button          | 16px | 600    |

---

## ✅ Tailwind Design Tokens

```js
// Radius
rounded-xl   // 16px (buttons, inputs)
rounded-2xl  // 20px (small cards)
rounded-3xl  // 24px (main cards)
rounded-full // pills & avatars

// Primary
bg-yellow-400
hover:bg-amber-500

// Background
bg-slate-50

// Cards
bg-white
border
border-slate-200
shadow-sm

// Text
text-slate-900
text-slate-600
text-slate-400
```

Using these tokens consistently will give every page—Dashboard, QR Codes, Alerts, Team, Settings, Activation, and Profile—the same cohesive premium look without needing custom CSS.
