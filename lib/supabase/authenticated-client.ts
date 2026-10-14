"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let authenticatedClient: SupabaseClient | null = null;

function featureEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_WORKOS_AUTH_ENABLED?.trim().toLowerCase() ===
    "true"
  );
}

/**
 * Browser Supabase client backed by the signed-in user's short-lived WorkOS
 * JWT. This never uses or exposes SUPABASE_SERVICE_ROLE_KEY.
 */
export function getSupabaseAuthenticatedClient(): SupabaseClient {
  if (authenticatedClient) return authenticatedClient;
  if (!featureEnabled()) {
    throw new Error("Supabase user authentication is not enabled.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error("Supabase user authentication is not configured.");
  }

  authenticatedClient = createClient(url, publishableKey, {
    accessToken: async () => {
      const response = await fetch("/api/auth/supabase-token", {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { accessToken?: unknown };
      return typeof body.accessToken === "string" ? body.accessToken : null;
    },
  });

  return authenticatedClient;
}
