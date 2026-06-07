"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { normalizeAuthEmail, safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import {
  completeCredentialTwoFactor,
  startCredentialTwoFactor,
} from "@/lib/auth/credential-two-factor-client";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";
import { clientAgentLog } from "@/lib/debug/client-agent-log";

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
    "/dashboard",
  );
  const resetSuccess = searchParams.get("reset") === "success";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorPhoneHint, setTwoFactorPhoneHint] = useState("");
  const [error, setError] = useState("");
  const [missingPhone, setMissingPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isTwoFactorStep = Boolean(twoFactorToken);

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
      <div className="flex flex-col gap-4">
        <OAuthSignInButtons
          providers={oauthProviders}
          callbackUrl={callbackUrl}
          disabled={isLoading}
          labelMode="login"
        />
        <AuthOAuthDivider label="or sign in with email" />
      </div>

      {oauthError ? <AuthAlert variant="error">{oauthError}</AuthAlert> : null}

      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setMissingPhone(false);
          setIsLoading(true);

          try {
            if (isTwoFactorStep) {
              const result = await completeCredentialTwoFactor({
                challengeToken: twoFactorToken,
                code: twoFactorCode,
              });

              if (!result.ok) {
                setError(result.error);
                setIsLoading(false);
                return;
              }

              router.push(callbackUrl);
              router.refresh();
              return;
            }

            const startResult = await startCredentialTwoFactor({
              email,
              password,
            });

            if (startResult.kind === "two-factor-required") {
              setTwoFactorToken(startResult.challengeToken);
              setTwoFactorPhoneHint(startResult.phoneHint);
              setTwoFactorCode("");
              setIsLoading(false);
              return;
            }

            if (startResult.kind === "missing-phone") {
              setMissingPhone(true);
              setError(startResult.error);
              setIsLoading(false);
              return;
            }

            if (startResult.kind === "error") {
              setError(startResult.error);
              setIsLoading(false);
              return;
            }

            clientAgentLog(
              "C",
              "LoginClient.tsx:signInResult",
              "signIn returned",
              { callbackUrl },
            );

            router.push(callbackUrl);
            router.refresh();
          } catch {
            setError("An error occurred. Please try again.");
            setIsLoading(false);
          }
        }}
      >
        {isTwoFactorStep ? (
          <AccessibleFormField
            id="login-two-factor-code"
            label="Verification code"
            hint={`Enter the code sent to ${twoFactorPhoneHint}.`}
            required
          >
            <input
              id="login-two-factor-code"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
              disabled={isLoading}
              className={formInputClass}
            />
          </AccessibleFormField>
        ) : (
          <>
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
          </>
        )}

        {resetSuccess ? (
          <AuthAlert variant="success">
            Your password was updated. Sign in with your new password.
          </AuthAlert>
        ) : null}

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {missingPhone ? (
          <p className="text-sm text-muted-foreground">
            Add a mobile number in{" "}
            <Link
              href="/dashboard/settings/security"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              security settings
            </Link>{" "}
            (sign in with Google or another provider if you use one), or contact
            support.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading
              ? "Signing in…"
              : isTwoFactorStep
                ? "Verify and sign in"
                : "Sign in"}
          </Button>
          {isTwoFactorStep ? (
            <button
              type="button"
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              disabled={isLoading}
              onClick={() => {
                setTwoFactorToken("");
                setTwoFactorCode("");
                setTwoFactorPhoneHint("");
                setError("");
              }}
            >
              Use a different email
            </button>
          ) : null}
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
