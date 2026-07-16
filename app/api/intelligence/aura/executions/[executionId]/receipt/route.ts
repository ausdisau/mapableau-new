import { NextResponse } from "next/server";

import { getExecutionReceipt } from "@/lib/aura/execution";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ executionId: string }> },
) {
  const { executionId } = await ctx.params;
  const receipt = getExecutionReceipt(executionId);
  if (!receipt) {
    return NextResponse.json({ error: "AURA_RECEIPT_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ receipt });
}
