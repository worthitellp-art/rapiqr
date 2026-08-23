-- Service Providers: extends the existing `communication` helpline directory so a
-- provider can be matched by SERVICE TYPE and restricted to specific sticker
-- CATEGORIES. Run this once in the Supabase SQL editor.
--
-- Until it runs, HelplineModel degrades gracefully (Server/models/helplineModel.js):
-- it detects the missing columns, falls back to the legacy SELECT, and every
-- provider is then treated as "applies to all categories" with its service type
-- derived from the legacy `category` label. Nothing breaks — the scan page just
-- can't scope a provider to a subset of categories until the columns exist.
--
-- Backwards compatibility: `category` is NOT dropped. The bespoke car/bike scan
-- screen still reads it directly (getAdminContacts("Towing") etc.), so it stays
-- authoritative and `service_type` is derived from it for existing rows.

alter table public.communication add column if not exists service_type text;
alter table public.communication add column if not exists categories text[];

-- Backfill: derive the slug from the legacy label ("Flat Tire" -> "flat_tire").
update public.communication
   set service_type = lower(replace(replace(category, ' & ', '_'), ' ', '_'))
 where service_type is null
   and category is not null;

-- NULL / empty `categories` means "applies to every sticker category", which is
-- the right default for the rows that existed before this migration.
create index if not exists communication_service_type_idx on public.communication (service_type);
create index if not exists communication_active_idx on public.communication (active);
create index if not exists communication_categories_idx on public.communication using gin (categories);
