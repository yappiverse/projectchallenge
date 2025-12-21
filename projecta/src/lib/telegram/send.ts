"use server";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function truncate(s: string, max = 3800) {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

export async function sendIncidentToTelegram(
  botToken: string | undefined,
  chatId: string | undefined,
  subject: string,
  bodyText: string
) {
  if (!botToken) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN not set; skipping telegram send"
    );
    return;
  }
  if (!chatId) {
    console.warn("[telegram] TELEGRAM_CHAT_ID not set; skipping telegram send");
    return;
  }

  const url = `${TELEGRAM_API_BASE}/bot${encodeURIComponent(
    botToken
  )}/sendMessage`;

  const message = `*${escapeMarkdown(subject)}*\n\n${escapeMarkdown(
    truncate(bodyText)
  )}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[telegram] send error", res.status, body);
      throw new Error(`telegram API returned ${res.status}`);
    }

    console.log(`[telegram] sent incident to chat ${chatId}`);
  } catch (err) {
    console.error("[telegram] failed to send incident", err);
    throw err;
  }
}

function escapeMarkdown(text: string) {
  // Escape characters for MarkdownV2 according to Telegram requirements
  return text.replace(/([_\*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
