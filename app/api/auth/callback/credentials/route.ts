import { NextResponse } from "next/server";

import { signInWithCredentials } from "@/lib/auth/credentials-sign-in";
import { getAppBaseUrl } from "@/lib/app-url";
import { buildRegisterRedirect } from "@/lib/auth/register-redirect";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

function parseCallbackUrl(raw: string | null): string {
  if (raw && isSafeRedirect(raw)) return raw;
  return "/dashboard";
}

function credentialsErrorResponse(callbackUrl: string) {
  const baseUrl = getAppBaseUrl();
  return NextResponse.json(
    {
      url: `${baseUrl}/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      error: "CredentialsSignin",
      status: 401,
      ok: false,
    },
    { status: 401 }
  );
}

/** Legacy NextAuth credentials callback — bridges to Supabase sign-in. */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const callbackUrl = parseCallbackUrl(formData.get("callbackUrl")?.toString() ?? null);

  if (!email.trim() || !password) {
    return credentialsErrorResponse(callbackUrl);
  }

  const result = await signInWithCredentials(email, password);

  if (!result.ok && result.reason === "unregistered") {
    const registerUrl = `${getAppBaseUrl()}${buildRegisterRedirect(result.email, callbackUrl)}`;
    return NextResponse.json({ url: registerUrl, ok: true });
  }

  if (!result.ok) {
    return credentialsErrorResponse(callbackUrl);
  }

  const baseUrl = getAppBaseUrl();
  return NextResponse.json({
    url: `${baseUrl}${callbackUrl}`,
    ok: true,
  });
}
