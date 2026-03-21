import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type SendOpts = {
  to: string; // e.g. "whatsapp:+15551234567"
  body: string;
  meta?: Record<string, unknown>;
};

export async function sendWhatsAppMessage(opts: SendOpts): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid) throw new Error("Missing TWILIO_ACCOUNT_SID");
  if (!authToken) throw new Error("Missing TWILIO_AUTH_TOKEN");
  if (!from) throw new Error("Missing TWILIO_WHATSAPP_FROM");

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const bodyParams = new URLSearchParams();
  bodyParams.set("From", from);
  bodyParams.set("To", opts.to);
  bodyParams.set("Body", opts.body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: bodyParams,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `Twilio send failed: ${res.status} ${res.statusText} ${json ? JSON.stringify(json) : ""}`,
    );
  }

  const sid: string = json?.sid;

  // Best-effort logging (don’t fail delivery if logging fails)
  try {
    const supabase = getSupabaseAdmin();

    const waTo = opts.to;
    const { data: contact } = await supabase
      .from("whatsapp_contacts")
      .upsert({
        wa_from: waTo,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    await supabase.from("whatsapp_messages").insert({
      contact_id: contact?.id || null,
      direction: "outbound",
      body: opts.body,
      twilio_message_sid: sid,
      wa_from: from,
      wa_to: waTo,
      meta: opts.meta || {},
    });
  } catch {
    // ignore
  }

  return { sid };
}
