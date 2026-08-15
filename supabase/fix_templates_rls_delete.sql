-- Fix: deleting a sticker template silently did nothing.
-- public.templates has RLS enabled with SELECT/INSERT/UPDATE policies but no
-- DELETE policy, so every DELETE matched 0 rows (no Postgres error — RLS just
-- filters rows out) and the app's catch block masked it as success. The
-- template reappeared on next load because it was never actually removed.
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.templates;
CREATE POLICY "Anyone can delete templates" ON public.templates FOR DELETE USING (true);
