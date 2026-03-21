export async function postToDiscordWebhook(
  content: string,
  opts?: { username?: string },
): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return; // optional

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content,
      username: opts?.username || "Uplat Leads",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText} ${body}`);
  }
}
