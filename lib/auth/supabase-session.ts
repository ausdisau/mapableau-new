import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseAuthSession = {
  user: SupabaseAuthUser;
};

export async function getSupabaseAuthSession(): Promise<SupabaseAuthSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { user };
}
