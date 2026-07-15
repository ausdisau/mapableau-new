import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { isDemoMode } from "@/lib/access-intelligence/configuration";
import {
  HARBOUR_BASELINE_INCIDENTS,
  MAIN_LIFT_OUTAGE_INCIDENT,
  buildHarbourLivingTwin,
  calculateAccessCoverage,
} from "@/lib/access-intelligence/living";
import type { LiveIncident } from "@/lib/access-intelligence/schemas";

const incidentStore = new Map<string, LiveIncident>();
incidentStore.set(MAIN_LIFT_OUTAGE_INCIDENT.id, {
  ...MAIN_LIFT_OUTAGE_INCIDENT,
  status: "active",
});

function assertOperateRole(roleHeader: string | null): boolean {
  if (isDemoMode()) {
    return (
      roleHeader === "venue_staff" ||
      roleHeader === "admin" ||
      roleHeader === "demo_preview"
    );
  }
  return roleHeader === "venue_staff" || roleHeader === "admin";
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const { id: placeId } = await ctx.params;
  const role = request.headers.get("x-access-role");
  if (!assertOperateRole(role)) {
    return Response.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }
  const twin = buildHarbourLivingTwin({
    incidents: [
      ...HARBOUR_BASELINE_INCIDENTS,
      ...[...incidentStore.values()].filter((i) => i.placeId === placeId),
    ],
  });
  const coverage = calculateAccessCoverage({ twin });
  const stale = twin.evidence.filter((e) => e.status === "provisional" || e.capturedAt < "2026-01-01");
  const disputed = twin.features.filter((f) => f.disputed);
  const unknowns = twin.features.filter(
    (f) => f.value === "unknown" || f.value === "unknown_operational",
  );
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
      edgeIds: ["e-hcc-rec-west", "e-hcc-west-lift", "e-hcc-west-corr", "e-hcc-corr-merge", "e-hcc-corr-room"],
      text: "Reception → Western lift → western corridor → main corridor → Room 3.12",
    },
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
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const role = request.headers.get("x-access-role");
  if (!assertOperateRole(role)) {
    return Response.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }
  const { id: placeId } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const existing = incidentStore.get(parsed.data.incidentId) ?? {
    ...MAIN_LIFT_OUTAGE_INCIDENT,
    placeId,
  };
  const next: LiveIncident = {
    ...existing,
    status: parsed.data.status ?? existing.status,
    expiresAt: parsed.data.expiresAt ?? existing.expiresAt,
    description: parsed.data.description ?? existing.description,
  };
  incidentStore.set(next.id, next);
  const audit = recordAuditEvent({
    actorUserId: userId,
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
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const role = request.headers.get("x-access-role");
  if (!assertOperateRole(role)) {
    return Response.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }
  const { id: placeId } = await ctx.params;
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
  incidentStore.set(incident.id, incident);
  const audit = recordAuditEvent({
    actorUserId: userId,
    action: "create_incident",
    purpose: "venue_operations",
    recipient: placeId,
    outcome: "executed",
    metadata: { incidentId: incident.id },
  });
  return Response.json({ incident, auditId: audit.id });
}
