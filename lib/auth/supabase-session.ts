import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { getSupabaseServerClientOrNull } from "@/lib/supabase/server";

export type SupabaseAuthSession = {
  user: SupabaseAuthUser;
};

export async function getSupabaseAuthSession(): Promise<SupabaseAuthSession | null> {
  const supabase = await getSupabaseServerClientOrNull();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { user };
}
