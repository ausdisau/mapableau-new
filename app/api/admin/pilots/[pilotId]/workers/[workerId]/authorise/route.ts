import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { authoriseWorkerForPilot } from "@/lib/pilot/runtime/runtime-worker-gate";

const bodySchema = z.object({
  credentialChecks: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        passed: z.boolean(),
        detail: z.string().max(500).optional(),
      })
    )
    .min(1),
});

type Params = { params: Promise<{ pilotId: string; workerId: string }> };

/** POST /api/admin/pilots/[pilotId]/workers/[workerId]/authorise */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:worker:authorise");
  if (user instanceof Response) return user;

  const { pilotId, workerId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const auth = await authoriseWorkerForPilot({
      pilotId,
      workerUserId: workerId,
      authorisedById: user.id,
      credentialChecks: parsed.data.credentialChecks.map((c) => ({
        name: c.name,
        passed: c.passed,
        // Do not persist free-text detail that may contain restricted findings
      })),
    });
    return jsonNdisOk(
      {
        authorisation: {
          id: auth.id,
          workerUserId: auth.workerUserId,
          active: auth.active,
          authorisedById: auth.authorisedById,
        },
      },
      201
    );
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
