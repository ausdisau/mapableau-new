import { describe, expect, it, vi } from "vitest";

describe("fcm-service", () => {
  it("reports unconfigured when Firebase env vars are missing", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");

    const { isFcmConfigured } = await import("@/lib/notifications/fcm-service");
    expect(isFcmConfigured()).toBe(false);
  });

  it("reports configured when Firebase env vars are present", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "mapable-prod");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "firebase-adminsdk@mapable-prod.iam.gserviceaccount.com");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----");

    const { isFcmConfigured } = await import("@/lib/notifications/fcm-service");
    expect(isFcmConfigured()).toBe(true);
  });
});
