import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  approveCoordinatorAccess,
  requestCoordinatorAccess,
} from "@/lib/support-coordinator/relationship-service";
import { coordinatorAccessRequestSchema } from "@/schemas/care-support";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const asParticipant = await prisma.coordinatorAccessRequest.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const asCoordinator = await prisma.coordinatorAccessRequest.findMany({
    where: { coordinatorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk({ asParticipant, asCoordinator });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = coordinatorAccessRequestSchema.parse(await req.json());
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "approve") {
      const requestId = url.searchParams.get("requestId");
      if (!requestId) return jsonError("requestId required", 400);
      const rel = await approveCoordinatorAccess(requestId, user.id);
      return jsonOk({ relationship: rel });
    }

    if (!body.coordinatorId) {
      return jsonError("coordinatorId required to request access", 400);
    }

    const request = await requestCoordinatorAccess({
      participantId: user.id,
      coordinatorId: body.coordinatorId,
      scopes: body.scopes,
    });
    return jsonOk({ request }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Request failed", 500);
  }
}
