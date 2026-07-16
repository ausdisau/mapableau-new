import { z } from "zod";

import {
  resolveAccessIntelligenceUser,
} from "@/lib/access-intelligence/api-auth";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { resolveLiveStatus } from "@/lib/access-intelligence/live";
import {
  HARBOUR_BASELINE_INCIDENTS,
  MAIN_LIFT_OUTAGE_INCIDENT,
  buildHarbourLivingTwin,
  calculateAccessCoverage,
} from "@/lib/access-intelligence/living";
import { getLivingPersistence } from "@/lib/access-intelligence/persistence";
import type { LiveIncident } from "@/lib/access-intelligence/schemas";

async function ensureOperateIncidents(placeId: string): Promise<LiveIncident[]> {
  const persistence = getLivingPersistence();
  await persistence.ensureTwinSeeded(placeId);
  let incidents = await persistence.loadIncidents(placeId);
  if (incidents.length === 0) {
    const seed = {
      ...MAIN_LIFT_OUTAGE_INCIDENT,
      placeId,
      status: "active" as const,
    };
    await persistence.saveIncident(seed);
    incidents = await persistence.loadIncidents(placeId);
  }
  return incidents;
}

async function assertOperateAccess(
  request: Request,
  placeId: string,
): Promise<Response | { userId: string }> {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;
  try {
    await requireVenueOperateAccess({
      user,
      placeId,
      roleHeader: request.headers.get("x-access-role"),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 403 });
    }
    throw error;
  }
  return { userId: user.id };
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: placeId } = await ctx.params;
  const auth = await assertOperateAccess(request, placeId);
  if (auth instanceof Response) return auth;

  const stored = await ensureOperateIncidents(placeId);
  const twin = buildHarbourLivingTwin({
    incidents: [...HARBOUR_BASELINE_INCIDENTS, ...stored.filter((i) => i.placeId === placeId)],
  });
  const coverage = calculateAccessCoverage({ twin });
  const stale = twin.evidence.filter(
    (e) => e.status === "provisional" || e.capturedAt < "2026-01-01",
  );
  const disputed = twin.features.filter((f) => f.disputed);
  const unknowns = twin.features.filter(
    (f) => f.value === "unknown" || f.value === "unknown_operational",
  );

  const westernLift = await resolveLiveStatus({
    placeId,
    subjectKind: "element",
    subjectId: "hcc-lift-west",
  });

  return Response.json({
    placeId,
    incidents: twin.incidents,
    staleEvidence: stale,
    disputedClaims: disputed,
    evidenceGaps: unknowns,
    coverageSummary: {
      testedProfileCount: coverage.testedProfileCount,
      blocked: coverage.blocked,
      unknown: coverage.unknown,
      suitable: coverage.suitable,
      suitableWithConditions: coverage.suitableWithConditions,
    },
    temporaryRoute: {
      label: "Western lift temporary route",
      edgeIds: [
        "e-hcc-rec-west",
        "e-hcc-west-lift",
        "e-hcc-west-corr",
        "e-hcc-corr-merge",
        "e-hcc-corr-room",
      ],
      text: "Reception → Western lift → western corridor → main corridor → Room 3.12",
    },
    liveStatus: {
      westernLift,
      note: "Live adapters cascade to last-known snapshots/evidence when BMS is unreachable.",
    },
    persistence: getLivingPersistence().kind,
  });
}

const patchSchema = z.object({
  incidentId: z.string(),
  status: z.enum(["active", "resolved", "expired", "unverified"]).optional(),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: placeId } = await ctx.params;
  const auth = await assertOperateAccess(request, placeId);
  if (auth instanceof Response) return auth;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const persistence = getLivingPersistence();
  await persistence.ensureTwinSeeded(placeId);
  const existing =
    (await persistence.loadIncidents(placeId)).find(
      (i) => i.id === parsed.data.incidentId,
    ) ?? {
      ...MAIN_LIFT_OUTAGE_INCIDENT,
      placeId,
    };

  const next: LiveIncident = {
    ...existing,
    status: parsed.data.status ?? existing.status,
    expiresAt: parsed.data.expiresAt ?? existing.expiresAt,
    description: parsed.data.description ?? existing.description,
  };
  await persistence.saveIncident(next);

  const audit = recordAuditEvent({
    actorUserId: auth.userId,
    action: "update_incident",
    purpose: "venue_operations",
    recipient: placeId,
    fieldsShared: [],
    outcome: "executed",
    metadata: { incidentId: next.id, status: next.status },
  });
  return Response.json({
    incident: next,
    auditId: audit.id,
    note: "Venue operational updates remain venue attestations / system feed — not assessor verification.",
  });
}

const createSchema = z.object({
  type: z.enum([
    "lift_outage",
    "blocked_route",
    "locked_entrance",
    "toilet_unavailable",
    "construction",
    "automatic_door_fault",
    "crowding",
    "high_noise",
    "flooding",
    "other",
  ]),
  description: z.string().min(1),
  elementId: z.string().optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]).default("moderate"),
  affectedEdgeIds: z.array(z.string()).default([]),
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: placeId } = await ctx.params;
  const auth = await assertOperateAccess(request, placeId);
  if (auth instanceof Response) return auth;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const incident: LiveIncident = {
    id: `inc-op-${Date.now()}`,
    placeId,
    elementId: parsed.data.elementId,
    type: parsed.data.type,
    severity: parsed.data.severity,
    description: parsed.data.description,
    sourceType: "venue_attestation",
    reportedAt: new Date().toISOString(),
    status: "active",
    affectedEdgeIds: parsed.data.affectedEdgeIds,
  };
  await getLivingPersistence().saveIncident(incident);

  const audit = recordAuditEvent({
    actorUserId: auth.userId,
    action: "create_incident",
    purpose: "venue_operations",
    recipient: placeId,
    outcome: "executed",
    metadata: { incidentId: incident.id },
  });
  return Response.json({ incident, auditId: audit.id });
}
