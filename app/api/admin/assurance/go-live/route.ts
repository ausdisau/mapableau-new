import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assessProductionGoLive,
  createControlledPilotDraft,
  listGoLiveAssessments,
} from "@/lib/assurance/go-live/go-live-service";

export const dynamic = "force-dynamic";

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assess"),
    organisationId: z.string().optional(),
    featureFlagsSatisfied: z.boolean().optional(),
    workerTrustSatisfied: z.boolean().optional(),
    rollbackPlanDocumented: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("create_pilot"),
    organisationId: z.string().min(1),
    name: z.string().min(1),
    scopeStatement: z.string().min(1),
    maxParticipants: z.number().int().positive().optional(),
    goLiveAssessmentId: z.string().optional(),
  }),
]);

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId") ?? undefined;
  const assessments = await listGoLiveAssessments(organisationId);
  return jsonOk({
    assessments,
    disclaimer: "Go-live is never passed by feature flags alone. Pilots are not auto-activated.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assurance:go-live:decide");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.action === "assess") {
    const assessment = await assessProductionGoLive({
      organisationId: parsed.data.organisationId,
      assessedById: user.id,
      featureFlagsSatisfied: parsed.data.featureFlagsSatisfied,
      workerTrustSatisfied: parsed.data.workerTrustSatisfied,
      rollbackPlanDocumented: parsed.data.rollbackPlanDocumented,
    });
    return jsonOk({ assessment });
  }

  const pilot = await createControlledPilotDraft({
    organisationId: parsed.data.organisationId,
    name: parsed.data.name,
    scopeStatement: parsed.data.scopeStatement,
    createdById: user.id,
    maxParticipants: parsed.data.maxParticipants,
    goLiveAssessmentId: parsed.data.goLiveAssessmentId,
  });
  return jsonOk({
    pilot,
    autoActivateForbidden: true,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
  });
}
