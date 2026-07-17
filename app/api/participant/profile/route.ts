import { NextResponse } from "next/server";

import { getParticipantProfileSummary } from "@/lib/participant/participant-dashboard-service";
import { requireParticipantApiAccess } from "@/lib/participant/participant-api-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const participantId = url.searchParams.get("participantId");

  const auth = await requireParticipantApiAccess(participantId);
  if ("error" in auth) return auth.error;

  const profile = await getParticipantProfileSummary(auth.access.participantId);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
