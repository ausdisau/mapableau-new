import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as createOrder } from "@/app/api/orders/route";

vi.mock("@/lib/api/ip-rate-limit", () => ({
  checkIpRateLimit: () => true,
  getClientIp: () => "127.0.0.1",
}));

vi.mock("@/lib/paypal", () => ({
  isPayPalConfigured: vi.fn(),
  paypalNotConfiguredResponse: () => ({
    configured: false,
    error: "PayPal not configured",
  }),
  createDonationOrder: vi.fn(),
}));

import {
  createDonationOrder,
  isPayPalConfigured,
} from "@/lib/paypal";

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when PayPal credentials are missing", async () => {
    vi.mocked(isPayPalConfigured).mockReturnValue(false);

    const response = await createOrder(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: [] }),
      }),
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.configured).toBe(false);
  });

  it("creates an order when PayPal is configured", async () => {
    vi.mocked(isPayPalConfigured).mockReturnValue(true);
    vi.mocked(createDonationOrder).mockResolvedValue({
      jsonResponse: { id: "ORDER123" },
      httpStatusCode: 201,
    });

    const response = await createOrder(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: [{ id: "donation", quantity: "1" }],
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("ORDER123");
    expect(createDonationOrder).toHaveBeenCalledOnce();
  });
});
