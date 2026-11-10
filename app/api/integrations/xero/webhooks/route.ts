import { NextResponse } from "next/server";

import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { ingestXeroWebhook } from "@/lib/integrations/xero/webhooks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!integrationsFeatureFlags.xeroDirectEnabled()) {
    return new NextResponse("disabled", { status: 404 });
  }

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return NextResponse.json({ error: "organisationId required" }, { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-xero-signature");

  const result = await ingestXeroWebhook({
    organisationId,
    rawBody,
    signatureHeader: signature,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  // Respond promptly; authoritative refetch is asynchronous via reconciliation.
  return NextResponse.json({ received: true, queued: result.queued }, { status: 200 });
}
