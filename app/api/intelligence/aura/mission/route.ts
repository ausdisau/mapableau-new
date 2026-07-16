import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { resetLeaseStore } from "@/lib/aura/leases";
import { createAndPlanMission } from "@/lib/aura/mission/service";
import { resetMissionStore } from "@/lib/aura/mission/store";
import { createAuraMissionInputSchema } from "@/lib/aura/schemas";
import { resetWitnessStore } from "@/lib/aura/witness";

export const runtime = "nodejs";

/**
 * POST /api/intelligence/aura/mission
 * Creates a CareOS-aligned accessibility mission and returns a read-only plan.
 * Wave 1: zero application writes.
 */
export async function POST(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json(
      { error: "MAPABLE_AURA_DISABLED", message: "AURA is not enabled." },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = createAuraMissionInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const response = createAndPlanMission(parsed.data);
    return NextResponse.json({
      ...response,
      writeCount: 0,
      authorityCeiling: "L2_RECOMMEND",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Test helper — not for production clients. */
export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  return NextResponse.json({ ok: true });
}
