import { NextResponse } from "next/server";

import { buildRegisterRedirect } from "@/lib/auth/register-redirect";
import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const origin = url.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sessionStatus = await getAuthSessionStatus();
      if (sessionStatus.status === "unregistered") {
        const callbackUrl = isSafeRedirect(next) ? next : undefined;
        return NextResponse.redirect(
          `${origin}${buildRegisterRedirect(sessionStatus.email, callbackUrl)}`
        );
      }

      const destination = isSafeRedirect(next) ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
