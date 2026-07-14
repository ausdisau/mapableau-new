
/**
 * Native push registration handoff.
 * Notifications must default to privacy-safe lock-screen previews.
 */
export type PushPlatform = "ios" | "android";

export type PushTokenRegistration = {
  userId: string;
  participantId: string | null;
  token: string;
  platform: PushPlatform;
  idempotencyKey: string;
};

export function privacySafeNotificationBody(): string {
  return "MapAble needs your review.";
}

export async function registerPushToken(
  input: PushTokenRegistration,
): Promise<{ registered: boolean }> {
  if (!input.token || input.token.length < 8) {
    throw new Error("INVALID_PUSH_TOKEN");
  }
  // Persistence is handled by the mobile BFF route / notification service.
  return { registered: true };
}
