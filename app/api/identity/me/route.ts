import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { mapableIdConfig } from "@/lib/config/mapable-id";
import { resolveNextAuthSubject } from "@/lib/identity/adapters/mapable-nextauth-adapter";
import {
  buildIdentityMeSnapshot,
  containsForbiddenIdentityFields,
} from "@/lib/identity/mapable-id-service";
import { identityMeResponseSchema } from "@/lib/identity/mapable-id-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/identity/me — authenticated, read-only MapAbleID metadata.
 * Never trusts browser-supplied roles or MFA status.
 */
export async function GET() {
  if (!mapableIdConfig.dashboardEnabled) {
    return jsonError("MapAbleID dashboard is not enabled", 404);
  }

  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const subject = await resolveNextAuthSubject();
  if (!subject || subject.subjectId !== user.id) {
    return jsonError("Unable to verify session subject", 401);
  }

  const snapshot = await buildIdentityMeSnapshot({
    userId: user.id,
    displayName: user.name,
    primaryRole: user.primaryRole ?? null,
    sessionId: subject.sessionId,
    expiresAtMs: subject.expiresAtMs,
  });

  const parsed = identityMeResponseSchema.safeParse(snapshot);
  if (!parsed.success) {
    return jsonError("Identity snapshot failed validation", 500);
  }

  const forbidden = containsForbiddenIdentityFields(parsed.data);
  if (forbidden.length > 0) {
    return jsonError("Identity snapshot contained forbidden fields", 500);
  }

  return jsonOk(parsed.data);
}
