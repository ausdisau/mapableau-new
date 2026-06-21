import { NextResponse } from "next/server";

import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

export async function GET() {
  const providers = getConfiguredOAuthProviders();
  const payload: Record<string, { id: string; name: string; type: string }> =
    {};

  if (providers.auth0) {
    payload.auth0 = { id: "auth0", name: "Auth0", type: "oauth" };
  }
  if (providers.google) {
    payload.google = { id: "google", name: "Google", type: "oauth" };
  }
  if (providers.microsoft) {
    payload["azure-ad"] = {
      id: "azure-ad",
      name: "Microsoft",
      type: "oauth",
    };
  }
  if (providers.facebook) {
    payload.facebook = { id: "facebook", name: "Facebook", type: "oauth" };
  }
  if (providers.apple) {
    payload.apple = { id: "apple", name: "Apple", type: "oauth" };
  }

  return NextResponse.json(payload);
}
