-- Uplat V1: WhatsApp verification fields
begin;

alter table public.profiles
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_verified boolean not null default false,
  add column if not exists whatsapp_verified_at timestamptz;

-- Index for quick lookup by number (optional, for deduplication)
create index if not exists profiles_whatsapp_number_idx on public.profiles(whatsapp_number);

commit;