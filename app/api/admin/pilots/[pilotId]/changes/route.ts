import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { createPilotChangeRequest } from "@/lib/pilot/change/change-request-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  changeType: z.string().min(1).max(120),
  riskSummary: z.string().max(2000).optional(),
  rollbackPlan: z.string().max(4000).optional(),
  safeDiffJson: z.record(z.string(), z.unknown()).optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/changes */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:operations:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const changes = await prisma.pilotChangeRequest.findMany({
    where: { pilotId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      changeType: true,
      status: true,
      requestedById: true,
      approvedById: true,
      approvedAt: true,
      appliedAt: true,
      rolledBackAt: true,
      createdAt: true,
    },
  });

  return jsonNdisOk({
    pilotId,
    changes: changes.map((c) => ({
      ...c,
      approvedAt: c.approvedAt?.toISOString() ?? null,
      appliedAt: c.appliedAt?.toISOString() ?? null,
      rolledBackAt: c.rolledBackAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

/** POST /api/admin/pilots/[pilotId]/changes */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:operations:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const change = await createPilotChangeRequest({
      pilotId,
      title: parsed.data.title,
      description: parsed.data.description,
      changeType: parsed.data.changeType,
      requestedById: user.id,
      riskSummary: parsed.data.riskSummary,
      rollbackPlan: parsed.data.rollbackPlan,
      safeDiffJson: parsed.data.safeDiffJson,
    });
    return jsonNdisOk(
      {
        change: {
          id: change.id,
          title: change.title,
          status: change.status,
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
