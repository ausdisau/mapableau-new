import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  auditReliabilityScan,
  buildProvenanceTrace,
  buildReverificationTasks,
  DEFAULT_FRESHNESS_POLICIES,
  listReliabilityScans,
  listReverificationTasks,
  persistReliabilityScan,
  persistReverificationTasks,
  scanEvidenceReliability,
  scheduleReverificationFromScan,
} from "@/lib/access-intelligence/reliability";
import type { AccessFeature, Evidence } from "@/lib/access-intelligence/schemas";

export async function GET(request: Request) {
  if (!accessIntelligenceFlags.reliabilityConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const url = new URL(request.url);
  const accessPlaceId = url.searchParams.get("accessPlaceId") ?? undefined;
  return Response.json({
    enabled: true,
    policies: DEFAULT_FRESHNESS_POLICIES,
    scans: listReliabilityScans(accessPlaceId),
    tasks: listReverificationTasks(
      accessPlaceId ? { accessPlaceId } : undefined,
    ),
    schedulerEnabled: accessIntelligenceFlags.reverificationScheduler,
  });
}

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.reliabilityConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "scan");

  if (action === "provenance") {
    const trace = buildProvenanceTrace({
      accessPlaceId: String(body.accessPlaceId ?? ""),
      claimOrFeatureId: String(body.claimOrFeatureId ?? "unknown"),
      steps: Array.isArray(body.steps) ? body.steps : [],
    });
    return Response.json({ ok: true, trace });
  }

  const accessPlaceId = String(body.accessPlaceId ?? "");
  if (!accessPlaceId) {
    return Response.json({ error: "accessPlaceId required" }, { status: 400 });
  }

  const result = scanEvidenceReliability({
    accessPlaceId,
    features: (body.features ?? []) as AccessFeature[],
    evidence: (body.evidence ?? []) as Evidence[],
  });

  const stored = persistReliabilityScan({
    accessPlaceId,
    healthScore: result.healthScore,
    findings: result.findings,
    expiredFeatureTypes: result.expiredFeatureTypes,
  });

  auditReliabilityScan({
    actorUserId: userId,
    accessPlaceId,
    healthScore: result.healthScore,
    findingCount: result.findings.length,
  });

  let scheduledTasks = null;
  if (action === "scan_and_schedule") {
    if (!accessIntelligenceFlags.reverificationScheduler) {
      return Response.json(
        { error: "Reverification scheduler disabled", result, scan: stored },
        { status: 403 },
      );
    }
    const schedule = scheduleReverificationFromScan({
      accessPlaceId,
      findings: result.findings,
    });
    scheduledTasks = persistReverificationTasks(schedule.scheduled);
  } else {
    const drafts = buildReverificationTasks({
      accessPlaceId,
      findings: result.findings,
    });
    scheduledTasks = persistReverificationTasks(drafts);
  }

  return Response.json({
    ok: true,
    result,
    scan: stored,
    tasks: scheduledTasks,
  });
}
