-- Message Manager: tracks every SMS/WhatsApp send attempt via Twilio
-- (alerts, phone verification, sticker activation OTP). Run this once in the
-- Supabase SQL editor. Until this table exists, MessageModel degrades
-- gracefully (Server/models/messageModel.js) — sends still work, they just
-- aren't logged, and the admin Message Manager page shows empty/zero stats.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('sms', 'whatsapp')),
  to_number text,
  event text,
  status text not null check (status in ('sent', 'failed', 'simulated')),
  provider_sid text,
  error text,
  body_preview text
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_status_idx on public.messages (status);
create index if not exists messages_channel_idx on public.messages (channel);

-- Server writes with the service-role key (bypasses RLS), so RLS can stay
-- enabled with no public policies — same posture as server_logs.
alter table public.messages enable row level security;
