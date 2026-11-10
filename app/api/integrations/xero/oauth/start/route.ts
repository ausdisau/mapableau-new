import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  buildXeroAuthorizeUrl,
  createXeroOAuthState,
} from "@/lib/integrations/xero/oauth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!integrationsFeatureFlags.xeroDirectEnabled()) {
    return NextResponse.json(
      { error: "XERO_DIRECT_ENABLED is false", live: false },
      { status: 403 },
    );
  }

  const user = await requireCurrentUser();
  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return NextResponse.json({ error: "organisationId required" }, { status: 400 });
  }

  try {
    const { state } = createXeroOAuthState({
      organisationId,
      actorUserId: user.id,
    });
    return NextResponse.redirect(buildXeroAuthorizeUrl(state));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Xero OAuth start failed", live: false },
      { status: 400 },
    );
  }
}
