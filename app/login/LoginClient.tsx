"use client";

import { useSearchParams } from "next/navigation";

import { SignInForm } from "@/components/auth/SignInForm";
import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthSignin":
    case "OAuthCallback":
      return "Social sign-in failed. Please try again.";
    case "OAuthAccountNotLinked":
      return "This email is already registered with a different sign-in method. Use email and password, or contact support.";
    case "AccessDenied":
      return "Sign-in was cancelled or denied.";
    default:
      return "Could not sign in. Please try again.";
  }
}

export default function LoginClient({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderFlags;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackPath(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const resetSuccess = searchParams.get("reset") === "success";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  return (
    <SignInForm
      callbackUrl={callbackUrl}
      oauthProviders={oauthProviders}
      variant="page"
      idPrefix="login"
      oauthError={oauthError}
      resetSuccess={resetSuccess}
    />
  );
}
