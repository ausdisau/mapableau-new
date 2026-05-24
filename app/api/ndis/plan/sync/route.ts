import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { syncPlanSnapshot } from "@/lib/ndis/ndis-plan-sync-service";

const schema = z.object({ participantId: z.string() });

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const snapshot = await syncPlanSnapshot({
      participantId: parsed.data.participantId,
      actorUserId: user.id,
    });
    return NextResponse.json({ snapshot });
  } catch (e) {
    if (e instanceof Error && e.message === "NDIS_CONSENT_REQUIRED") {
      return NextResponse.json(
        { error: "Consent required", nextSteps: ["Grant plan_dates consent"] },
        { status: 403 }
      );
    }
    throw e;
  }
}
