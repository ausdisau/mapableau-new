import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertNoParticipantRanking,
  buildThinMarketSignals,
  suppressSmallCells,
  type AggregateCell,
} from "@/lib/access-intelligence/regional";

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.regionalControlTower) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));

  try {
    assertNoParticipantRanking(body);
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
