import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isRightsCentreEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import { createRightsRequestSchema } from "@/lib/validation/rights-os";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function GET() {
  if (!isRightsOsEnabled() || !isRightsCentreEnabled()) {
    return jsonError("Rights Centre is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const requests = await prisma.rightsRequest.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  return jsonOk({ requests });
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isRightsCentreEnabled()) {
    return jsonError("Rights Centre is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createRightsRequestSchema.parse(await req.json());
    const request = await prisma.rightsRequest.create({
      data: {
        subjectUserId: user.id,
        requestType: parsed.requestType,
        status: "draft",
        scopeJson: parsed.scope as Prisma.InputJsonValue,
      },
    });

    await prisma.rightsRequestEvent.create({
      data: {
        requestId: request.id,
        eventType: "created",
        actorUserId: user.id,
      },
    });

    return jsonOk({ request }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Failed to create request", 500);
  }
}
