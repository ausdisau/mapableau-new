"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { getNeonAuthClient } from "@/lib/auth/neon-auth-client";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
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
  neonAuthEnabled = false,
}: {
  oauthProviders: OAuthProviderFlags;
  neonAuthEnabled?: boolean;
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
    neonAuthEnabled ||
    oauthProviders.google ||
    oauthProviders.microsoft ||
    oauthProviders.facebook;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthFormCard
      title="Welcome back"
      description="Sign in to your dashboard, bookings, and messages."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {hasOAuth ? (
        <div className="flex flex-col gap-4">
          <OAuthSignInButtons
            providers={oauthProviders}
            callbackUrl={callbackUrl}
            disabled={isLoading}
            neonAuthEnabled={neonAuthEnabled}
          />
          <AuthOAuthDivider label="or sign in with email" />
        </div>
      ) : null}

      {oauthError ? <AuthAlert variant="error">{oauthError}</AuthAlert> : null}

      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setIsLoading(true);

          try {
            const normalizedEmail = normalizeAuthEmail(email);
            const trimmedPassword = password.trim();

            if (neonAuthEnabled) {
              const { error } = await getNeonAuthClient().signIn.email({
                email: normalizedEmail,
                password: trimmedPassword,
                callbackURL: callbackUrl,
              });
              if (error) {
                setError(error.message || "Invalid email or password");
                setIsLoading(false);
                return;
              }
              setIsLoading(false);
              router.push(callbackUrl);
              router.refresh();
              return;
            }

            const result = await signIn("credentials", {
              email: normalizedEmail,
              password: trimmedPassword,
              redirect: false,
              callbackUrl,
            });

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
        <AccessibleFormField id="login-email" label="Email" required>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField id="login-password" label="Password" required>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        {resetSuccess ? (
          <AuthAlert variant="success">
            Your password was updated. Sign in with your new password.
          </AuthAlert>
        ) : null}

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </form>
    </AuthFormCard>
  );
}
