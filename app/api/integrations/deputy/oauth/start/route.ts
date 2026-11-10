import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  buildDeputyAuthorizeUrl,
  createDeputyOAuthState,
} from "@/lib/integrations/deputy/oauth";

export const runtime = "nodejs";

/**
 * Start Deputy OAuth for the caller's organisation.
 * Requires DEPUTY_ENABLED=true and authenticated provider admin.
 */
export async function GET(req: Request) {
  if (!integrationsFeatureFlags.deputyEnabled()) {
    return NextResponse.json(
      { error: "Deputy integration is disabled", live: false },
      { status: 403 },
    );
  }

  const user = await requireCurrentUser();
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");

  if (!organisationId) {
    return NextResponse.json(
      { error: "organisationId is required" },
      { status: 400 },
    );
  }

  try {
    const { state } = createDeputyOAuthState({
      organisationId,
      actorUserId: user.id,
    });
    const authorizeUrl = buildDeputyAuthorizeUrl(state);
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Deputy OAuth start failed",
        live: false,
      },
      { status: 400 },
    );
  }
}
