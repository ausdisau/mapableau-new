import { NextResponse } from "next/server";

import {
  isMobileApiEnabled,
  mobileApiDisabledResponse,
  verifyPlayIntegrityAttestation,
} from "@/lib/mobile";
import { requireMobileAccessToken } from "@/lib/mobile/require-mobile-session";

/**
 * POST /api/mobile/integrity/verify — Play Integrity signal only (Phase 15).
 * Never blocks ordinary Access/Care reads; never used for eligibility.
 */
export async function POST(req: Request) {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }

  const user = await requireMobileAccessToken(req);
  if (user instanceof Response) return user;

  try {
    const body = (await req.json()) as {
      attestationToken?: string;
      debugBypass?: boolean;
    };

    const result = verifyPlayIntegrityAttestation({
      attestationToken: body.attestationToken,
      debugBypass: body.debugBypass === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("integrity verify failed:", error);
    return NextResponse.json(
      {
        acceptable: true,
        reason: "verify_error_risk_fallback",
        enforced: false,
      },
      { status: 200 },
    );
  }
}
