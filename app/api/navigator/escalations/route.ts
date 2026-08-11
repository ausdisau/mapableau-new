import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";
import {
  createNavigatorEscalation,
  createNavigatorEscalationSchema,
  listNavigatorEscalationsForTenant,
} from "@/lib/navigator/pilot/escalation";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "TENANT_REQUIRED" }, { status: 400 });
  }

  // Reviewer path requires matching tenant claim on the session when present.
  const actorTenantId =
    (user as { tenantId?: string }).tenantId ?? tenantId;

  try {
    const rows = await listNavigatorEscalationsForTenant({
      tenantId,
      actorUserId: user.id,
      actorTenantId,
    });
    return NextResponse.json({ escalations: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LIST_FAILED";
    return NextResponse.json(
      { error: message },
      { status: message === "CROSS_TENANT_DENIED" ? 403 : 400 },
    );
  }
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = createNavigatorEscalationSchema.safeParse({
    ...(body as object),
    actorUserId: user.id,
    participantId:
      (body as { participantId?: string }).participantId ?? user.id,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const row = await createNavigatorEscalation(parsed.data);
    return NextResponse.json({ escalation: row }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
