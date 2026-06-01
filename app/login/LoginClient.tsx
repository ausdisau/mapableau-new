"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  normalizeAuthEmail,
  safeAuthCallbackPath,
} from "@/lib/auth/auth-flow";
import { clientAgentLog } from "@/lib/debug/client-agent-log";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackPath(
    searchParams.get("callbackUrl"),
    "/dashboard"
  );
  const resetSuccess = searchParams.get("reset") === "success";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const hasOAuth =
    oauthProviders.google ||
    oauthProviders.microsoft ||
    oauthProviders.facebook;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {hasOAuth ? (
        <div className="flex flex-col gap-4">
          <OAuthSignInButtons
            providers={oauthProviders}
            callbackUrl={callbackUrl}
            disabled={isLoading}
          />
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-background px-2 relative z-10">or sign in with email</span>
            <span
              className="absolute left-0 right-0 top-1/2 border-t border-border"
              aria-hidden
            />
          </div>
        </div>
      ) : null}
      {oauthError ? (
        <p className="text-sm text-red-600" role="alert">
          {oauthError}
        </p>
      ) : null}
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
          const result = await signIn("credentials", {
            email: normalizeAuthEmail(email),
            password: password.trim(),
            redirect: false,
            callbackUrl,
          });

          // #region agent log
          clientAgentLog(
            "C",
            "LoginClient.tsx:signInResult",
            "signIn returned",
            {
              ok: result?.ok ?? null,
              error: result?.error ?? null,
              status: result?.status ?? null,
              callbackUrl,
            }
          );
          // #endregion

          if (result?.error) {
            setError("Invalid email or password");
            setIsLoading(false);
            return;
          }

          if (result?.ok === true) {
            setIsLoading(false);
            router.push(callbackUrl);
            router.refresh();
            return;
          }

          setError("An unexpected error occurred. Please try again.");
          setIsLoading(false);
        } catch {
          setError("An error occurred. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />
      {resetSuccess ? (
        <p className="text-sm text-green-700">
          Your password was updated. Sign in with your new password.
        </p>
      ) : null}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
    </form>
    </div>
  );
}

