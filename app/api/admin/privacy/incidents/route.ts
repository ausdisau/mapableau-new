import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  createPrivacyIncident,
  listPrivacyIncidents,
} from "@/lib/privacy/privacy-incident-service";
import type { PrivacyIncidentType } from "@prisma/client";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const incidents = await listPrivacyIncidents();
  return NextResponse.json({ incidents });
}

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    type: PrivacyIncidentType;
    summary: string;
    affectedUserIds?: string[];
  };

  const incident = await createPrivacyIncident({
    type: body.type,
    summary: body.summary,
    reportedBy: user.id,
    affectedUserIds: body.affectedUserIds,
  });

  return NextResponse.json({ incident }, { status: 201 });
}
