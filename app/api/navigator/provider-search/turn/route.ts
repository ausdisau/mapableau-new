import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";
import {
  navigatorProviderSearchTurnSchema,
  runNavigatorProviderSearchTurn,
} from "@/lib/navigator/pilot/provider-search";

export const runtime = "nodejs";

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

  const parsed = navigatorProviderSearchTurnSchema.safeParse({
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
    const result = await runNavigatorProviderSearchTurn(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "TURN_FAILED";
    const status =
      message.startsWith("CONSENT_") ||
      message.includes("AUTHORITY") ||
      message.includes("DELEGATION")
        ? 403
        : message.startsWith("CAPABILITY_DENIED") ||
            message === "NAVIGATOR_PILOT_DISABLED"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
