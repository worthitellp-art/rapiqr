-- RepiChat image attachments + delivery receipts.
-- Run this once in the Supabase SQL editor.
--
-- Not required for image upload to work: ChatModel probes for these columns once
-- and, when they're missing, falls back to carrying the image URL in `body`
-- (the client renders a bare image URL as a picture either way). Running this
-- upgrades those messages to carry real metadata — dimensions, so a bubble can
-- reserve the right space before the image loads instead of janking the
-- transcript, and the original filename for the download affordance.
--
-- The files themselves live in the public `chat-uploads` storage bucket, which
-- the server creates on first upload if it isn't there.

alter table public.chat_messages add column if not exists attachment_url text;
alter table public.chat_messages add column if not exists attachment_type text;
alter table public.chat_messages add column if not exists attachment_name text;
alter table public.chat_messages add column if not exists attachment_width integer;
alter table public.chat_messages add column if not exists attachment_height integer;

-- Second tick on a sent bubble: set when the recipient's socket is actually in
-- the room, which is what separates "sent" from "it reached their device".
alter table public.chat_messages add column if not exists delivered_at timestamptz;

-- An image-only message has no text. If `body` was declared NOT NULL, the empty
-- string still satisfies it, so nothing to change — but the transcript read is
-- always (session_id, created_at) and deserves the composite index.
create index if not exists chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at);
