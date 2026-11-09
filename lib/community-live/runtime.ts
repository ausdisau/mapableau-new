import { NextResponse } from "next/server";

import { evaluateCommunityPilotAccess, validMutationOrigin } from "@/lib/community-live/policy";

/** Kept OFF until auth, DB migration, moderation, accessibility and rollback gates pass. */
export function communityPilotModeEnabled(): boolean {
  return process.env.MAPABLE_COMMUNITY_PILOT_MODE === "true";
}

export function communityLiveEnabled(): boolean {
  // Closed-pilot mode must never enable the live backend on a production Vercel deployment.
  if (communityPilotModeEnabled() && process.env.VERCEL_ENV === "production") return false;
  return process.env.MAPABLE_COMMUNITY_LIVE_ENABLED === "true";
}

export function communityPilotAccessGuard(user: { id: string } | null): Response | null {
  const decision = evaluateCommunityPilotAccess({
    pilotMode: communityPilotModeEnabled(),
    userId: user?.id,
    allowedIds: process.env.MAPABLE_COMMUNITY_PILOT_USER_IDS ?? "",
  });
  if (decision === "not_required" || decision === "allowed") return null;
  if (decision === "sign_in_required") {
    return communityNoStore({ error: "Sign in required for the protected pilot" }, 401);
  }
  return communityNoStore({ error: "This account is not invited to the protected pilot" }, 403);
}

export function communityNoStore(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function communityDisabled(): Response {
  return communityNoStore(
    { error: "Live MapAble Community is not enabled for this environment", code: "COMMUNITY_LIVE_DISABLED" },
    503,
  );
}

export function communityOriginGuard(request: Request): Response | null {
  if (validMutationOrigin(request)) return null;
  return communityNoStore({ error: "Invalid request origin", code: "INVALID_ORIGIN" }, 403);
}

export function communityInputError(error: unknown): Response {
  if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
    return communityNoStore({ error: "Submission too large" }, 413);
  }
  return communityNoStore({ error: "Invalid submission. Check the required fields." }, 400);
}
