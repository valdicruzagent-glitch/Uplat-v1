# WhatsApp (Twilio) inbound for Uplat — runbook

## 1) Create Supabase tables

In Supabase SQL editor, run:

- `supabase/sql/whatsapp_tables.sql`

## 2) Set environment variables (Vercel + local)

### Required for the inbound webhook (server-side)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_INBOUND_WEBHOOK_URL` (recommended — must exactly match the URL configured in Twilio)

### Optional but recommended

- `TWILIO_ACCOUNT_SID` + `TWILIO_WHATSAPP_FROM` (needed only for outbound helper)
- `DISCORD_WEBHOOK_URL` (posts to #leads via a webhook)

### Temporary fallback (only if signature validation is not working yet)

- `TWILIO_INBOUND_SHARED_SECRET`
  - If set, you can also send header `x-uplat-webhook-secret: <secret>` to bypass signature failures.
  - If signature verification is not configured, this shared secret is required.

## 3) Configure Twilio WhatsApp webhook

Twilio Console → Messaging → (WhatsApp Senders / your WhatsApp sender) → When a message comes in:

- Method: `POST`
- URL: `https://<your-vercel-domain>/api/twilio/inbound`

Important:
- If you set `TWILIO_INBOUND_WEBHOOK_URL`, it must match this URL exactly (protocol + host + path).

## 4) What happens on inbound messages

- Validates webhook (Twilio signature preferred)
- Upserts `whatsapp_contacts` using `From`
- Inserts a row into `whatsapp_messages` (direction: `inbound`)
- Detects language (en/es) and stores it in `meta.lang`
- Posts a Discord notification (if `DISCORD_WEBHOOK_URL` is set)
- Does **not** auto-reply to the customer

## 5) Outbound helper

Use `sendWhatsAppMessage()` from `lib/twilioWhatsApp.ts` to send via Twilio and (best-effort) log an outbound message.
