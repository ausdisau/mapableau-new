import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/env";

export async function getSupabaseServerClientOrNull(): Promise<SupabaseClient | null> {
  if (!isSupabaseAuthConfigured()) return null;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
        }
      },
    },
  });
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const client = await getSupabaseServerClientOrNull();
  if (!client) {
    throw new Error(
      "Supabase server client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}
