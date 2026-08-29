import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  exchangePasswordGrant,
  isMobileAuthExchangeEnabled,
  mobileApiDisabledResponse,
} from "@/lib/mobile";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

/**
 * POST /api/mobile/auth/exchange — MapAble-owned tokens after credential verify.
 * Google Credential Manager assertions use grantType=google (scaffold rejects until wired).
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
      { error: "Too many auth attempts. Please wait a minute." },
      { status: 429 },
    );
  }

  if (!isMobileAuthExchangeEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      grantType?: string;
      email?: string;
      password?: string;
      googleIdToken?: string;
    };

    const grantType = body.grantType ?? "password";

    if (grantType === "google") {
      return NextResponse.json(
        {
          error:
            "Google assertion exchange not yet enabled. Use password grant or wait for Credential Manager wiring.",
        },
        { status: 501 },
      );
    }

    if (grantType !== "password") {
      return NextResponse.json({ error: "Unsupported grantType." }, { status: 400 });
    }

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "email and password are required." },
        { status: 400 },
      );
    }

    const result = await exchangePasswordGrant({
      email: body.email,
      password: body.password,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.session);
  } catch (error) {
    console.error("mobile auth exchange failed:", error);
    return NextResponse.json({ error: "Auth exchange failed." }, { status: 500 });
  }
}
