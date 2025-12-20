"use server";

const RESEND_API_URL = "https://api.resend.com/emails";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendIncidentSummaryEmail(
  to: string,
  subject: string,
  bodyText: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping email");
    return;
  }

  //   const from =
  //     process.env.RESEND_FROM ??
  //       `no-reply${process.env.NEXT_PUBLIC_HOSTNAME ?? "delivered@resend.dev"}`;
  const from =
    process.env.RESEND_FROM ?? "Berijalan Bot Logger <delivered@resend.dev>";

  const html = `<pre style=\"font-family:monospace;white-space:pre-wrap;\">${escapeHtml(
    bodyText
  )}</pre>`;

  const payload = {
    from,
    to,
    subject,
    html,
    text: bodyText,
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] resend API error", res.status, body);
      throw new Error(`resend API returned ${res.status}`);
    }

    console.log(`[email] sent incident summary to ${to}`);
  } catch (err) {
    console.error("[email] failed to send incident summary", err);
    throw err;
  }
}
