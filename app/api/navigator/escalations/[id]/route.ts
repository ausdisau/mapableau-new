import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";
import { getNavigatorEscalation } from "@/lib/navigator/pilot/escalation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isNavigatorProviderSearchPilotEnabled()) {
    return NextResponse.json(
      { error: "NAVIGATOR_PILOT_DISABLED" },
      { status: 404 },
    );
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "TENANT_REQUIRED" }, { status: 400 });
  }

  const isReviewer = url.searchParams.get("asReviewer") === "true";
  const actorTenantId =
    (user as { tenantId?: string }).tenantId ?? tenantId;

  try {
    const row = await getNavigatorEscalation({
      id,
      tenantId,
      actorUserId: user.id,
      actorTenantId,
      actorParticipantId: user.id,
      isReviewer,
    });
    return NextResponse.json({ escalation: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GET_FAILED";
    const status =
      message === "CROSS_TENANT_DENIED" ||
      message === "CROSS_PARTICIPANT_DENIED"
        ? 403
        : message === "ESCALATION_NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
