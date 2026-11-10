import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  exchangeDeputyAuthCode,
  parseDeputyOAuthState,
} from "@/lib/integrations/deputy/oauth";
import { toPublicConnectionSummary } from "@/lib/integrations/delivery/connection-tokens";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!integrationsFeatureFlags.deputyEnabled()) {
    return NextResponse.json(
      { error: "Deputy integration is disabled", live: false },
      { status: 403 },
    );
  }

  const user = await requireCurrentUser();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.json(
      { error: oauthError, live: false },
      { status: 400 },
    );
  }
  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  try {
    const parsed = parseDeputyOAuthState(state);
    if (parsed.actorUserId !== user.id) {
      return NextResponse.json(
        { error: "OAuth state actor mismatch" },
        { status: 403 },
      );
    }

    const { connection, endpoint } = await exchangeDeputyAuthCode({
      code,
      organisationId: parsed.organisationId,
      actorUserId: user.id,
    });

    return NextResponse.json({
      live: false,
      message:
        "Deputy connected. Draft unpublished rosters only; publish requires provider review.",
      endpoint,
      connection: toPublicConnectionSummary(connection),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Deputy OAuth callback failed",
        live: false,
      },
      { status: 400 },
    );
  }
}
