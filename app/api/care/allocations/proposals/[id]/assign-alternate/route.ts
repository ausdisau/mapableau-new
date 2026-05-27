import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { executeAllocationProposal } from "@/lib/care-allocation/allocation-service";
import { assignAlternateAllocationSchema } from "@/lib/validation/care";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const parsed = assignAlternateAllocationSchema.parse(await req.json());
    const proposal = await prisma.careAllocationProposal.findUnique({
      where: { id },
      include: { allocationRun: true },
    });
    if (!proposal) return jsonError("Not found", 404);

    await prisma.careAllocationProposal.update({
      where: { id },
      data: { status: "approved" },
    });

    const result = await executeAllocationProposal({
      proposalId: id,
      actorUser: user,
      decision: "override",
      autonomyTier: proposal.allocationRun.autonomyTier,
      notes: parsed.notes,
      alternateWorkerProfileId: parsed.workerProfileId,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (
        e.message === "PROPOSAL_NOT_EXECUTABLE" ||
        e.message === "ALLOCATION_GATE_BLOCKED" ||
        e.message.startsWith("WORKER_")
      ) {
        return jsonError(e.message, 400);
      }
    }
    return jsonError("Assign alternate failed", 500);
  }
}
