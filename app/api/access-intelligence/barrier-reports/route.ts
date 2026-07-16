import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

const schema = z.object({
  approved: z.literal(true),
  placeId: z.string().min(1),
  elementId: z.string().optional(),
  description: z.string().min(1),
  category: z.string().optional(),
});

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("placeId") ?? undefined;
  const reports = await getAccessIntelligenceRepository().listBarrierReports(placeId);
  return Response.json({ reports });
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const raw = await request.json();
    if (raw?.approved === false) {
      recordAuditEvent({
        action: "submit_barrier_report",
        actorUserId: userId,
        outcome: "cancelled",
        fieldsShared: [],
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
    const result = await getAccessIntelligenceRepository().createBarrierReport({
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
