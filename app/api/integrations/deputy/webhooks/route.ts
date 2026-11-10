import { NextResponse } from "next/server";

import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { ingestDeputyWebhook } from "@/lib/integrations/deputy/webhooks";

export const runtime = "nodejs";

/**
 * Deputy inbound webhook. Unsigned callbacks are hints only (refetch + recon).
 * organisationId must be provided via query for multi-tenant routing until
 * installation-scoped endpoint URLs are provisioned per org.
 */
export async function POST(req: Request) {
  if (!integrationsFeatureFlags.deputyEnabled()) {
    return NextResponse.json(
      { received: true, ignored: true, reason: "disabled" },
      { status: 200 },
    );
  }

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) {
    return NextResponse.json(
      { error: "organisationId query required" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const signature =
    req.headers.get("x-deputy-secret") ??
    req.headers.get("X-Deputy-Secret");

  const disposition = await ingestDeputyWebhook({
    organisationId,
    rawBody,
    signatureHeader: signature,
  });

  // Always acknowledge quickly; processing is hint/recon based.
  return NextResponse.json({ received: true, disposition }, { status: 200 });
}
