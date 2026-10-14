import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import { refreshWorkOSAuthKitToken } from "@/lib/auth/workos-authkit-provider";

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function noStoreJson(body: object, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Vary: "Cookie",
    },
  });
}

/** Exchange the encrypted MapAble session for the current WorkOS access JWT. */
export async function POST(request: NextRequest) {
  if (
    !enabled(process.env.SUPABASE_WORKOS_AUTH_ENABLED) ||
    !enabled(process.env.NEXT_PUBLIC_SUPABASE_WORKOS_AUTH_ENABLED)
  ) {
    return noStoreJson(
      { error: "Supabase user authentication is disabled." },
      404,
    );
  }
  if (!isSameOrigin(request)) {
    return noStoreJson(
      { error: "Cross-origin token requests are not allowed." },
      403,
    );
  }

  const secret = resolveNextAuthSecret();
  if (!secret) {
    return noStoreJson({ error: "Authentication is unavailable." }, 503);
  }

  const secureCookie =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ===
      "https" || request.nextUrl.protocol === "https:";
  const token = await getToken({ req: request, secret, secureCookie });
  if (!token?.id) {
    return noStoreJson({ error: "Authentication required." }, 401);
  }

  let accessToken = token.workosAccessToken;
  const expiry = token.workosAccessTokenExpiresAt;
  let needsRefresh =
    typeof expiry !== "number" || expiry <= Date.now() + 60_000;

  if (needsRefresh && token.workosRefreshToken) {
    try {
      const refreshed = await refreshWorkOSAuthKitToken(
        token.workosRefreshToken,
      );
      accessToken = refreshed.accessToken;
      needsRefresh = false;
    } catch {
      return noStoreJson(
        { error: "Secure Supabase session could not be refreshed." },
        503,
      );
    }
  }

  if (!accessToken || needsRefresh) {
    return noStoreJson(
      { error: "Sign in with MapAble secure sign-in to use this service." },
      409,
    );
  }

  return noStoreJson({ accessToken });
}
