import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { toPublicConnectionSummary } from "@/lib/integrations/delivery/connection-tokens";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  exchangeXeroAuthCode,
  parseXeroOAuthState,
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
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const tenantId = url.searchParams.get("tenantId") ?? undefined;

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const parsed = parseXeroOAuthState(state);
    if (parsed.actorUserId !== user.id) {
      return NextResponse.json({ error: "OAuth state actor mismatch" }, { status: 403 });
    }

    const result = await exchangeXeroAuthCode({
      code,
      organisationId: parsed.organisationId,
      actorUserId: user.id,
      tenantId,
    });

    if (result.needsTenantSelection) {
      return NextResponse.json({
        live: false,
        needsTenantSelection: true,
        tenants: result.tenants,
        message:
          "Select the Xero organisation tenant, then retry callback with tenantId. Custom Connection is opt-in only.",
      });
    }

    return NextResponse.json({
      live: false,
      message:
        "Xero connected. Draft ACCREC only; AccountCode/TaxType/Contact must be configured before export.",
      tenantId: result.tenantId,
      connection: toPublicConnectionSummary(result.connection),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Xero OAuth callback failed",
        live: false,
      },
      { status: 400 },
    );
  }
}
