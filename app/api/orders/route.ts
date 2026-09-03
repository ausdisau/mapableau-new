import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  createDonationOrder,
  isPayPalConfigured,
  paypalNotConfiguredResponse,
} from "@/lib/paypal";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

/**
 * Create a PayPal order (Standard Checkout — OSM sample `/api/orders`).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json(paypalNotConfiguredResponse(), { status: 503 });
  }

  try {
    // Cart from the client is accepted for API compatibility with the OSM sample;
    // amount is always taken from server-side paypalConfig.
    await req.json().catch(() => ({}));
    const { jsonResponse, httpStatusCode } = await createDonationOrder();
    return NextResponse.json(jsonResponse, { status: httpStatusCode });
  } catch (error) {
    console.error("Failed to create PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
