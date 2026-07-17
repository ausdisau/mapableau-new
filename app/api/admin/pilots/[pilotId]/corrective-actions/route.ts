import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { createCorrectiveAction } from "@/lib/pilot/surveillance/corrective-action";

const bodySchema = z.object({
  actionType: z.enum([
    "process",
    "training",
    "configuration",
    "communication",
    "technical",
    "other",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  ownerUserId: z.string().cuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  signalId: z.string().cuid().nullable().optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/corrective-actions */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:incident:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const action = await createCorrectiveAction({
      pilotId,
      actionType: parsed.data.actionType,
      title: parsed.data.title,
      description: parsed.data.description,
      ownerUserId: parsed.data.ownerUserId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      signalId: parsed.data.signalId,
    });
    return jsonNdisOk(
      {
        action: {
          id: action.id,
          title: action.title,
          actionType: action.actionType,
          status: action.status,
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
