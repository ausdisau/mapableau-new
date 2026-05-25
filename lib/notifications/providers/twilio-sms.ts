export type TwilioSmsParams = {
  to: string;
  body: string;
};

export function isTwilioSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      (process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_MESSAGING_SERVICE_SID?.trim())
  );
}

function normalizeAuPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+61${digits.slice(1)}`;
  }
  if (digits.length >= 9 && phone.trim().startsWith("+")) {
    return phone.trim();
  }
  return null;
}

export async function sendTwilioSms(
  params: TwilioSmsParams
): Promise<{ ok: true; sid?: string } | { ok: false; error: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    return { ok: false, error: "TWILIO_NOT_CONFIGURED" };
  }

  const to = normalizeAuPhone(params.to);
  if (!to) {
    return { ok: false, error: "TWILIO_INVALID_PHONE" };
  }

  const bodyText = params.body.slice(0, 1500);
  const form = new URLSearchParams();
  form.set("To", to);
  form.set("Body", bodyText);
  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else if (from) {
    form.set("From", from);
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      code?: number;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.message ?? `TWILIO_HTTP_${res.status}`,
      };
    }

    return { ok: true, sid: data.sid };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "TWILIO_REQUEST_FAILED",
    };
  }
}
