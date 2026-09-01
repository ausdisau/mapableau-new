import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  isMobileAuthExchangeEnabled,
  mobileApiDisabledResponse,
  refreshMobileSession,
} from "@/lib/mobile";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, { windowMs: 60_000, max: 20 })
  ) {
    return NextResponse.json({ error: "Too many refresh attempts." }, { status: 429 });
  }

  if (!isMobileAuthExchangeEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }

  try {
    const body = (await req.json()) as { refreshToken?: string };
    if (!body.refreshToken) {
      return NextResponse.json(
        { error: "refreshToken is required." },
        { status: 400 },
      );
    }
    const result = await refreshMobileSession(body.refreshToken);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.session);
  } catch (error) {
    console.error("mobile auth refresh failed:", error);
    return NextResponse.json({ error: "Refresh failed." }, { status: 500 });
  }
}
