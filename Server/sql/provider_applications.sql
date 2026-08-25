-- Provider applications: the public "Join us" form on the landing page writes an
-- INACTIVE row into the same `communication` directory the admin already manages,
-- so an application shows up in Admin → Communication and goes live the moment
-- the admin flips it to Active. These columns carry the applicant's contact
-- details, which the directory never needed before.
--
-- Run this once in the Supabase SQL editor. It is self-contained: if the
-- `communication` table has never been created in this project, it creates it
-- with the full column set (which makes Server/sql/service_providers.sql a
-- no-op); if the table already exists, only the missing columns are added.
--
-- Until it runs, HelplineModel degrades gracefully (Server/models/helplineModel.js):
-- it detects the missing columns and drops them from every select/insert, so
-- applications still arrive — just without the email, city and notes the
-- applicant typed.

create table if not exists public.communication (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  category     text not null,
  label        text not null,
  phone        text not null,
  active       boolean not null default true,
  service_type text,
  categories   text[],
  email        text,
  city         text,
  notes        text
);

-- Also covers a `communication` table that predates these migrations.
alter table public.communication add column if not exists service_type text;
alter table public.communication add column if not exists categories text[];
alter table public.communication add column if not exists email text;
alter table public.communication add column if not exists city  text;
alter table public.communication add column if not exists notes text;

create index if not exists communication_service_type_idx on public.communication (service_type);
create index if not exists communication_active_idx       on public.communication (active);
create index if not exists communication_categories_idx   on public.communication using gin (categories);
