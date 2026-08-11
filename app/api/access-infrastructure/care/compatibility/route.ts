import type { NextRequest } from "next/server";
import { z } from "zod";

import { suggestCompatibleWorkers } from "@/lib/access/infrastructure/adapters/care";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  careRequestId: z.string().min(1),
  excludeWorkerProfileIds: z.array(z.string().min(1)).optional(),
});

/**
 * POST Care access compatibility candidates (flag-gated).
 * Advisory only — never assigns workers. Participant remains decision owner.
 */
export async function POST(req: NextRequest) {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.careMatching
  ) {
    return jsonError("Care access matching is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const candidates = await suggestCompatibleWorkers({
    careRequestId: body.careRequestId,
    excludeWorkerProfileIds: body.excludeWorkerProfileIds,
    actorUserId: user.id,
  });

  return jsonOk({
    productionClaim: "none",
    decisionOwner: "PARTICIPANT",
    autoAssigned: false,
    careRequestId: body.careRequestId,
    candidates: candidates.map((c) => ({
      workerId: c.workerId,
      workerDisplayName: c.workerDisplayName,
      state: c.state,
      summary: c.summary,
      missingCompetencies: c.missingCompetencies,
      preferenceGaps: c.preferenceGaps,
      decisionOwner: c.decisionOwner,
      productionClaim: c.productionClaim,
    })),
    claim:
      "Advisory access candidates only. Participant confirmation required. Never auto-assign.",
  });
}
