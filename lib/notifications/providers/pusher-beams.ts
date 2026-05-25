import { beamsUserInterest } from "@/lib/notifications/beams-interest";

export type PusherBeamsPublishParams = {
  userId: string;
  title: string;
  body: string;
  deepLink?: string;
};

export function isPusherBeamsConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_BEAMS_INSTANCE_ID?.trim() &&
      process.env.PUSHER_BEAMS_SECRET_KEY?.trim()
  );
}

export async function publishPusherBeamsToUser(
  params: PusherBeamsPublishParams
): Promise<{ ok: true; publishId?: string } | { ok: false; error: string }> {
  const instanceId = process.env.PUSHER_BEAMS_INSTANCE_ID?.trim();
  const secretKey = process.env.PUSHER_BEAMS_SECRET_KEY?.trim();
  if (!instanceId || !secretKey) {
    return { ok: false, error: "PUSHER_BEAMS_NOT_CONFIGURED" };
  }

  const interest = beamsUserInterest(params.userId);
  const deepLink =
    params.deepLink ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const url = `https://${instanceId}.pushnotifications.pusher.com/publish_api/v1/instances/${instanceId}/publishes/interests`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interests: [interest],
        web: {
          notification: {
            title: params.title.slice(0, 120),
            body: params.body.slice(0, 500),
            deep_link: deepLink,
          },
        },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      publishId?: string;
      error?: string;
      description?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.description ?? data.error ?? `PUSHER_BEAMS_HTTP_${res.status}`,
      };
    }

    return { ok: true, publishId: data.publishId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "PUSHER_BEAMS_REQUEST_FAILED",
    };
  }
}
