import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAbilityPayBillingPortalSession } from "@/lib/abilitypay/billing-portal-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayParticipantPlan: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/billing-core/config", () => ({
  billingCoreConfig: { appUrl: "https://app.example" },
}));

vi.mock("@/lib/billing-core/portal-service", () => ({
  createCustomerPortalSession: vi.fn(),
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const { createCustomerPortalSession } = await import(
  "@/lib/billing-core/portal-service"
);
const { logAbilityPayEvent } = await import("@/lib/abilitypay/audit");

describe("createAbilityPayBillingPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires participantId for plan managers", async () => {
    const result = await createAbilityPayBillingPortalSession({
      actorUserId: "pm1",
      actorRole: "plan_manager",
    });

    expect(result).toEqual({
      ok: false,
      error: "Participant is required for billing portal access",
      code: "NOT_APPLICABLE",
    });
  });

  it("rejects plan-managed funding models", async () => {
    vi.mocked(prisma.abilityPayParticipantPlan.findFirst).mockResolvedValue({
      fundingModel: "plan_managed",
    } as never);

    const result = await createAbilityPayBillingPortalSession({
      actorUserId: "p1",
      actorRole: "participant",
    });

    expect(result).toEqual({
      ok: false,
      error: "Saved cards are only available for self-managed and private-pay plans",
      code: "NOT_APPLICABLE",
    });
    expect(createCustomerPortalSession).not.toHaveBeenCalled();
  });

  it("opens portal for self-managed participants", async () => {
    vi.mocked(prisma.abilityPayParticipantPlan.findFirst).mockResolvedValue({
      fundingModel: "self_managed",
    } as never);
    vi.mocked(createCustomerPortalSession).mockResolvedValue({
      ok: true,
      portalUrl: "https://billing.stripe.com/session/ap",
    });

    const result = await createAbilityPayBillingPortalSession({
      actorUserId: "p1",
      actorRole: "participant",
      returnPath: "/abilitypay/payment-methods",
    });

    expect(createCustomerPortalSession).toHaveBeenCalledWith({
      userId: "p1",
      role: "participant",
      returnUrl: "https://app.example/abilitypay/payment-methods",
      createCustomerIfMissing: true,
    });
    expect(result).toEqual({
      ok: true,
      portalUrl: "https://billing.stripe.com/session/ap",
    });
    expect(logAbilityPayEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "abilitypay.billing_portal.opened",
        participantId: "p1",
      })
    );
  });

  it("maps Stripe-not-configured errors", async () => {
    vi.mocked(prisma.abilityPayParticipantPlan.findFirst).mockResolvedValue({
      fundingModel: "private_pay",
    } as never);
    vi.mocked(createCustomerPortalSession).mockResolvedValue({
      ok: false,
      error: "Stripe is not configured",
    });

    const result = await createAbilityPayBillingPortalSession({
      actorUserId: "p1",
      actorRole: "participant",
    });

    expect(result).toEqual({
      ok: false,
      error: "Stripe is not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
  });
});
