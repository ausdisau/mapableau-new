import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { adidFlags } from "../../../../lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, sessionId } = await auth();
  if (!userId || !sessionId) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      subject: userId,
      issuer: "clerk",
      sessionPresent: true,
      authorisedServices: [],
      federation: {
        accountLinkingEnabled: adidFlags.accountLinkingEnabled(),
        wixSessionBridgeEnabled: adidFlags.wixSessionBridgeEnabled(),
        crossAppFederationEnabled: adidFlags.crossAppFederationEnabled(),
        directoryEnabled: adidFlags.directoryEnabled(),
      },
      notice:
        "No external account links, grants or cross-app SSO are asserted. Relying parties must validate issuer, audience, expiry, nonce and PKCE independently.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
