import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertNoParticipantRanking,
  buildThinMarketSignals,
  evaluateRegionalPilotReadiness,
  suppressSmallCells,
  type AggregateCell,
} from "@/lib/access-intelligence/regional";

export async function GET() {
  if (!accessIntelligenceFlags.regionalControlTower) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  return Response.json({
    enabled: true,
    smallCellThresholdDefault: 5,
    notes: [
      "Aggregates only — no participant PII",
      "Demand signal ≠ verified unmet need",
      "No worthiness or ranking scores",
    ],
  });
}

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.regionalControlTower) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "signals");

  try {
    assertNoParticipantRanking(body);

    if (action === "pilot_readiness") {
      const readiness = evaluateRegionalPilotReadiness({
        hubId: String(body.hubId ?? "hub"),
        evidenceCoveragePct: Number(body.evidenceCoveragePct ?? 0),
        journeyAssemblySuccessPct: Number(body.journeyAssemblySuccessPct ?? 0),
        smallCellSuppressionOk: Boolean(body.smallCellSuppressionOk),
        liveAdaptersOffByDefault: Boolean(body.liveAdaptersOffByDefault ?? true),
        regressionPackPresent: Boolean(body.regressionPackPresent),
      });
      return Response.json({ ok: true, readiness, actorUserId: userId });
    }

    const cells = (body.cells ?? []) as AggregateCell[];
    const suppressed = suppressSmallCells(cells, Number(body.threshold ?? 5));
    const signals = buildThinMarketSignals({
      hubId: String(body.hubId ?? "hub"),
      cells,
    });
    return Response.json({
      ok: true,
      suppressed,
      signals,
      actorUserId: userId,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Regional query failed" },
      { status: 400 },
    );
  }
}
