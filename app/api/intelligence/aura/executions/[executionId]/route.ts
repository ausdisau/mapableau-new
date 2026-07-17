import { NextResponse } from "next/server";

import {
  getExecution,
  getExecutionReceipt,
} from "@/lib/aura/execution";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ executionId: string }> },
) {
  const { executionId } = await ctx.params;
  const execution = getExecution(executionId);
  if (!execution) {
    return NextResponse.json({ error: "AURA_EXECUTION_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ execution });
}
