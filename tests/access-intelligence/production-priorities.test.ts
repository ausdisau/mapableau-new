import { afterEach, describe, expect, it, vi } from "vitest";

import { getDefaultAdapters } from "@/lib/access-intelligence/adapters";
import {
  deliverApprovedVenueVerification,
  getMessagingAdapter,
  MockMessagingAdapter,
  WebhookMessagingAdapter,
} from "@/lib/access-intelligence/adapters/messaging";
import { clearAuditEventsForTests, listAuditEvents } from "@/lib/access-intelligence/audit";
import {
  checkEntitlement,
  mapBillingPlanCodeToAccessIntelligencePlan,
  pickHighestAccessIntelligencePlan,
  resolveAccessIntelligencePlan,
} from "@/lib/access-intelligence/entitlements";
import { AccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { priceIdForSubscriptionPlan } from "@/lib/stripe/config";

describe("Billing plan code → Access Intelligence entitlements", () => {
  it("maps ai_* BillingSubscriptionPlanCode values", () => {
    expect(mapBillingPlanCodeToAccessIntelligencePlan("ai_verify_starter")).toBe(
      "verify_starter",
    );
    expect(mapBillingPlanCodeToAccessIntelligencePlan("ai_enterprise")).toBe("enterprise");
    expect(mapBillingPlanCodeToAccessIntelligencePlan("provider_pro")).toBeNull();
  });

  it("picks the highest billed AI plan", () => {
    expect(
      pickHighestAccessIntelligencePlan(["verify_starter", "verify_portfolio", "community"]),
    ).toBe("verify_portfolio");
  });

  it("uses billing plan codes when resolving sync plan", () => {
    const plan = resolveAccessIntelligencePlan({
      userId: "u1",
      roles: ["participant"],
      planOverride: null,
      billingPlanCodes: ["ai_verify_operations"],
    });
    expect(plan).toBe("verify_operations");
    const decision = checkEntitlement({
      userId: "u1",
      roles: ["participant"],
      feature: "verify_incidents",
      billingPlanCodes: ["ai_verify_operations"],
    });
    expect(decision.allowed).toBe(true);
    expect(decision.source).toBe("billing_subscription");
  });

  it("does not invent Stripe price ids for AI plans", () => {
    expect(priceIdForSubscriptionPlan("ai_enterprise")).toBeNull();
    expect(priceIdForSubscriptionPlan("ai_verify_starter")).toBeNull();
  });
});

describe("Prisma repository factory flag", () => {
  afterEach(() => {
    delete process.env.ACCESS_INTELLIGENCE_USE_PRISMA;
    vi.resetModules();
  });

  it("exports PrismaAccessIntelligenceRepository class", async () => {
    const mod = await import("@/lib/access-intelligence/prisma-repository");
    expect(typeof mod.PrismaAccessIntelligenceRepository).toBe("function");
    expect(mod.isPrismaAccessIntelligenceEnabled()).toBe(false);
  });
});

describe("Trust Kernel messaging adapter", () => {
  afterEach(() => {
    delete process.env.ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL;
    clearAuditEventsForTests();
  });

  it("defaults to labelled mock messaging", () => {
    const adapter = getMessagingAdapter();
    expect(adapter.mock).toBe(true);
    expect(adapter).toBeInstanceOf(MockMessagingAdapter);
  });

  it("uses webhook adapter when URL configured", () => {
    process.env.ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL = "https://example.test/hook";
    const adapter = getMessagingAdapter();
    expect(adapter.mock).toBe(false);
    expect(adapter).toBeInstanceOf(WebhookMessagingAdapter);
  });

  it("rejects delivery without approval and writes cancel audit", async () => {
    await expect(
      deliverApprovedVenueVerification({
        userId: "user-1",
        placeId: "place-harbour-civic",
        placeName: "Harbour Civic Centre",
        questions: ["Is the toilet operational today?"],
        recipient: "venue-desk",
        purpose: "visit_verification",
        approved: false,
        approvalId: "appr-1",
        createRequest: async () => {
          throw new Error("should not create");
        },
      }),
    ).rejects.toBeInstanceOf(AccessIntelligenceError);

    const events = listAuditEvents("user-1");
    expect(events.some((e) => e.outcome === "cancelled")).toBe(true);
  });

  it("delivers after approval via mock adapter and audits", async () => {
    const result = await deliverApprovedVenueVerification({
      userId: "user-2",
      placeId: "place-harbour-civic",
      placeName: "Harbour Civic Centre",
      questions: ["Confirm Entrance B hours"],
      recipient: "venue-desk",
      purpose: "visit_verification",
      approved: true,
      approvalId: "appr-2",
      createRequest: async (args) => ({
        id: "req-1",
        status: "sent",
        ...args,
      }),
    });
    expect(result.requestId).toBe("req-1");
    expect(result.delivery.mock).toBe(true);
    expect(result.delivery.status).toBe("mock_only");
    const events = listAuditEvents("user-2");
    expect(
      events.some((e) => e.action === "request_venue_verification_delivered"),
    ).toBe(true);
  });

  it("wires BMS HTTP adapter when ACCESS_INTELLIGENCE_BMS_URL is set", () => {
    process.env.ACCESS_INTELLIGENCE_BMS_URL = "https://bms.example.test";
    const adapters = getDefaultAdapters();
    expect(adapters.bms.mock).toBe(false);
    expect(adapters.bms.id).toContain("bms-http");
    delete process.env.ACCESS_INTELLIGENCE_BMS_URL;
  });
});
