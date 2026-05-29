import { NextResponse, type NextRequest } from "next/server";

import { createClient as createMiddlewareClient } from "@/utils/supabase/middleware";

export async function updateSession(
  request: NextRequest,
  options?: { requireAuth?: boolean; signInPath?: string }
) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (options?.requireAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = options.signInPath ?? "/login";
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
