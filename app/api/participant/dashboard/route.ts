import { NextResponse } from "next/server";

import { getParticipantDashboardData } from "@/lib/participant/participant-dashboard-service";
import { requireParticipantApiAccess } from "@/lib/participant/participant-api-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const participantId = url.searchParams.get("participantId");

  const auth = await requireParticipantApiAccess(participantId);
  if ("error" in auth) return auth.error;

  const dashboard = await getParticipantDashboardData(
    auth.access.participantId,
    auth.access.viewAsDelegate,
  );

  return NextResponse.json({ dashboard });
}
