import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  captureDonationOrder,
  isPayPalConfigured,
  paypalNotConfiguredResponse,
} from "@/lib/paypal";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

type RouteContext = {
  params: Promise<{ orderID: string }>;
};

/**
 * Capture a PayPal order (Standard Checkout — OSM sample `/api/orders/:orderID/capture`).
 */
export async function POST(req: Request, context: RouteContext) {
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
    const { orderID } = await context.params;
    if (!orderID || !/^[A-Z0-9_-]+$/i.test(orderID)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const { jsonResponse, httpStatusCode } = await captureDonationOrder(orderID);
    return NextResponse.json(jsonResponse, { status: httpStatusCode });
  } catch (error) {
    console.error("Failed to capture PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture order." },
      { status: 500 },
    );
  }
}
