import { NextResponse } from "next/server";
import { validMutationOrigin } from "@/lib/community-live/policy";

/** Kept OFF until auth, DB migration, moderation, accessibility and rollback gates pass. */
export function communityLiveEnabled(): boolean {
  return process.env.MAPABLE_COMMUNITY_LIVE_ENABLED === "true";
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
