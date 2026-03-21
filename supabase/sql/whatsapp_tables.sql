-- WhatsApp inbound/outbound logging for Uplat (V1.5)
-- Run in Supabase SQL editor.

-- Enable for UUID generation if not already enabled
create extension if not exists pgcrypto;

create table if not exists public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_from text not null unique,
  profile_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound')),
  body text,
  wa_from text,
  wa_to text,
  twilio_message_sid text unique,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_contact_id_created_at_idx
  on public.whatsapp_messages (contact_id, created_at desc);

-- Keep updated_at fresh
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_whatsapp_contacts_updated_at on public.whatsapp_contacts;
create trigger set_whatsapp_contacts_updated_at
before update on public.whatsapp_contacts
for each row execute function public.set_updated_at();
