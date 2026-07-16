import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  createMissionStateMachine,
  evaluateMissionBlockers,
  hashMissionWriteProposal,
  MISSION_STATES,
  type MissionState,
} from "@/lib/access-intelligence/missions";

export async function GET() {
  if (!accessIntelligenceFlags.missionConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  return Response.json({ enabled: true, states: MISSION_STATES });
}

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.missionConsole) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "evaluate");

  if (action === "transition") {
    const sm = createMissionStateMachine(
      (body.current as MissionState) ?? "draft",
    );
    const next = sm.transition((body.next as MissionState) ?? "awaiting_participant_input");
    return Response.json({ ok: true, status: next });
  }

  if (action === "propose_write") {
    const payload = body.payload ?? {};
    const proposalHash = hashMissionWriteProposal(payload);
    return Response.json({
      ok: true,
      proposalHash,
      requiresApproval: true,
      actorUserId: userId,
    });
  }

  const evaluation = evaluateMissionBlockers({
    dependencies: body.dependencies ?? [],
    unknowns: body.unknowns ?? [],
    timingConflicts: body.timingConflicts ?? [],
  });
  return Response.json({ ok: true, evaluation });
}
