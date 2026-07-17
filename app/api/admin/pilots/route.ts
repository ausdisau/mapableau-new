import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapPilotServiceError,
  resolvePilotOrganisationFilter,
  toSafePilotSummary,
} from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

const listQuerySchema = z.object({
  organisationId: z.string().cuid().optional(),
});

const createSchema = z.object({
  organisationId: z.string().cuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  summary: z.string().max(2000).optional(),
  supportItemAllowlist: z.array(z.string().min(1).max(64)).default([]),
  fundingRouteAllowlist: z.array(z.string().min(1).max(64)).default([]),
  integrationProfileIds: z.array(z.string().min(1).max(64)).default([]),
  maxTransactionCents: z.number().int().positive(),
  maxDailyExposureCents: z.number().int().positive(),
  maxParticipantExposureCents: z.number().int().positive(),
  maxTotalExposureCents: z.number().int().positive(),
  maxActiveParticipants: z.number().int().positive(),
  limitedLiveEnabled: z.boolean().optional().default(false),
  assuranceAssessmentId: z.string().min(1).max(200).nullable().optional(),
  goLiveAssessmentId: z.string().min(1).max(200).nullable().optional(),
  plannedStartAt: z.string().datetime().optional(),
  plannedEndAt: z.string().datetime().optional(),
});

/** GET /api/admin/pilots */
export async function GET(req: Request) {
  const user = await requireApiPermission("pilot:view");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    organisationId: url.searchParams.get("organisationId") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const scope = await resolvePilotOrganisationFilter(
    user,
    parsed.data.organisationId
  );
  if (scope instanceof Response) return scope;

  const pilots = await prisma.controlledPilot.findMany({
    where:
      scope.organisationIds.length > 0
        ? { organisationId: { in: scope.organisationIds } }
        : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return jsonNdisOk({ pilots: pilots.map(toSafePilotSummary) });
}

/** POST /api/admin/pilots — create draft ControlledPilot */
export async function POST(req: Request) {
  const user = await requireApiPermission("pilot:create");
  if (user instanceof Response) return user;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const scope = await resolvePilotOrganisationFilter(
    user,
    parsed.data.organisationId
  );
  if (scope instanceof Response) return scope;
  if (
    scope.organisationIds.length > 0 &&
    !scope.organisationIds.includes(parsed.data.organisationId)
  ) {
    return jsonNdisError("Organisation access denied", 403);
  }

  let limitedLiveEnabled = parsed.data.limitedLiveEnabled ?? false;
  if (limitedLiveEnabled) {
    if (!hasPermission(user.primaryRole, "pilot:approve")) {
      return jsonNdisError(
        "limitedLiveEnabled requires pilot:approve permission",
        403
      );
    }
    if (!parsed.data.goLiveAssessmentId) {
      return jsonNdisError(
        "limitedLiveEnabled requires goLiveAssessmentId (Wave 6 assessment string ref)",
        400
      );
    }
  } else {
    limitedLiveEnabled = false;
  }

  try {
    const pilot = await prisma.controlledPilot.create({
      data: {
        organisationId: parsed.data.organisationId,
        name: parsed.data.name,
        code: parsed.data.code,
        status: "draft",
        stage: "design",
        summary: parsed.data.summary,
        supportItemAllowlist: parsed.data.supportItemAllowlist,
        fundingRouteAllowlist: parsed.data.fundingRouteAllowlist,
        integrationProfileIds: parsed.data.integrationProfileIds,
        maxTransactionCents: parsed.data.maxTransactionCents,
        maxDailyExposureCents: parsed.data.maxDailyExposureCents,
        maxParticipantExposureCents: parsed.data.maxParticipantExposureCents,
        maxTotalExposureCents: parsed.data.maxTotalExposureCents,
        maxActiveParticipants: parsed.data.maxActiveParticipants,
        limitedLiveEnabled,
        assuranceAssessmentId: parsed.data.assuranceAssessmentId ?? null,
        goLiveAssessmentId: parsed.data.goLiveAssessmentId ?? null,
        plannedStartAt: parsed.data.plannedStartAt
          ? new Date(parsed.data.plannedStartAt)
          : null,
        plannedEndAt: parsed.data.plannedEndAt
          ? new Date(parsed.data.plannedEndAt)
          : null,
        createdById: user.id,
        correlationId: createCorrelationId(),
      },
    });
    return jsonNdisOk({ pilot: toSafePilotSummary(pilot) }, 201);
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
