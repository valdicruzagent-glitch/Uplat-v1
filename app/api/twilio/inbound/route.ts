import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { detectLanguage } from "@/lib/langDetect";
import { postToDiscordWebhook } from "@/lib/discordWebhook";
import { verifyTwilioRequest } from "@/lib/twilioSignature";

function buildSuggestedReply(lang: "en" | "es"): string {
  if (lang === "es") {
    return (
      "¡Gracias por escribir a Uplat! 😊 ¿Me compartes tu ciudad y tu presupuesto aproximado, y si buscas renta por mes o por noche?"
    );
  }
  return (
    "Thanks for reaching Uplat! What city are you looking in, your approximate budget, and are you looking for monthly or nightly rent?"
  );
}

export async function POST(req: Request) {
  // Twilio sends application/x-www-form-urlencoded
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // Verify Twilio signature (preferred)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature");

  // Use a fixed URL if provided (recommended), otherwise fall back to req.url.
  const expectedUrl = process.env.TWILIO_INBOUND_WEBHOOK_URL || req.url;

  const hasTwilioSigConfig = Boolean(authToken && expectedUrl);
  if (hasTwilioSigConfig) {
    const ok = verifyTwilioRequest({
      authToken: authToken!,
      expectedUrl,
      params,
      headerSignature: signature,
    });
    if (!ok) {
      // Optional shared-secret bypass for early environments.
      const shared = process.env.TWILIO_INBOUND_SHARED_SECRET;
      const got = req.headers.get("x-uplat-webhook-secret");
      if (!shared || !got || shared !== got) {
        return new NextResponse("invalid signature", { status: 403 });
      }
    }
  } else {
    // If signature verification isn’t configured yet, require the shared secret.
    const shared = process.env.TWILIO_INBOUND_SHARED_SECRET;
    const got = req.headers.get("x-uplat-webhook-secret");
    if (!shared || !got || shared !== got) {
      return new NextResponse("missing verification config", { status: 403 });
    }
  }

  const waFrom = params.From; // e.g. "whatsapp:+1555..."
  const waTo = params.To;
  const body = params.Body || "";
  const messageSid = params.MessageSid || params.SmsMessageSid || null;
  const profileName = params.ProfileName || null;

  if (!waFrom) return new NextResponse("missing From", { status: 400 });

  const lang = detectLanguage(body);
  const suggested = buildSuggestedReply(lang);

  const supabase = getSupabaseAdmin();

  // Upsert contact
  const now = new Date().toISOString();
  const { data: contact, error: contactErr } = await supabase
    .from("whatsapp_contacts")
    .upsert(
      {
        wa_from: waFrom,
        profile_name: profileName,
        last_message_at: now,
      },
      { onConflict: "wa_from" },
    )
    .select("id")
    .single();

  if (contactErr) {
    return NextResponse.json({ ok: false, error: contactErr.message }, { status: 500 });
  }

  // Insert inbound message (idempotent on twilio_message_sid when provided)
  // Keep meta minimal to reduce retention blast radius.
  const meta = {
    lang,
    twilio: {
      MessageSid: messageSid,
      SmsStatus: params.SmsStatus || params.MessageStatus || null,
      NumMedia: params.NumMedia || null,
    },
  };

  const insertPayload: Record<string, unknown> = {
    contact_id: contact.id,
    direction: "inbound",
    body,
    wa_from: waFrom,
    wa_to: waTo,
    meta,
  };

  if (messageSid) insertPayload.twilio_message_sid = messageSid;

  const { error: msgErr } = await supabase.from("whatsapp_messages").insert(insertPayload);
  if (msgErr) {
    // If duplicate sid, treat as ok.
    const maybeDup = msgErr.message?.toLowerCase().includes("duplicate") ||
      msgErr.code === "23505";
    if (!maybeDup) {
      return NextResponse.json({ ok: false, error: msgErr.message }, { status: 500 });
    }
  }

  // Notify Discord (best-effort)
  const includeBody = (process.env.DISCORD_LOG_INCLUDE_BODY || "false").toLowerCase() === "true";

  const maskPhone = (wa: string) => {
    // whatsapp:+50583882287 -> whatsapp:+505****2287
    const m = wa.match(/^(whatsapp:\+)(\d{1,3})(\d+)(\d{4})$/);
    if (!m) return "whatsapp:+[redacted]";
    const [, prefix, cc, mid, last4] = m;
    return `${prefix}${cc}${"*".repeat(Math.max(0, mid.length))}${last4}`;
  };

  const redactBody = (txt: string) => txt.slice(0, 280).replace(/\d{4,}/g, (s) => "*".repeat(s.length));

  const summary = [
    "NEW WHATSAPP LEAD",
    `From: ${maskPhone(waFrom)}${profileName ? ` (${profileName})` : ""}`,
    waTo ? `To: ${maskPhone(waTo)}` : null,
    `Lang: ${lang}`,
    includeBody ? `Message: ${redactBody(body || "")}` : "Message: (redacted)",
    `Suggested reply: ${suggested}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await postToDiscordWebhook(summary);
  } catch {
    // don’t fail the webhook for Discord issues
  }

  // Twilio expects 200. We are NOT auto-replying to the customer yet.
  return NextResponse.json({ ok: true });
}
