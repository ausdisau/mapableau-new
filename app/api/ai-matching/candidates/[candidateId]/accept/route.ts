import { acceptAiCandidate } from "@/lib/ai-matching/ai-match-service";
import { syncAllocationAfterMatchSelection } from "@/lib/care-allocation/matching-bridge";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("ai_matching:run");
  if (user instanceof Response) return user;
  const { candidateId } = await params;
  try {
    const candidate = await acceptAiCandidate(candidateId, user.id);
    let allocation = null;
    if (candidate.aiMatchRun.careRequestId) {
      allocation = await syncAllocationAfterMatchSelection({
        careRequestId: candidate.aiMatchRun.careRequestId,
        actorUser: user,
      });
    }
    return jsonOk({ candidate, allocation });
  } catch (e) {
    if (e instanceof Error && e.message === "FAIRNESS_REVIEW_REQUIRED") {
      return jsonError("Fairness review required before acceptance", 409);
    }
    throw e;
  }
}
