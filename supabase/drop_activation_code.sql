-- ============================================================================
-- DROP: public.qr_codes.activation_code
-- ============================================================================
-- The system now links a sticker to a dashboard account purely by phone number
-- (set during first-scan activation on the public scan page — see
-- ProductModel.autoClaimByPhone). The admin-generated ACT####XXX "activation
-- code" never gated the customer flow (it silently fell back to the QR's own
-- ID) and was only ever a redundant label in the admin fleet dashboards
-- (CSV export, search, "Code:" badge) — removed from all of that code too.
--
-- Run this once against your Supabase project (SQL Editor or `psql`) after
-- deploying the code changes that stop reading/writing this column.
-- ============================================================================

ALTER TABLE public.qr_codes DROP COLUMN IF EXISTS activation_code;
