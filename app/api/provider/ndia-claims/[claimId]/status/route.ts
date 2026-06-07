import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { refreshProviderClaimStatus } from "@/lib/ndia-provider-claiming/claim-service";
import { NdiaApiError } from "@/lib/ndia/shared/ndia-errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;
  const { claimId } = await params;

  try {
    const result = await refreshProviderClaimStatus(claimId, user);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "NOT_FOUND") return jsonError("Claim not found", 404);
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "STATUS_POLL_DISABLED") {
      return jsonError("NDIA status polling disabled", 503);
    }
    if (msg === "EXTERNAL_CLAIM_ID_MISSING") {
      return jsonError("Claim has not been submitted to NDIA yet", 400);
    }
    if (e instanceof NdiaApiError) {
      return jsonError(e.toUserMessage(), e.httpStatus ?? 502);
    }
    throw e;
  }
}
