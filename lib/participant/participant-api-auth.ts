import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  logParticipantDashboardAccess,
  resolveParticipantAccess,
} from "@/lib/participant/participant-access";

export async function requireParticipantApiAccess(
  participantIdParam?: string | null,
) {
  const actor = await getCurrentUser();
  if (!actor) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  const access = await resolveParticipantAccess(actor, participantIdParam);
  if (!access) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  await logParticipantDashboardAccess(
    actor,
    access.participantId,
    access.viewAsDelegate,
    "api",
  );

  return { actor, access } as const;
}
