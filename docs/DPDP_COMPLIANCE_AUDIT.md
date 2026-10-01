# RepiQR — DPDP Act 2023 / DPDP Rules 2025 Compliance Audit

**Status:** Phase 1 deliverable — data inventory + gap analysis, produced from a full read of the codebase (frontend `src/`, backend `Server/`, deployment config) on 2026-09-26. No code has been changed yet. This document is the basis for deciding what to build next.

**How to read this:** Every item is marked one of:
- `IMPLEMENTED` — already technically in place, code-verified.
- `PARTIAL` — something exists but has a real gap.
- `MISSING` — not implemented.
- `REVIEW_REQUIRED` — needs a business/legal decision before any code is written (retention periods, DPA status, whether a purpose is "consent" vs "necessary for service", etc.). Nothing here is asserted as legally compliant — that determination is not something code changes alone establish.

---

## 0. Urgent items (independent of the DPDP timeline — fix regardless)

| # | Finding | Evidence | Why it matters |
|---|---|---|---|
| U1 | `keys/client_secreate.json` (looks like a Google OAuth client-secret credential) is **committed to git**, not in `.gitignore`, present since commit `7fd945c` | `git ls-files keys/`, `.gitignore` has no `keys/` entry | A credential in git history is exposed to anyone with repo access (and to GitHub/host if pushed) even after later deletion, until rotated + history purged. **Recommend: rotate the credential in Google Cloud Console, then add `keys/` to `.gitignore` and remove the file from the working tree; purging git history (BFG/filter-repo) is a separate, more disruptive step to discuss before doing.** |
| U2 | The public scan page (`ScanPage.tsx`) renders the owner's phone and emergency contacts (name/relationship/phone) **from a client-side `localStorage` cache** (`repiqr-qrlist`, `repiqr-client-stickers`) rather than exclusively from a scoped per-QR backend response | `src/components/scan/ScanPage.tsx:1096-1134, 2767-2799` | On a **shared/public device**, whatever stickers were previously viewed/owned on that browser remain cached — a later, unrelated visitor scanning a different sticker could have stale PII from an earlier session rendered or leak between sessions if the cache isn't correctly scoped per-QR-id. This is a data-minimization/security-safeguard issue, not just a paperwork one. Needs a focused look at `ScanPage.tsx`'s cache-read logic specifically. |
| U3 | Admin's real Gmail address is a **hardcoded constant in the frontend bundle** (`ADMIN_EMAIL = 'worthitellp@gmail.com'`) used for client-side role comparison | `src/lib/authService.ts:14` | Ships the site owner's personal email in shipped JS, inspectable by anyone. Server-side authorization should not depend on this constant either (confirm `verifyAdmin` doesn't trust a client-asserted role). |

---

## 1. Data inventory

Legend for **Lawful basis** column: `SERVICE` = necessary for the specific service the user asked for; `CONSENT` = should be gated on affirmative consent; `LEGAL` = needed to meet a legal obligation (security logs etc.); `REVIEW_REQUIRED` = not clearly one of these without a business decision.

### 1.1 Account / auth data

| Field | Example | Source | Purpose | Personal data? | Required? | Frontend | Backend API | DB (collection) | 3rd party | Retention | Lawful basis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| email | a@b.com | signup/Google | login identity, comms | Yes | Required | `AuthContext.tsx` | `/api/auth/*` | `User.email` | Resend/SMTP (delivery) | Account lifetime | SERVICE |
| password_hash | bcrypt hash | signup | authentication | Yes (security data) | Required (if no Google) | — | `authController.js` | `User.password_hash` (select:false) | — | Account lifetime | SERVICE |
| full_name | Jane Doe | signup/profile | display, comms | Yes | Optional | `AccountSettingsPanel` | `/api/auth/profile` | `User.full_name` | — | Account lifetime | SERVICE |
| phone_number | +91... | signup/OTP login | login, notifications | Yes | Optional/Required (phone-login) | `AuthContext` | `/api/auth/*` | `User.phone_number` | MSG91 (OTP delivery) | Account lifetime | SERVICE |
| google_id | sub claim | Google OAuth | login linkage | Yes | Optional | `AuthContext.tsx:79-98` | `authController.js:415-477` | `User.google_id` | Google | Account lifetime | SERVICE |
| last_login_ip / user_agent | IP/UA string | every login | new-device detection, security | Yes | N/A (system-generated) | — | `authController.js` | `User.last_login_*` (select:false) | — | REVIEW_REQUIRED (no TTL currently) | LEGAL |
| password_reset_token (hashed) | sha256 | forgot-password | one-time reset | Yes (security data) | N/A | — | `passwordResetService.js` | `User.password_reset_token` | — | 1 hour (expires) | SERVICE |
| OTP code (phone/email) | 6-digit | login/verification | verification | Yes (security data) | N/A | — | `phoneVerificationService.js`, `emailOtpService.js` | **in-memory Map, not DB** | MSG91 / email | 5 min | SERVICE |
| push subscription (endpoint+keys) | web-push object | notification opt-in | push notifications | Yes (device identifier) | Optional | `pushService` client | `/api/push/*` | `PushSubscription` | Browser push service (Google/Mozilla) | REVIEW_REQUIRED | CONSENT |

### 1.2 Sticker / owner data (the core product)

| Field | Example | Source | Purpose | Personal data? | Required? | Frontend | Backend API | DB | 3rd party | Public via QR? | Retention | Lawful basis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| owner name / assigned_to | Jane Doe | activation form | identify owner to finder | Yes | Required-ish | `ScanPage.tsx:804-821` | `/api/qr/:id/activate` | `Sticker.name/assigned_to` | — | **No** (excluded from `PUBLIC_QR_FIELDS`) | Until deletion | SERVICE |
| owner phone | +91... | activation form | contact owner in emergency | Yes | Required | `ScanPage.tsx` | `/api/qr/:id/activate` | `Sticker.details.ownerPhone` | MSG91/Twilio/Exotel/Cloudshope (masked-call layer) | **No directly** — masked call/WhatsApp bridge is the intended path (§0/U2 notes a leak risk via local cache) | Until deletion | SERVICE |
| owner email | a@b.com | activation form | optional contact | Yes | Optional | `ScanPage.tsx` | same | `Sticker.details.ownerEmail` | Resend/SMTP | No | Until deletion | SERVICE |
| address | full street address | activation form | emergency locating | Yes | Optional | `ScanPage.tsx` | same | `Sticker.details.address` | — | No | Until deletion | REVIEW_REQUIRED — is full address necessary, or would city/area suffice? |
| blood group | O+ | activation form | medical emergency info | **Yes — sensitive/health-adjacent** | Optional | `ScanPage.tsx` | same | `Sticker.details.bloodGroup` | — | Configurable public visibility | Until deletion | REVIEW_REQUIRED — health data warrants explicit, separate consent notice, not a bundled generic field |
| allergies | Penicillin | activation form | medical emergency info | **Yes — sensitive/health-adjacent** | Optional | `ScanPage.tsx` | same | `Sticker.details.allergies` | — | Configurable | Until deletion | REVIEW_REQUIRED (same as above) |
| emergency contacts (name/relationship/phone) | — | activation form | secondary contact in emergency | Yes | Optional (1 encouraged) | `ScanPage.tsx`, `EmergencyContactsPanel.tsx` | same | `Sticker.details.emergencyContacts[]` | MSG91 (notify on add) | Configurable | Until deletion | SERVICE |
| vehicle_number | KA01AB1234 | activation form | vehicle identification | Yes (linked to a person) | Conditional (vehicle category) | `ScanPage.tsx` | same | `Sticker.vehicle_number` | — | Yes (in `PUBLIC_QR_FIELDS`) | Until deletion | SERVICE |
| activation_code / recovery_code | printed secret | manufacturing | claim/recover sticker | No (not personal, but a security secret) | Required | — | `qrController.js` | `Sticker.recovery_code_hash` (hashed) | — | No (hash only stored server-side; raw code is printed, shown once at mint) | Until deletion | SERVICE |
| scans_count / last_scanned_at | — | every scan | usage stats | Borderline (device/behavior signal) | N/A | — | `/api/qr/:id/scan` | `Sticker.scans_count` | — | Yes | Until deletion | SERVICE |

### 1.3 Emergency / help / chat data

| Field | Source | Purpose | Personal data? | DB | Public? | Retention | Lawful basis |
|---|---|---|---|---|---|---|---|
| reporter_phone (optional) | Alert form (`/api/alerts`, public) | let owner call back a good Samaritan | Yes | `Alert.reporter_phone` | No | **MISSING — no TTL** (contrast: ServerLog 30d, AuditLog 180d auto-expire) | SERVICE |
| alert message text | Alert form | describe the emergency | Yes (can contain anything) | `Alert.message` | No | **MISSING — no TTL** | SERVICE |
| GPS lat/lng/accuracy (incl. live-tracking pings every 5s) | Alert form / live share | locate vehicle/person in emergency | Yes — precise location | `Alert` | No | **MISSING — no TTL** | SERVICE |
| chat message body + image attachments | RepiChat widget | visitor↔owner communication | Yes | `ChatMessage` | No (proxied, pseudonymous `customer_token`) | **MISSING — no TTL**; owner can hard-delete a session | SERVICE |
| customer_name, customer_token | Chat session start | pseudonymous chat identity | Yes (name) / No (token is opaque) | `ChatSession` | No | Tied to session lifetime, no auto-expiry | SERVICE |
| helpline/service-provider: phone, whatsapp, email, city, service_areas, years_experience | Partner/JoinUs application | list as a responder | Yes | `Communication` (helpline model) | **Yes — phone shown to scanning public if `active`** | Until deactivated/deleted | SERVICE (the provider consented by applying to be listed) |
| precise GPS via reverse-geocode | `JoinUsPage.tsx:161-192` | autofill service area | Yes | (autofills form field) | No | N/A | **REVIEW_REQUIRED** — sent to `api.bigdatacloud.net`, a foreign third party, with no notice at point of collection |

### 1.4 Commerce data

| Field | Source | Purpose | Personal data? | DB | 3rd party | Retention | Lawful basis |
|---|---|---|---|---|---|---|---|
| name, phone, email, full address, pincode | `CheckoutPage.tsx` | order fulfillment | Yes | `Order` | Shiprocket (shipping), Razorpay (payment) | REVIEW_REQUIRED (tax/invoicing law may require multi-year retention — legal input needed) | SERVICE |
| payment signature/order id | Razorpay checkout | payment verification | Transaction data | `Order`/payment records | Razorpay | Per Razorpay/финансовое requirement | SERVICE |

### 1.5 Security / logging / audit data

| Field | Source | Purpose | Personal data? | DB | Masking | Retention | Lawful basis |
|---|---|---|---|---|---|---|---|
| AuditLog (actor id/email, IP, UA, action, target) | every auth/admin action | security accountability | Yes | `AuditLog` (append-only, immutable) | Partial — sanitizer redacts secret-looking keys, masks phone/email patterns heuristically | 180 days (auto-expire index) | LEGAL |
| ServerLog (request metadata, error details) | app-wide `loggerMiddleware.js` | operational + security diagnostics | Sometimes (masked) | `ServerLog` | Regex/heuristic masking of phone/email/secret-named keys — **not a strict allowlist**, so a field named e.g. `patientAddress` would not be masked | 30 days (auto-expire index) | LEGAL |
| webhook raw body (msg91 OTP widget) | `webhookController.js:142` | debugging | Yes (may include phone/OTP metadata) | `ServerLog` via `logger.event(...req.body)` | **No — logs raw body unredacted** | 30 days | **gap — should route through the sanitizer, not raw** |

---

## 2. Third-party processor registry

| Processor | Data received | Purpose | Apparent region | DPA status |
|---|---|---|---|---|
| MSG91 | phone numbers, OTP codes, WhatsApp message content | OTP auth, transactional SMS/WhatsApp, emergency alerts | India | `DPA_STATUS = REVIEW_REQUIRED` |
| Twilio | visitor + owner/emergency-contact phone numbers, call metadata | masked call bridge (fallback), SMS/WhatsApp fallback | Foreign (US) | `DPA_STATUS = REVIEW_REQUIRED` |
| Exotel | visitor + owner phone numbers | masked call bridge | India | `DPA_STATUS = REVIEW_REQUIRED` |
| Cloudshope | target phone number | masked DID minting | India (presumed) | `DPA_STATUS = REVIEW_REQUIRED` |
| Shiprocket | name, address, pincode, email, phone, order items | shipping fulfillment | India | `DPA_STATUS = REVIEW_REQUIRED` |
| Razorpay | order amount, buyer name/email/phone | payment processing | India | `DPA_STATUS = REVIEW_REQUIRED` |
| Resend | recipient email, subject, body | transactional email | Foreign (US) | `DPA_STATUS = REVIEW_REQUIRED` |
| SMTP (deployer-configured) | same as above | fallback email | Depends on deployer | `DPA_STATUS = REVIEW_REQUIRED` |
| Google (OAuth + Fonts) | email, name, profile (OAuth); font requests (no PII) | login; typography | Foreign (US) | `DPA_STATUS = REVIEW_REQUIRED` (Google's standard terms apply; confirm which agreement covers this use) |
| api.bigdatacloud.net | raw GPS lat/long | reverse-geocode for JoinUsPage form | Foreign, unconfirmed | `DPA_STATUS = NOT_CONFIRMED` — **no contract/notice found in code at all** |
| S3-compatible storage (AWS S3 / R2 / B2 / MinIO — deployer-configured) | uploaded chat images, "compliance log archives" | file storage | Depends on deployer | `DPA_STATUS = REVIEW_REQUIRED` |

**No processor currently has a tracked DPA status, retention terms, or documented sub-processors anywhere in the codebase.** This registry should move into the admin Privacy dashboard once built (task section 43), not stay only in this file.

---

## 3. Gap analysis by theme

| Theme | Status | Detail |
|---|---|---|
| Password hashing | PARTIAL | bcrypt cost 10 (`Server/utils/passwords.js`). Functionally fine; OWASP suggests ≥12 or Argon2id. Not urgent, worth bumping. |
| OTP handling | PARTIAL | Phone/email OTP stored **in-memory plaintext** (not DB, so not a breach-at-rest risk, but also not hashed) with 5-min TTL, single-use, 5-attempt cap. `Math.random()` used for generation instead of a CSPRNG. |
| Recovery/activation codes | IMPLEMENTED | Sticker recovery codes are hashed (sha256/v2 HMAC-derived), never stored in plaintext, never returned except once at mint. Good. |
| Session/token revocation | MISSING | JWT is stateless, no blocklist/revocation. Logout doesn't invalidate the token; it's valid until natural expiry (7–30 days). |
| Admin RBAC | MISSING | Single flat `admin` role gated by one `ADMIN_EMAIL`/`ADMIN_PHONE`. No support/superadmin tiers, no field masking of phone/email for any admin viewer, most PII reads (list users, search stickers) are not audited (only destructive actions are). |
| Public QR data minimization | IMPLEMENTED | `PUBLIC_QR_FIELDS` whitelist already excludes owner PII from the public sticker-lookup API response. Good existing design. |
| Rate limiting | PARTIAL | Present on activation-OTP, restore, and alert-submission routes. **Absent** on sticker lookup/scan/activate, chat session creation, and helpline apply — enumeration/abuse risk. |
| Webhook auth | PARTIAL | WhatsApp webhook GET handshake and MSG91 OTP widget verification fail closed. The main WhatsApp POST signature check **fails open** (accepts unsigned payloads) if `WHATSAPP_APP_SECRET` is unset — a configuration-dependent gap, not a code bug, but should fail closed instead. |
| Frontend PII storage | MISSING SAFEGUARDS | Full sticker/owner records (including blood group, allergies, emergency contacts) cached in `localStorage`, not encrypted, not fully cleared on logout, no expiry. See U2 above for the more serious cross-session leak risk. |
| Consent management | MISSING | No consent data model, no versioned privacy-notice acceptance record, no purpose-specific consent APIs anywhere in the schemas. |
| Data principal rights (access/correction/erasure/export) | MISSING | No `/privacy/*` API surface exists. Account deletion exists (`accountDeletionService.js`) but is partial (see below); no self-service export, no grievance system, no nominee support. |
| Account deletion completeness | PARTIAL | Unlinks orders/stickers/distributor apps, hard-deletes chat history, deletes the User doc. Does **not** address: AuditLog rows referencing the deleted user (orphaned, retained — arguably correct for security logs, but undocumented as a deliberate retention exception), Alert records tied to that user's stickers, and there's no consent-record model to delete because none exists. Deletion is not transactional — a mid-failure can leave partial state. |
| Retention policy / automated cleanup | MISSING (mostly) | `AuditLog` (180d) and `ServerLog` (30d) have TTL indexes — good. `Alert`, `ChatMessage`, `ChatSession` have **no TTL and no cleanup job** despite holding GPS/message content/phone numbers. No central retention config exists (task section 45). |
| Security headers | PARTIAL | Helmet is applied but CSP is explicitly disabled (`contentSecurityPolicy: false`) and CORP is relaxed to `cross-origin`. CORS itself is a proper allowlist (not `*`), which is good. |
| Error handling | IMPLEMENTED | Production error handler returns a generic message; stack traces only go to server-side logs, not the client. |
| Object storage exposure | MISSING SAFEGUARD | `storageService.js` uploads with no ACL to a bucket documented as needing public-read; no signed URLs for chat images containing potentially sensitive photos. |
| Secrets in git | **URGENT — see U1** | `keys/client_secreate.json` committed and not gitignored. `.env` itself was never committed (correctly gitignored). |
| Children's data | REVIEW_REQUIRED | No age-gating or DOB collection exists anywhere (good — nothing to remove), but the public emergency scan page is by nature accessible to anyone including minors; no special handling exists or is obviously required given no child-specific data is collected. Flagging per task instructions as a REVIEW_REQUIRED item rather than asserting compliance. |
| Cross-border transfers | REVIEW_REQUIRED | Twilio, Resend, Google, and api.bigdatacloud.net appear foreign-hosted based on their API endpoints. No transfer register exists. DPDP does not require in-India storage by default — this needs a documented decision, not a code assumption. |
| Security incident workflow | MISSING | No `SecurityIncident` model, no admin incident page, no 72-hour-clock tracking. |
| Grievance mechanism | MISSING | No grievance form/ticketing model exists. |
| Privacy Notice | PARTIAL | `PrivacyPolicyPage.tsx` exists and mentions cookies/consent controls in prose, but it is a single narrative document, not versioned, not linked to consent records, and (per finding above) promises controls that don't exist in code yet. |

---

## 4. What this document is *not*

- It does not certify DPDP compliance. Nothing here should be represented to a customer, auditor, or regulator as "DPDP compliant" — several items are explicitly `REVIEW_REQUIRED` and need a business/legal call, not a code change.
- It does not yet propose the specific schema/API changes for consent, privacy-rights, retention jobs, or the security-incident/grievance systems (task sections 5–11, 23–27, 43–45) — that's the next phase, once priorities below are confirmed.

## 5. Suggested phasing (for discussion, not yet started)

1. **Fix now, independent of everything else:** rotate/remove the committed OAuth secret (U1), investigate and fix the scan-page localStorage cross-contamination risk (U2), stop shipping the admin's personal email in the client bundle (U3), make the WhatsApp webhook fail closed unconditionally.
2. **Foundational plumbing:** central privacy config (retention periods, consent purposes — task §45), a `Consent` model + `POST/GET /privacy/consent` APIs, retention TTLs on `Alert`/`ChatMessage`/`ChatSession`.
3. **User-facing rights:** `/privacy/me`, erasure request, data export, grievance form — the Data Principal rights surface (task §8, §25–27).
4. **Admin hardening:** field masking for phone/email, admin RBAC tiers, audit routine PII reads, not just destructive ones.
5. **Governance/paperwork-adjacent but still code-relevant:** processor DPA-status tracking in the admin dashboard, security-incident model, versioned privacy notice with acceptance records.

This phasing is a starting proposal, not a decision — the next step is to agree which phase(s) to actually implement in code.

---

## 6. Implementation log (2026-09-26)

Phases 1–3 above were implemented. Status per item — `TECHNICALLY IMPLEMENTED` or `LEGAL REVIEW REQUIRED`/`NOT DONE`, per task.md §49 (this is not a compliance certification):

**Phase 1 — urgent fixes**
- U1 (secret in git): `keys/client_secreate.json` untracked, `keys/` added to `.gitignore`. Git history still contains it — a history purge was explicitly declined for this pass; TECHNICALLY IMPLEMENTED (untrack only).
- U2 (scan-page localStorage leak): `getTowingContacts()` in `src/components/scan/ScanPage.tsx` no longer reads `repiqr-qrlist`/`repiqr-client-stickers`; owner contact fields now come only from the backend response for the currently-scanned sticker. TECHNICALLY IMPLEMENTED.
- U3 (admin email in bundle): `ADMIN_EMAIL` in `src/lib/authService.ts` no longer hardcodes the real address; falls back to a placeholder, overridable via `VITE_ADMIN_EMAIL`. TECHNICALLY IMPLEMENTED.
- WhatsApp webhook fail-open: `Server/controllers/webhookController.js.isSignatureValid` now fails closed unconditionally when `WHATSAPP_APP_SECRET` is unset. TECHNICALLY IMPLEMENTED.
- Retention TTLs: `Server/config/privacyConfig.js` centralizes retention periods; `Alert`, `ChatMessage`, `ChatSession` schemas now have TTL indexes. Periods are operational defaults — REVIEW_REQUIRED on the actual number of days.
- Recovery codes in browser storage (found during U2 investigation, more severe than originally scoped): `QrModel.getAll()` no longer returns `recovery_code` in the bulk admin fleet response at all. A new audited on-demand endpoint (`POST /api/admin/stickers/reveal-recovery-codes`) replaces it; `QrCodesPage.tsx`'s "See Codes" toggle and CSV export now fetch codes on demand instead of reading them out of the persisted fleet cache. TECHNICALLY IMPLEMENTED.

**Phase 2 — consent + privacy-rights APIs**
- Consent model + APIs: `Consent` schema, `POST/GET /api/privacy/consent`, `POST /api/privacy/consent/withdraw`. Only two purposes wired up (`marketing_communications`, `push_notifications`) — everything else in this product is SERVICE-basis, not consent-gated (see task.md §7). TECHNICALLY IMPLEMENTED.
- `GET/PATCH /api/privacy/me`, `GET /api/privacy/sharing` (processor registry), `POST /api/privacy/erasure-request` (auto-fulfills through the existing `deleteUserAccount` service since JWT auth already proves identity), `GET /api/privacy/export`, `POST /api/privacy/nominee`, `POST/GET /api/privacy/grievances`. Admin grievance queue: `GET/PATCH /api/admin/privacy/grievances`. TECHNICALLY IMPLEMENTED.
- Frontend: new "Privacy & Data" tab in the client dashboard (`PrivacyDataPanel.tsx`) — consent toggles, data export download, nominee form, grievance form + ticket list, erasure request. `AuthContext.deleteAccount()` now routes through `/privacy/erasure-request` instead of `/auth/me` so every self-service deletion leaves an audit trail. TECHNICALLY IMPLEMENTED.
- NOT DONE: Security incident/breach workflow (task.md §23–24) — not in the agreed phases for this pass. NOT DONE: full admin Privacy Dashboard UI (task.md §43) beyond the grievance queue endpoints — no admin-facing screen was built for it yet.

**Phase 3 — admin hardening**
- Field masking: `listUsers`, `getUserDetail`, `searchStickers` now mask phone/email by default (`maskPhone`/`maskEmail`, now exported from `loggerMiddleware.js`); `?reveal=true` returns raw values. The existing admin UI passes `reveal=true` today (single-admin reality — see below), so this is a masked-by-default *contract* more than a masked-by-default *UI* right now.
- Auditability: every list/detail/search/reveal call now writes an `ADMIN_ACCESS` (masked) or `PII_REVEALED` (raw) audit event — previously these routine reads were not audited at all.
- RBAC tiers (support vs superadmin): **NOT DONE, deliberately.** `authMiddleware.reconcileAdminRole` only ever grants the `admin` role to the single `ADMIN_EMAIL` account, and there is no endpoint to promote another account to a lesser admin tier — so a multi-tier permission system would have no one to apply it to today. Building it now would be speculative (task.md's own data-minimisation principle — don't build for hypothetical future need). Flagged as `REVIEW_REQUIRED`: confirm whether RepiQR will ever have more than one staff member needing scoped admin access before building this.

**Not attempted this pass** (explicitly out of the three agreed phases): security-incident/breach model, automated DELETE_ELIGIBLE cleanup job beyond the new TTL indexes (OTP/temp-session cleanup was already handled separately, in-memory), CSP re-enablement, automated privacy/security test suite (task.md §41), cross-border transfer register beyond the static `processorRegistry.js` file, DPA agreements with any vendor (business/legal action, not code).
