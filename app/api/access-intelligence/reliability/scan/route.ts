import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  auditReliabilityScan,
  DEFAULT_FRESHNESS_POLICIES,
  scanEvidenceReliability,
} from "@/lib/access-intelligence/reliability";
import type { AccessFeature, Evidence } from "@/lib/access-intelligence/schemas";

export async function GET() {
  if (!accessIntelligenceFlags.reliabilityConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  return Response.json({
    enabled: true,
    policies: DEFAULT_FRESHNESS_POLICIES,
  });
}

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.reliabilityConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;

  const body = await request.json().catch(() => ({}));
  const accessPlaceId = String(body.accessPlaceId ?? "");
  if (!accessPlaceId) {
    return Response.json({ error: "accessPlaceId required" }, { status: 400 });
  }

  const result = scanEvidenceReliability({
    accessPlaceId,
    features: (body.features ?? []) as AccessFeature[],
    evidence: (body.evidence ?? []) as Evidence[],
  });

  auditReliabilityScan({
    actorUserId: userId,
    accessPlaceId,
    healthScore: result.healthScore,
    findingCount: result.findings.length,
  });

  return Response.json({ ok: true, result });
}
