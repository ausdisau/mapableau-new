import { getActionProposal } from "@/lib/ai/platform/actions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isActionKernelOperational } from "@/lib/config/action-kernel";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ proposalId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isActionKernelOperational()) {
    return jsonError("ACTION_KERNEL_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { proposalId } = await context.params;
  const proposal = getActionProposal(proposalId);
  if (!proposal) return jsonError("PROPOSAL_NOT_FOUND", 404);
  if (proposal.participantId !== user.id) {
    return jsonError("FORBIDDEN", 403);
  }

  return jsonOk({ proposal });
}
