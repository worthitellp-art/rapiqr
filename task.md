Redesign the entire RepiQR admin dashboard and ALL existing pages using the attached reference design as the visual direction.

IMPORTANT:
- Do NOT use yellow as the primary UI color.
- Remove the current yellow highlight/background styling.
- Use a clean neutral SaaS dashboard style similar to the reference image.
- Keep RepiQR branding/logo, functionality, navigation structure, and existing features unchanged.
- Apply this design system consistently across EVERY page, modal, drawer, table, form, popup, empty state, and detail screen.

DESIGN SYSTEM

1. Overall Style
- Minimal, professional, modern SaaS dashboard.
- White / very light gray background.
- Black / charcoal primary text.
- Soft gray secondary text.
- Thin #E5E5E5 borders.
- Subtle shadows only where necessary.
- Rounded corners: 8–12px.
- Lots of whitespace.
- No gradients.
- No excessive decorative elements.
- No colorful cards unless required for status.
- Avoid oversized UI elements.
- Clean alignment and consistent spacing.

2. Font
Use ONE font everywhere:
- Inter
- Font weight:
  - 700: page titles
  - 600: section titles / card titles
  - 500: labels / navigation
  - 400: descriptions / secondary information
- Do not mix fonts.
- Keep typography compact and highly readable.

3. Color System
Primary:
- #111111 / near-black

Background:
- #FFFFFF
- #FAFAFA

Secondary text:
- #6B7280

Borders:
- #E5E7EB

Hover:
- #F5F5F5

Selected navigation:
- Light neutral gray only, NOT yellow.

Status colors should ONLY be used where meaningful:
- Success: green
- Warning: orange
- Error: red
- Info: blue

Do not use colors for decoration.

4. Sidebar
Create one consistent reusable sidebar across the entire application.

Structure:
- RepiQR logo at top.
- Navigation grouped into:
  FLEET
  - QR Codes
  - Orders
  - Distributors

  ENGAGEMENT
  - Communication
  - Message Manager
  - Alerts

  MANAGE
  - Users
  - Customization

  Bottom:
  - Settings
  - Organization/account card

Sidebar design:
- Width approximately 240–260px.
- White/light neutral background.
- Thin right border.
- Navigation height around 40–44px.
- 8px rounded corners.
- Active item uses a subtle #F3F4F6 background.
- Active icon and text use #111111.
- No yellow active state.
- Group headings should be small uppercase/light gray.
- Keep spacing consistent.
- Sidebar must remain visually stable on every page.

5. Icons
Use ONE icon library consistently throughout the application.

Preferred:
- Lucide React / Lucide React Native style icons.

Rules:
- Stroke-based icons only.
- 1.75–2px stroke.
- Size:
  - Navigation: 18px
  - Buttons: 17–18px
  - Table actions: 16px
  - Cards: 18–20px
- Do not mix filled icons with outlined icons.
- Do not use random icon sets.
- Every similar action must use the same icon everywhere.
- Use simple recognizable icons:
  QRCode, ShoppingBag, Store, Phone, Send, Bell, Users, Palette, Settings, Search, Plus, Eye, Edit, Trash, Download, Printer, RefreshCw, MoreHorizontal, ChevronDown, etc.

6. Header
Use the same reusable top header on every page:
- Quick Search input on the left.
- Right side:
  - active tag indicator
  - notification icon
  - + New button
  - organization/avatar
- Header height around 64–72px.
- White background.
- Bottom border.
- Minimal controls.
- Search input should be rounded but not excessively pill-shaped.
- Primary button should be black/dark instead of yellow.

7. Page Layout
Every page should follow:

Page title
Short description
Optional primary action

Then:
Cards / filters / tables / content

Use a consistent max-width and horizontal padding.

Example:
```text
Page Title
Small description                           Primary Action

[ filters / search / controls ]

[ content area ]










Integrate Razorpay Standard Web Checkout into this codebase.

=== CREDENTIALS ===

RAZORPAY_KEY_ID: rzp_live_Tb0h3JzdQEESt9
RAZORPAY_KEY_SECRET: ImeW0yLQNvacYzpfYuNP7scX

=== TASK ===

Detect the project stack and implement Razorpay Standard Checkout with:
1. Backend endpoint to create orders
2. Frontend checkout button with payment modal
3. Backend endpoint to verify payment signature

=== IMPLEMENTATION DETAILS ===

STEP 1: BACKEND - Create Order
- Endpoint: POST /api/create-order (or framework equivalent)
- Call Razorpay API: POST https://api.razorpay.com/v1/orders
- Request: { amount (paise), currency, receipt }
- Return: { order_id, amount, currency }
- Minimum amount: 100 paise

STEP 2: FRONTEND - Checkout
- Script: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
- On button click: call create-order, then open Razorpay modal with order_id
- On success: receive razorpay_payment_id, razorpay_order_id, razorpay_signature
- Send all three to verify endpoint

STEP 3: BACKEND - Verify Signature
- Endpoint: POST /api/verify-payment (or framework equivalent)
- Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
- Compare generated signature with razorpay_signature
- Return success only if signatures match

=== ENVIRONMENT SETUP ===

Create .env file:
RAZORPAY_KEY_ID=rzp_live_Tb0h3JzdQEESt9
RAZORPAY_KEY_SECRET=ImeW0yLQNvacYzpfYuNP7scX

Frontend framework prefixes (KEY_ID only, never KEY_SECRET):
- Next.js: NEXT_PUBLIC_RAZORPAY_KEY_ID
- Vite: VITE_RAZORPAY_KEY_ID
- CRA: REACT_APP_RAZORPAY_KEY_ID

Add .env to .gitignore.

=== SDK INSTALLATION ===

Node.js: npm install razorpay
Python: pip install razorpay
PHP: composer require razorpay/razorpay
Ruby: gem install razorpay
Go: go get github.com/razorpay/razorpay-go

=== OPERATION ORDER ===

Execute in this sequence:
1. Install dependencies first
2. Create .env file
3. Create or modify code files
4. Verify setup

=== ERROR HANDLING ===

Backend - Create Order:
- Validate amount >= 100 paise
- Handle Razorpay API errors (return 500)
- Handle auth failures (return 401)

Backend - Verify Signature:
- Signature mismatch: return 400, do NOT mark as paid
- Missing fields: return 400

Frontend:
- Handle modal dismiss (user cancelled)
- Handle payment.failed event
- Show error messages to user

=== EDGE CASES ===

If no backend framework detected:
- Stop and explain that Razorpay requires a backend for order creation
- Suggest serverless functions (Vercel/Netlify) or Razorpay Payment Links

If Razorpay already integrated:
- Do not duplicate code
- Only fix or complete missing parts

If static site only:
- Suggest adding serverless API routes
- Or suggest Razorpay Payment Links as alternative

=== REQUIREMENTS ===

- Never hardcode credentials in source files
- KEY_SECRET must never reach frontend code
- Use environment variables everywhere
- Follow existing code style in the project
- Do not create database tables unless project already has a database

=== REFERENCE ===

Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

=== OUTPUT ===

After completing integration:
1. List files created or modified
2. Explain how to test (e.g., start server, click pay button)
3. Note any manual steps required

Begin integration now.