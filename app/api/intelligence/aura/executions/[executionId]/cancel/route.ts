import { NextResponse } from "next/server";

import { cancelExecution } from "@/lib/aura/execution";
import { getExecution } from "@/lib/aura/execution";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ executionId: string }> },
) {
  const { executionId } = await ctx.params;
  const execution = getExecution(executionId);
  if (!execution) {
    return NextResponse.json({ error: "AURA_EXECUTION_NOT_FOUND" }, { status: 404 });
  }
  const mission = requireMission(execution.missionId);
  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = body?.reason;
  } catch {
    /* optional body */
  }
  try {
    const updated = await cancelExecution({
      executionId,
      participantId: mission.participantId,
      reason,
    });
    return NextResponse.json({ execution: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
