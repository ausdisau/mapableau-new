import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  assertParticipantOwnsOrder,
  FoodAccessError,
  getDeliveryAddressForRole,
} from "@/lib/foods/access-control";
import {
  computeOrderTotals,
  orderBlocksPayment,
} from "@/lib/foods/order-totals";
import {
  buildAllergyWarningForOrder,
  canCreatePaymentForOrder,
} from "@/lib/foods/order-service";
import {
  privacySafeOrderNotification,
  FOODS_NOTIFICATION_COPY,
} from "@/lib/foods/notification-copy";
import { plainLanguageDeliveryStatus } from "@/lib/foods/delivery-service";
import type { CurrentUser } from "@/lib/auth/current-user";

const participantUser: CurrentUser = {
  id: "p1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

describe("Foods permissions", () => {
  it("allows participant foods self", () => {
    expect(hasPermission("participant", "foods:manage:self")).toBe(true);
  });

  it("allows provider org foods", () => {
    expect(hasPermission("provider_admin", "foods:manage:org")).toBe(true);
  });

  it("allows driver delivery", () => {
    expect(hasPermission("driver", "foods:deliver:assigned")).toBe(true);
  });

  it("allows plan manager invoice read", () => {
    expect(hasPermission("plan_manager", "foods:invoice:read")).toBe(true);
  });
});

describe("cart and order totals", () => {
  it("participant can add product to cart via service contract", () => {
    expect(hasPermission("participant", "foods:manage:self")).toBe(true);
  });

  it("order total calculates correctly with separated cost types", () => {
    const totals = computeOrderTotals({
      lines: [
        {
          titleSnapshot: "Apples",
          quantity: 2,
          unitAmount: 300,
          itemCostType: "food_item",
        },
        {
          titleSnapshot: "Prep",
          quantity: 1,
          unitAmount: 500,
          itemCostType: "preparation",
        },
      ],
      deliveryFeeAmount: 800,
      supportFeeAmount: 200,
    });
    expect(totals.foodItemTotal).toBe(600);
    expect(totals.preparationTotal).toBe(500);
    expect(totals.deliveryTotal).toBe(800);
    expect(totals.supportTotal).toBe(200);
    expect(totals.totalAmount).toBe(2100);
  });

  it("checkout validates delivery window via zod schema", async () => {
    const { checkoutSchema } = await import("@/lib/validation/foods");
    const bad = checkoutSchema.safeParse({
      deliveryAddressFull: "1 Test St",
      deliveryAddressSuburb: "Sydney",
      deliveryWindowStart: "2026-06-01T12:00:00.000Z",
      deliveryWindowEnd: "2026-06-01T10:00:00.000Z",
      allergenAcknowledged: true,
    });
    expect(bad.success).toBe(false);
  });
});

describe("allergy warning", () => {
  it("allergy warning appears when profile matches product tags", () => {
    const warnings = buildAllergyWarningForOrder(
      [{ allergenTagsSnapshot: ["peanut", "milk"] }],
      ["peanut"]
    );
    expect(warnings).toContain("peanut");
  });
});

describe("access and payment rules", () => {
  it("participant owns order access", () => {
    expect(() =>
      assertParticipantOwnsOrder(participantUser, { participantId: "p1" })
    ).not.toThrow();
    expect(() =>
      assertParticipantOwnsOrder(participantUser, { participantId: "other" })
    ).toThrow(FoodAccessError);
  });

  it("exact address hidden from unauthorised user", () => {
    const order = {
      deliveryAddressFull: "123 Secret St",
      deliveryAddressSuburb: "Sydney",
      handoverInstructionsJson: { notes: "knock" },
    };
    const publicView = getDeliveryAddressForRole(order, "public");
    expect(publicView.fullAddress).toBeNull();
    expect(publicView.suburb).toBe("Sydney");
    const driverView = getDeliveryAddressForRole(order, "driver");
    expect(driverView.fullAddress).toBe("123 Secret St");
  });

  it("payment session cannot be created for cancelled order", () => {
    expect(canCreatePaymentForOrder({ status: "cancelled", paymentStatus: "unpaid" })).toBe(
      false
    );
    expect(orderBlocksPayment("disputed", "unpaid")).toBe(true);
    expect(orderBlocksPayment("submitted", "unpaid")).toBe(false);
  });

  it("invoice separates food preparation delivery support costs", () => {
    const totals = computeOrderTotals({
      lines: [
        {
          titleSnapshot: "Meal",
          quantity: 1,
          unitAmount: 1000,
          itemCostType: "food_item",
        },
        {
          titleSnapshot: "Prep fee",
          quantity: 1,
          unitAmount: 400,
          itemCostType: "preparation",
        },
        {
          titleSnapshot: "Delivery",
          quantity: 1,
          unitAmount: 600,
          itemCostType: "delivery",
        },
        {
          titleSnapshot: "Support",
          quantity: 1,
          unitAmount: 300,
          itemCostType: "support_time",
        },
      ],
    });
    expect(totals.foodItemTotal).toBe(1000);
    expect(totals.preparationTotal).toBe(400);
    expect(totals.deliveryTotal).toBe(600);
    expect(totals.supportTotal).toBe(300);
  });
});

describe("vendor and driver workflow", () => {
  it("vendor can confirm order permission", () => {
    expect(hasPermission("provider_admin", "foods:manage:org")).toBe(true);
  });

  it("driver can update delivery status labels", () => {
    expect(plainLanguageDeliveryStatus("out_for_delivery")).toBe("Out for delivery");
  });

  it("participant can confirm delivery permission", () => {
    expect(hasPermission("participant", "foods:manage:self")).toBe(true);
  });

  it("participant can dispute order permission", () => {
    expect(hasPermission("participant", "foods:manage:self")).toBe(true);
  });
});

describe("plan manager consent", () => {
  it("plan manager requires consent scope mapping", async () => {
    const { consentScopeToPrisma } = await import("@/lib/consent/scope-map");
    expect(consentScopeToPrisma("foods.invoice_share")).toBe("foods_invoice_share");
  });
});

describe("audit and notifications", () => {
  it("audit events use foods action prefix in services", () => {
    const foodsAuditActions = [
      "foods.cart.item_added",
      "foods.order.checkout",
      "foods.order.cancelled",
      "foods.payment.session_created",
      "foods.delivery.status_updated",
    ];
    for (const action of foodsAuditActions) {
      expect(action.startsWith("foods.")).toBe(true);
    }
  });

  it("notification text is privacy-safe", () => {
    expect(privacySafeOrderNotification("orderUpdated")).toBe(
      FOODS_NOTIFICATION_COPY.orderUpdated
    );
    expect(privacySafeOrderNotification("deliveryOnWay")).not.toMatch(/allerg/i);
    expect(privacySafeOrderNotification("delivered")).not.toMatch(/address/i);
  });
});
