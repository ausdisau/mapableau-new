"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, publishableKey } = requireSupabasePublicConfig();
  browserClient = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}
