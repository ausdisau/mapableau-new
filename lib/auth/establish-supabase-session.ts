import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Establish a Supabase browser session for a verified Prisma user (passkey / Twilio 2FA).
 */
export async function establishSupabaseSessionForEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return { ok: false, error: "Supabase auth is not configured" };
  }

  const admin = getSupabaseAdmin();
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData.properties?.hashed_token) {
    return {
      ok: false,
      error: linkError?.message || "Could not create Supabase session",
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });

  if (verifyError) {
    return { ok: false, error: verifyError.message };
  }

  return { ok: true };
}
