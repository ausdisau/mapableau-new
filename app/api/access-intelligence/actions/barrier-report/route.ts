import { z } from "zod";

import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { isDemoMode } from "@/lib/access-intelligence/configuration";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getCurrentUser } from "@/lib/auth/current-user";

const schema = z.object({
  approved: z.literal(true),
  placeId: z.string().min(1),
  elementId: z.string().optional(),
  description: z.string().min(1),
});

async function resolveUserId(): Promise<string | Response> {
  if (isDemoMode()) {
    const user = await getCurrentUser();
    return user?.id ?? createServerAccessContext({ userId: null }).userId;
  }
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  return session.id;
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (userId instanceof Response) return userId;
    const raw = await request.json();
    if (raw?.approved === false) {
      recordAuditEvent({
        action: "submit_barrier_report",
        actorUserId: userId,
        outcome: "cancelled",
      });
      return Response.json({
        error: "Action cancelled.",
        code: "ACTION_CANCELLED",
        recoveryHint: "No barrier report was published.",
      });
    }

    const body = schema.safeParse(raw);
    if (!body.success) {
      throw new AccessIntelligenceError(
        "APPROVAL_REQUIRED",
        "Explicit approval is required before publishing a barrier report.",
        "Review the report text and approve to publish.",
      );
    }

    const repo = getAccessIntelligenceRepository();
    const result = await repo.createBarrierReport({
      userId,
      placeId: body.data.placeId,
      elementId: body.data.elementId,
      description: body.data.description,
    });
    return Response.json({ report: result });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not publish barrier report.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
