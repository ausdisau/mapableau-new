import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { approveAllocationProposal } from "@/lib/care-allocation/allocation-service";
import { approveAllocationProposalSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const parsed = approveAllocationProposalSchema.parse(
      await req.json().catch(() => ({}))
    );
    const result = await approveAllocationProposal(id, user, parsed.notes);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (
        e.message === "PROPOSAL_NOT_EXECUTABLE" ||
        e.message === "ALLOCATION_GATE_BLOCKED"
      ) {
        return jsonError(e.message, 400);
      }
    }
    return jsonError("Approve failed", 500);
  }
}
