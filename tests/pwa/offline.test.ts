import { describe, expect, it } from "vitest";

import {
  canCacheContentType,
  isSensitiveApiPath,
  OFFLINE_DENIED_CONTENT_TYPES,
} from "@/lib/offline/offline-policy";

describe("offline policy", () => {
  it("denies sensitive content types by default", () => {
    expect(canCacheContentType("ndis_plan")).toBe(false);
    expect(canCacheContentType("clinical_notes")).toBe(false);
    expect(canCacheContentType("private_message")).toBe(false);
  });

  it("allows safe shell and draft types", () => {
    expect(canCacheContentType("app_shell")).toBe(true);
    expect(canCacheContentType("form_draft")).toBe(true);
  });

  it("flags sensitive API paths", () => {
    expect(isSensitiveApiPath("/api/invoices/123")).toBe(true);
    expect(isSensitiveApiPath("/api/messages/conversations")).toBe(true);
    expect(isSensitiveApiPath("/api/calendar/events")).toBe(false);
  });

  it("lists denied types for audits", () => {
    expect(OFFLINE_DENIED_CONTENT_TYPES).toContain("invoice");
  });
});

describe("notification redaction", () => {
  it("redacts sensitive notification text", async () => {
    const { redactNotificationBody } = await import(
      "@/lib/notifications/push-subscription-service"
    );
    expect(redactNotificationBody("messages", "anything")).toBe(
      "You have a new MapAble message."
    );
    expect(
      redactNotificationBody("custom", "NDIS plan budget exceeded")
    ).toBe("You have a new MapAble notification.");
  });
});
