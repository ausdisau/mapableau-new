"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  const client = getSupabaseBrowserClientOrNull();
  if (!client) {
    throw new Error(
      "Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}

/** Safe for SSR/prerender — returns null when Supabase auth is not configured. */
export function getSupabaseBrowserClientOrNull(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isSupabaseAuthConfigured()) return null;
  if (browserClient) return browserClient;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
