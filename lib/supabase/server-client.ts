import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  requireSupabasePublicConfig,
  requireSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

let serviceClient: SupabaseClient | null = null;

export function createSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const { url } = requireSupabasePublicConfig();
  serviceClient = createClient(url, requireSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return serviceClient;
}
