import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertNotEvacuationPlan,
  createEmptyTemporaryGraph,
  simulateEventPassports,
  type TemporaryGraph,
} from "@/lib/access-intelligence/events";

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.temporaryEventPlanner) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));
  try {
    assertNotEvacuationPlan(String(body.name ?? body.label ?? ""));
    const graph = (body.graph as TemporaryGraph) ?? createEmptyTemporaryGraph();
    const simulation = simulateEventPassports(graph);
    return Response.json({ ok: true, simulation, actorUserId: userId });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Event planning failed" },
      { status: 400 },
    );
  }
}
