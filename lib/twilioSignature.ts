import crypto from "crypto";

// Twilio signature verification for application/x-www-form-urlencoded webhooks.
// Docs: https://www.twilio.com/docs/usage/security#validating-requests
export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  // Twilio requires params sorted by key, concatenated as key+value.
  const keys = Object.keys(params).sort();
  let data = url;
  for (const k of keys) data += k + params[k];

  return crypto.createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyTwilioRequest(opts: {
  authToken: string;
  expectedUrl: string;
  params: Record<string, string>;
  headerSignature: string | null;
}): boolean {
  const sig = opts.headerSignature;
  if (!sig) return false;
  const computed = computeTwilioSignature(opts.authToken, opts.expectedUrl, opts.params);
  return safeEqual(computed, sig);
}
