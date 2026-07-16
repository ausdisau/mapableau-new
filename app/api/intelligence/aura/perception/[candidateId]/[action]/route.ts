import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { acceptCandidate, rejectCandidate } from "@/lib/aura/multimodal";

export const runtime = "nodejs";

const bodySchema = z.object({ userId: z.string() });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ candidateId: string; action: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { candidateId, action } = await ctx.params;
  try {
    const body = bodySchema.parse(await req.json());
    if (action === "accept") {
      return NextResponse.json({
        candidate: acceptCandidate({ candidateId, userId: body.userId }),
      });
    }
    if (action === "reject") {
      return NextResponse.json({
        candidate: rejectCandidate({ candidateId, userId: body.userId }),
      });
    }
    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
