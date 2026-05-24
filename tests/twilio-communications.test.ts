import { describe, expect, it, vi, beforeEach } from "vitest";

import { parseInboundCommand, handleInboundCommand } from "@/lib/notifications/inbound-commands";
import {
  canSendOnChannel,
  isWithinQuietHours,
  notificationTypeForTemplate,
} from "@/lib/notifications/communication-preferences";
import {
  assertNoSensitiveContent,
  renderNotificationTemplate,
} from "@/lib/notifications/message-templates";
import { templateKeyForBookingStatus } from "@/lib/notifications/booking-triggers";
import { normalizePhoneE164 } from "@/lib/validation/communications";
import { validateTwilioWebhookSignature } from "@/lib/twilio/twilio-webhook-validator";
import { twilioConfig } from "@/lib/twilio/config";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    communicationPreference: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    phoneVerification: {
      findFirst: vi.fn(),
    },
    user: { findFirst: vi.fn() },
    inboundMessage: { create: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("twilio", async () => {
  const actual = await vi.importActual<typeof import("twilio")>("twilio");
  return {
    ...actual,
    validateRequest: vi.fn(),
  };
});

describe("communication preference checks", () => {
  it("maps template keys to notification types", () => {
    expect(notificationTypeForTemplate("booking_confirmed")).toBe("booking");
    expect(notificationTypeForTemplate("transport_arriving")).toBe("transport");
    expect(notificationTypeForTemplate("invoice_issued")).toBe("billing");
  });

  it("detects quiet hours within same-day window", () => {
    const now = new Date("2026-06-01T12:00:00+10:00");
    expect(
      isWithinQuietHours({
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        timezone: "Australia/Sydney",
        now,
      })
    ).toBe(false);
  });

  it("returns booking_confirmed template for confirmed status", () => {
    expect(templateKeyForBookingStatus("confirmed")).toBe("booking_confirmed");
    expect(templateKeyForBookingStatus("draft")).toBeNull();
  });
});

describe("message template rendering", () => {
  it("renders booking confirmation without sensitive terms", () => {
    const body = renderNotificationTemplate("booking_confirmed", {
      dateLabel: "1 Jun 2026, 9:00 am",
    });
    expect(body).toContain("MapAble");
    expect(body).toContain("HELP");
    expect(body).toContain("STOP");
    expect(body.toLowerCase()).not.toContain("ndis");
    expect(body.toLowerCase()).not.toContain("diagnosis");
  });

  it("rejects sensitive content in outbound text", () => {
    expect(() =>
      assertNoSensitiveContent("Your NDIS plan has been updated")
    ).toThrow("SENSITIVE_CONTENT_IN_SMS");
  });
});

describe("phone number validation", () => {
  it("normalizes Australian mobile to E.164", () => {
    const e164 = normalizePhoneE164("0412 345 678");
    expect(e164).toMatch(/^\+61/);
  });

  it("returns null for invalid numbers", () => {
    expect(normalizePhoneE164("abc")).toBeNull();
  });
});

describe("Twilio webhook signature validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns false when signature is missing", () => {
    expect(
      validateTwilioWebhookSignature({
        signature: null,
        url: "https://example.com/api/twilio/status",
        body: { MessageSid: "SM123" },
      })
    ).toBe(false);
  });
});

describe("inbound STOP handling", () => {
  it("parses STOP command", () => {
    expect(parseInboundCommand("stop")).toBe("STOP");
    expect(parseInboundCommand("STOP please")).toBe("STOP");
  });

  it("handles STOP by opting out preferences", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.communicationPreference.updateMany).mockResolvedValue({
      count: 3,
    });

    const result = await handleInboundCommand({
      userId: "user-1",
      fromE164: "+61412345678",
      command: "STOP",
      inboundMessageId: "in-1",
    });

    expect(result.handled).toBe(true);
    expect(prisma.communicationPreference.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ consentStatus: "opted_out" }),
      })
    );
  });
});

describe("preference channel gate", () => {
  it("denies send when no preference row", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.communicationPreference.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.phoneVerification.findFirst).mockResolvedValue(null);

    const result = await canSendOnChannel({
      userId: "user-1",
      channel: "sms",
      notificationType: "booking",
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("no_preference");
  });
});

describe("twilio config", () => {
  it("does not expose secrets in config object keys only", () => {
    expect(twilioConfig).toHaveProperty("accountSid");
    expect(Object.keys(twilioConfig)).not.toContain("TWILIO_AUTH_TOKEN");
  });
});
