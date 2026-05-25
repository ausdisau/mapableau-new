export type AgentMailSendParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function isAgentMailConfigured(): boolean {
  return Boolean(
    process.env.AGENTMAIL_API_KEY?.trim() &&
      process.env.AGENTMAIL_INBOX_ID?.trim()
  );
}

export async function sendAgentMailEmail(
  params: AgentMailSendParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.AGENTMAIL_API_KEY?.trim();
  const inboxId = process.env.AGENTMAIL_INBOX_ID?.trim();
  if (!apiKey || !inboxId) {
    return { ok: false, error: "AGENTMAIL_NOT_CONFIGURED" };
  }

  const html =
    params.html ??
    `<p>${escapeHtml(params.text).replace(/\n/g, "<br />")}</p>`;

  try {
    const res = await fetch(
      `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html,
          labels: ["mapable-notification"],
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        error: `AGENTMAIL_HTTP_${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "AGENTMAIL_REQUEST_FAILED",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
