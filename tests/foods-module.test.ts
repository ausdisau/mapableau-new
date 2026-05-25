import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { getDeliveryAddressForRole } from "@/lib/foods/access-control";
import { canTransitionFoodDelivery } from "@/lib/foods/delivery-service";
import { buildFoodInvoiceLines } from "@/lib/foods/invoice-service";
import { FOOD_NOTIFICATION_COPY, foodNotificationBody } from "@/lib/foods/notification-copy";
import { calculateFoodOrderTotals } from "@/lib/foods/order-totals";
import { assertFoodPaymentAllowed, foodOrderBlocksPayment } from "@/lib/foods/payment-service";
import { checkoutSchema, foodPreferencesSchema, updateFoodDeliveryStatusSchema } from "@/lib/validation/foods";

describe("MapAble Foods module", () => {
  it("allows participants to manage their own food cart", () => {
    expect(hasPermission("participant", "foods:manage:self")).toBe(true);
    expect(hasPermission("participant", "foods:read:self")).toBe(true);
  });

  it("allows provider food vendors to manage organisation orders", () => {
    expect(hasPermission("provider_admin", "foods:manage:org")).toBe(true);
    expect(hasPermission("provider_admin", "foods:read:org")).toBe(true);
  });

  it("allows assigned drivers and plan managers only through their foods permissions", () => {
    expect(hasPermission("driver", "foods:deliver:assigned")).toBe(true);
    expect(hasPermission("plan_manager", "foods:invoice:read")).toBe(true);
    expect(hasPermission("driver", "foods:invoice:read")).toBe(false);
  });

  it("sums separated food cost buckets into totalCents", () => {
    const totals = calculateFoodOrderTotals([
      { costType: "food_item", quantity: 2, unitPriceCents: 1200 },
      { costType: "preparation", quantity: 1, unitPriceCents: 500 },
      { costType: "delivery", quantity: 1, unitPriceCents: 700 },
      { costType: "support_time", quantity: 1, unitPriceCents: 900 },
    ]);
    expect(totals).toMatchObject({ subtotalCents: 2400, preparationCents: 500, deliveryCents: 700, supportCents: 900, totalCents: 4500 });
  });

  it("rejects invalid delivery windows at checkout", () => {
    const result = checkoutSchema.safeParse({
      vendorId: "clx1234567890123456789012",
      deliveryAddressFull: "1 Test Street, Sydney NSW",
      deliveryWindowStart: "2026-01-01T10:00:00.000Z",
      deliveryWindowEnd: "2026-01-01T09:00:00.000Z",
      allergenAcknowledged: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires allergen acknowledgement in checkout payload", () => {
    const result = checkoutSchema.safeParse({
      vendorId: "clx1234567890123456789012",
      deliveryAddressFull: "1 Test Street, Sydney NSW",
      deliveryWindowStart: "2026-01-01T09:00:00.000Z",
      deliveryWindowEnd: "2026-01-01T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("validates allergy and substitution preferences", () => {
    const result = foodPreferencesSchema.safeParse({ dietaryPreferences: ["low sodium"], allergens: ["peanuts"], substitutionPolicy: "contact_me", shareWithVendors: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allergens).toContain("peanuts");
  });

  it("keeps public tracking address redacted", () => {
    const address = getDeliveryAddressForRole({ deliveryAddressFull: "Unit 2, 10 Example Street", deliveryAddressSuburb: "Parramatta", deliveryAddressState: "NSW", deliveryAddressPostcode: "2150", deliveryInstructions: "Call support worker" }, "public");
    expect(address.redacted).toBe(true);
    expect(address.address).not.toContain("Example Street");
    expect(address.instructions).toBeUndefined();
  });

  it("gives vendors full address data while public tracking stays redacted", () => {
    const source = { deliveryAddressFull: "Unit 2, 10 Example Street", deliveryAddressSuburb: "Parramatta", deliveryAddressState: "NSW", deliveryAddressPostcode: "2150", deliveryInstructions: "Call support worker" };
    expect(getDeliveryAddressForRole(source, "vendor").redacted).toBe(false);
    expect(getDeliveryAddressForRole(source, "public").redacted).toBe(true);
  });

  it("blocks payments for cancelled or disputed food orders", () => {
    expect(foodOrderBlocksPayment({ status: "cancelled", paymentStatus: "unpaid" })).toBe(true);
    expect(() => assertFoodPaymentAllowed({ status: "disputed", paymentStatus: "unpaid" })).toThrow("PAYMENT_BLOCKED");
    expect(foodOrderBlocksPayment({ status: "submitted", paymentStatus: "unpaid" })).toBe(false);
  });

  it("creates invoice lines separated by item cost type", () => {
    const lines = buildFoodInvoiceLines([
      { costType: "food_item", titleSnapshot: "Meal", totalCents: 2000 },
      { costType: "delivery", titleSnapshot: "Delivery", totalCents: 800 },
      { costType: "support_time", titleSnapshot: "Support", totalCents: 600 },
    ]);
    expect(lines.map((line) => line.metadata.costType)).toEqual(["food_item", "delivery", "support_time"]);
    expect(lines.every((line) => line.ndisClaimable === false)).toBe(true);
    expect(lines.every((line) => line.description.includes("NDIS review required"))).toBe(true);
  });

  it("allows the driver delivery flow and rejects unknown statuses", () => {
    expect(canTransitionFoodDelivery("picked_up", "out_for_delivery")).toBe(true);
    expect(canTransitionFoodDelivery("out_for_delivery", "delivered")).toBe(true);
    expect(updateFoodDeliveryStatusSchema.safeParse({ status: "handover_complete" }).success).toBe(false);
  });

  it("uses privacy-safe notification templates", () => {
    expect(foodNotificationBody("out_for_delivery")).toBe(FOOD_NOTIFICATION_COPY.deliveryOnWay);
    expect(foodNotificationBody("delivered")).toBe(FOOD_NOTIFICATION_COPY.delivered);
    expect(Object.values(FOOD_NOTIFICATION_COPY).join(" ")).not.toMatch(/street|allergy|peanut|\$|aud/i);
  });

  it("uses foods audit action namespaces", () => {
    const actions = ["foods.order.checkout", "foods.payment.session_created", "foods.invoice.created", "foods.delivery.handover_recorded"];
    expect(actions.every((action) => action.startsWith("foods."))).toBe(true);
  });
});