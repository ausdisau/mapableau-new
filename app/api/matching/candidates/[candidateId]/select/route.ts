import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { syncAllocationAfterMatchSelection } from "@/lib/care-allocation/matching-bridge";
import { selectMatchCandidate } from "@/lib/matching/matching-service";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("matching:select");
  if (user instanceof Response) return user;
  const { candidateId } = await params;
  const body = await req.json().catch(() => ({}));
  const candidate = await selectMatchCandidate(
    candidateId,
    user.id,
    body.notes
  );

  let allocation = null;
  if (candidate.matchRun.careRequestId) {
    allocation = await syncAllocationAfterMatchSelection({
      careRequestId: candidate.matchRun.careRequestId,
      actorUser: user,
    });
  }

  return jsonOk({ candidate, allocation });
}
