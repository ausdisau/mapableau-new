import { NextResponse } from "next/server";

import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import { ensurePrismaUserFromSupabase } from "@/lib/auth/supabase-user-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthCallbackPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensurePrismaUserFromSupabase(user);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuthCallback`);
}
